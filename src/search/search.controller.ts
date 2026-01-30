import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query("q") query: string) {
    return this.searchService.search(query, "admin", "admin");
  }

  @Post("index")
  async indexDocument(@Body() document: any) {
    return this.searchService.indexDocument(document);
  }

  @Get("history")
  getHistory(@Query("period") period?: string) {
    return this.searchService.findAllQueries(period);
  }
}
