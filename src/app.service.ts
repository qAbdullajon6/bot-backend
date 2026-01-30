import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Document } from './documents/entities/document.entity';
import { PaymentsService } from './payments/payments.service';
import { SearchService } from './search/search.service';

import { SearchQuery } from './search/entities/search-query.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private paymentsService: PaymentsService,
    private searchService: SearchService,
    @InjectRepository(SearchQuery)
    private searchQueryRepository: Repository<SearchQuery>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDashboardStats() {
    const totalUsers = await this.usersRepository.count();
    const activeSubscriptions = await this.usersRepository.count({ where: { hasSubscription: true } });
    const totalDocuments = await this.documentsRepository.count();
    const totalSearches = await this.searchQueryRepository.count();

    return {
      totalUsers,
      activeSubscriptions,
      totalDocuments,
      totalSearches,
    };
  }

  async getDashboardCharts() {
    // Generate last 6 months array
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }

    // User Growth (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .select("TO_CHAR(user.createdAt, 'Mon')", 'name')
      .addSelect("COUNT(user.id)", 'total')
      .where("user.createdAt >= :date", { date: sixMonthsAgo })
      .groupBy("TO_CHAR(user.createdAt, 'Mon')")
      .getRawMany();

    // Map users to months
    const userGrowth = months.map(month => {
      const found = users.find(u => u.name === month);
      return { name: month, total: found ? parseInt(found.total) : 0 };
    });

    // Revenue (from PaymentsService)
    const revenueStats = await this.paymentsService.getRevenueStats();
    
    // Map revenue to months
    const revenue = months.map(month => {
        const found = revenueStats.find((r: any) => r.name === month);
        return { name: month, total: found ? found.total : 0 };
    });

    return {
      userGrowth,
      revenue,
    };
  }

  async getRecentActivity() {
    const recentUsers = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // We need a method in SearchService to get recent searches
    // Assuming we add it. For now let's stub or implement it.
    // I'll add findAllRecent to SearchService.
    const recentSearches = await this.searchService.findAllRecent();

    return {
      recentUsers: recentUsers.map(u => ({
        id: u.id,
        name: u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.username || 'Unknown',
        email: u.username ? `@${u.username}` : 'No username', // Using username as email/handle
        avatar: u.photoUrl || '/placeholder.svg', // Use photoUrl if available
        initials: (u.firstName?.[0] || u.username?.[0] || '?').toUpperCase(),
      })),
      recentSearches: recentSearches.map(s => ({
        id: s.id,
        query: s.queryText,
        user: s.username || 'Anonymous',
        time: s.createdAt,
      })),
    };
  }
}
