import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSynonymDto } from './dto/create-synonym.dto';
import { UpdateSynonymDto } from './dto/update-synonym.dto';
import { Synonym } from './entities/synonym.entity';

@Injectable()
export class SynonymsService {
  constructor(
    @InjectRepository(Synonym)
    private synonymsRepository: Repository<Synonym>,
  ) {}
  create(createSynonymDto: CreateSynonymDto) {
    const synonym = this.synonymsRepository.create(createSynonymDto);
    return this.synonymsRepository.save(synonym);
  }

  findAll() {
    return this.synonymsRepository.find({
        order: { createdAt: 'DESC' }
    });
  }

  findOne(id: number) {
    return this.synonymsRepository.findOneBy({ id });
  }

  async update(id: number, updateSynonymDto: UpdateSynonymDto) {
    await this.synonymsRepository.update(id, updateSynonymDto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.synonymsRepository.delete(id);
  }

  async expandQuery(query: string): Promise<string> {
    // Basic implementation: fetch all and check in memory (assuming low volume)
    // For high volume, we should normalize synonyms into a separate table (synonym -> termId)
    const allSynonyms = await this.findAll();
    const lowerQuery = query.toLowerCase().trim();

    for (const group of allSynonyms) {
        // Check if query exactly matches the term itself (optional, if we want to expand term to term... strictly identity)
        if (group.term.toLowerCase() === lowerQuery) return group.term;

        // Check synonyms list
        const synonymsList = group.synonyms.split(',').map(s => s.trim().toLowerCase());
        if (synonymsList.includes(lowerQuery)) {
            return group.term;
        }
    }
    
    return query;
  }
}
