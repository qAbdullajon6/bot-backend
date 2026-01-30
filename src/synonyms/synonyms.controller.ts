import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SynonymsService } from './synonyms.service';
import { CreateSynonymDto } from './dto/create-synonym.dto';
import { UpdateSynonymDto } from './dto/update-synonym.dto';

@Controller('synonyms')
export class SynonymsController {
  constructor(private readonly synonymsService: SynonymsService) {}

  @Post()
  create(@Body() createSynonymDto: CreateSynonymDto) {
    return this.synonymsService.create(createSynonymDto);
  }

  @Get()
  findAll() {
    return this.synonymsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.synonymsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSynonymDto: UpdateSynonymDto) {
    return this.synonymsService.update(+id, updateSynonymDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.synonymsService.remove(+id);
  }
}
