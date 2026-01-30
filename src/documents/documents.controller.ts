import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  Delete,
  Res,
  NotFoundException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { DocumentsService } from "./documents.service";
import { Response } from "express";

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.documentsService.processFile(file);
  }

  @Get()
  findAll() {
    return this.documentsService.findAll();
  }

  @Get(":id/download")
  async download(@Param("id") id: string, @Res() res: Response) {
    const doc = await this.documentsService.findOne(+id);
    if (!doc) {
      throw new NotFoundException("Document not found");
    }
    res.download(doc.filepath, doc.originalName);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.documentsService.remove(+id);
  }
}
