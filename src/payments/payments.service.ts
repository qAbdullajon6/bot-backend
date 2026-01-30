import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {}

  create(data: Partial<Payment>) {
    const payment = this.paymentsRepository.create(data);
    return this.paymentsRepository.save(payment);
  }

  findAll() {
    return this.paymentsRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRevenueStats() {
    const payments = await this.paymentsRepository.find();
    // Group by month
    const revenueByMonth = {};
    payments.forEach(payment => {
      const date = new Date(payment.createdAt);
      const month = date.toLocaleString('default', { month: 'short' });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(payment.amount);
    });

    return Object.keys(revenueByMonth).map(month => ({
      name: month,
      total: revenueByMonth[month],
    }));
  }
}
