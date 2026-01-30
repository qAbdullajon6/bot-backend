import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('search_queries')
export class SearchQuery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  queryText: string;

  @Column({ nullable: true })
  userId: string; // Telegram ID or User ID

  @Column({ nullable: true })
  username: string;

  @Column({ default: false })
  resultsFound: boolean;

  @Column({ default: 0 })
  resultCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
