import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.appService.getDashboardStats();
  }

  @Get('dashboard/charts')
  async getDashboardCharts() {
    return this.appService.getDashboardCharts();
  }

  @Get('dashboard/recent-activity')
  async getRecentActivity() {
    return this.appService.getRecentActivity();
  }
}
