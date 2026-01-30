import { Module } from '@nestjs/common';
import { SynonymsService } from './synonyms.service';
import { SynonymsController } from './synonyms.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Synonym } from './entities/synonym.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Synonym])],
  controllers: [SynonymsController],
  providers: [SynonymsService],
  exports: [SynonymsService],
})
export class SynonymsModule {}
