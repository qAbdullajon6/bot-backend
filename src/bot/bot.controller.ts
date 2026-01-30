import { Controller, Post, Body, UploadedFiles, UseInterceptors, Get } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BotService } from './bot.service';

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('broadcast')
  @UseInterceptors(FilesInterceptor('images', 5)) // Allow up to 5 images
  async broadcast(@Body() body: { message: string; scheduledFor?: string; audience?: string }, @UploadedFiles() files?: Array<Express.Multer.File>) {
    const imagePaths = files ? files.map(file => file.path) : [];
    const scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : undefined;
    await this.botService.broadcast(body.message, imagePaths, scheduledFor, body.audience);
    return { success: true };
  }

  @Get('history')
  getHistory() {
    return this.botService.findAllBroadcasts();
  }

  @Get('stats')
  getStats() {
    return this.botService.getStats();
  }
}
