import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Payment } from '../../payments/entities/payment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true, nullable: true })
  telegramId: string; // BigInt is returned as string in JS

  @Column({ nullable: true })
  username: string; // Telegram username or Dashboard login username

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ default: 0 })
  freeQueriesUsed: number;

  @Column({ default: 0 })
  paidQueriesUsed: number;

  @Column({ default: false })
  hasSubscription: boolean;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEnd: Date;

  @Column({ nullable: true })
  password: string; // For dashboard login

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isBlocked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];
}
