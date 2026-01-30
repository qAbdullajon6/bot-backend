import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Document } from "./entities/document.entity";
import { SearchService } from "../search/search.service";
import * as fs from "fs";
import * as pdf from "pdf-parse";

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private searchService: SearchService,
  ) {}

  async processFile(file: Express.Multer.File) {
    // 1. Save to DB
    const newDoc = this.documentsRepository.create({
      filename: file.filename,
      filepath: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
    const savedDoc = await this.documentsRepository.save(newDoc);

    // 2. Extract text
    let content = "";
    try {
      if (file.mimetype === "application/pdf") {
        const dataBuffer = fs.readFileSync(file.path);
        console.log(`[DEBUG] PDF data buffer size: ${dataBuffer.length}`);
        // @ts-ignore
        const parser = new pdf.PDFParse({ data: dataBuffer });
        const data = await parser.getText();
        content = data.text;
        console.log(
          `[DEBUG] Extracted text length from ${file.originalname}: ${content.length}`,
        );
        if (content.length < 100) {
          console.log("[DEBUG] Extracted text preview:", content);
        } else {
          console.log(
            "[DEBUG] Extracted text start:",
            content.substring(0, 100),
          );
        }
      } else {
        // Fallback for text files or others
        // Only read if it is text-based to avoid binary junk
        if (file.mimetype.startsWith("text/")) {
          content = fs.readFileSync(file.path, "utf8");
        } else {
          content = `File: ${file.originalname}`;
        }
      }
    } catch (e) {
      console.error("[DEBUG] Error extracting text", e);
      content = `Error extracting text from ${file.originalname}`;
    }

    // 3. Index to OpenSearch
    console.log(`[DEBUG] Indexing document ${savedDoc.id} to OpenSearch...`);
    try {
      await this.searchService.indexDocument({
        id: savedDoc.id,
        title: savedDoc.originalName,
        filename: savedDoc.filename,
        content: content,
        uploadedAt: savedDoc.uploadedAt,
      });
      console.log(`[DEBUG] Successfully indexed document ${savedDoc.id}`);
    } catch (e) {
      console.error(`[DEBUG] Failed to index document ${savedDoc.id}`, e);
    }

    return {
      ...savedDoc,
      contentPreview: content.substring(0, 200),
      contentLength: content.length,
    };
  }

  findAll() {
    return this.documentsRepository.find();
  }

  findOne(id: number) {
    return this.documentsRepository.findOneBy({ id });
  }

  async remove(id: number) {
    const doc = await this.documentsRepository.findOneBy({ id });
    if (doc) {
      // Delete file from disk
      try {
        if (fs.existsSync(doc.filepath)) {
          fs.unlinkSync(doc.filepath);
        }
      } catch (e) {
        console.error(`Failed to delete file ${doc.filepath}`, e);
      }

      // Delete from OpenSearch
      await this.searchService.remove(id);

      return this.documentsRepository.remove(doc);
    }
    return null;
  }
}
