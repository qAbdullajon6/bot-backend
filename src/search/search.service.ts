import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { Client } from "@opensearch-project/opensearch";
import { ConfigService } from "@nestjs/config";
import { SearchQuery } from "./entities/search-query.entity";
import { SynonymsService } from "../synonyms/synonyms.service";

@Injectable()
export class SearchService implements OnModuleInit {
  private client: Client;

  constructor(
    private configService: ConfigService,
    @InjectRepository(SearchQuery)
    private searchQueryRepository: Repository<SearchQuery>,
    private readonly synonymsService: SynonymsService,
  ) {
    this.client = new Client({
      node:
        this.configService.get<string>("OPENSEARCH_NODE") ||
        "http://localhost:9200",
      auth: {
        username:
          this.configService.get<string>("OPENSEARCH_USERNAME") || "admin",
        password:
          this.configService.get<string>("OPENSEARCH_PASSWORD") || "admin",
      },
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  async onModuleInit() {
    const indexName = "documents";
    let retries = 30;
    while (retries > 0) {
      try {
        const exists = await this.client.indices.exists({ index: indexName });
        if (!exists.body) {
          console.log(`Index ${indexName} not found. Creating...`);
          await this.client.indices.create({
            index: indexName,
            body: {
              settings: {
                analysis: {
                  analyzer: {
                    default: {
                      type: "standard",
                    },
                  },
                },
              },
              mappings: {
                properties: {
                  title: { type: "text" },
                  content: {
                    type: "text",
                    analyzer: "standard",
                    term_vector: "with_positions_offsets",
                  },
                  filename: { type: "keyword" },
                  uploadedAt: { type: "date" },
                },
              },
            },
          });
          console.log(`Index ${indexName} created.`);
        } else {
          console.log(`Index ${indexName} already exists.`);
        }
        break; // Success
      } catch (error) {
        console.error(
          `Error connecting to OpenSearch (Retries left: ${retries - 1}):`,
          error.message,
        );
        retries--;
        if (retries === 0) {
          console.error(
            "Failed to initialize OpenSearch after multiple attempts.",
          );
        } else {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }
  }

  async indexDocument(document: any) {
    return this.client.index({
      index: "documents",
      body: document,
    });
  }

  async search(query: string, userId?: string, username?: string) {
    // Check for synonyms/expansions
    const expandedQuery = await this.synonymsService.expandQuery(query);
    if (expandedQuery !== query) {
      console.log(`[DEBUG] Query "${query}" expanded to "${expandedQuery}"`);
    } else {
      console.log(`[DEBUG] Searching for query: "${query}"`);
    }

    const finalQuery = expandedQuery;

    try {
      const response = await this.client.search({
        index: "documents",
        body: {
          query: {
            match: {
              content: finalQuery,
            },
          },
          highlight: {
            fields: {
              content: {
                type: "fvh",
                fragment_size: 150,
                number_of_fragments: 3,
              },
            },
          },
        },
      });

      const hits = response.body.hits.hits;
      console.log(`[DEBUG] Found ${hits.length} hits for query "${query}"`);

      // Save search history
      if (userId) {
        const history = this.searchQueryRepository.create({
          userId,
          username,
          queryText: query,
          resultCount: hits.length,
          resultsFound: hits.length > 0,
        });
        await this.searchQueryRepository.save(history);
      }

      return hits.map((hit) => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
        highlight: hit.highlight,
      }));
    } catch (error) {
      console.error("[DEBUG] Search error:", error);
      throw error;
    }
  }

  findAllQueries(period?: string) {
    let whereCondition = {};

    if (period && period !== "all") {
      const now = new Date();
      let fromDate = new Date();

      if (period === "today") {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === "week") {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === "month") {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      whereCondition = {
        createdAt: MoreThanOrEqual(fromDate),
      };
    }

    return this.searchQueryRepository.find({
      where: whereCondition,
      order: { createdAt: "DESC" },
    });
  }

  findAllRecent() {
    return this.searchQueryRepository.find({
      order: { createdAt: "DESC" },
      take: 5,
    });
  }

  findByUserId(userId: string) {
    return this.searchQueryRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async remove(id: number) {
    try {
      await this.client.deleteByQuery({
        index: "documents",
        body: {
          query: {
            match: {
              id: id,
            },
          },
        },
      });
    } catch (e) {
      console.error("Error deleting from OpenSearch", e);
    }
  }
}
