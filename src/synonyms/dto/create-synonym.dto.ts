import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSynonymDto {
  @IsString()
  @IsNotEmpty()
  term: string;

  @IsString()
  @IsNotEmpty()
  synonyms: string;
}
