import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { SearchQuery } from './entities/search-query.entity';

import { SynonymsModule } from '../synonyms/synonyms.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SearchQuery]),
    SynonymsModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
