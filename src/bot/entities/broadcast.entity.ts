import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('broadcasts')
export class Broadcast {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column('simple-array', { nullable: true })
  imagePaths: string[];

  @Column({ default: 'all' })
  audience: string; // 'all', 'subscribed', 'non-subscribed'

  @Column({ default: 'sent' })
  status: string; // 'sent', 'scheduled', 'failed'

  @Column({ default: 0 })
  recipientCount: number;

  @Column({ default: 0 })
  deliveredCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  scheduledFor: Date;
}
