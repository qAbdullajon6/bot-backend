import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('synonyms')
export class Synonym {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  term: string;

  @Column('text')
  synonyms: string; // Comma separated list for simplicity

  @CreateDateColumn()
  createdAt: Date;
}
