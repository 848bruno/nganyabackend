import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto, PaymentResponseDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Booking } from 'src/bookings/entities/booking.entity';
import { User } from 'src/users/entities/user.entity';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  private toPaymentResponseDto(payment: Payment): PaymentResponseDto {
    // Assumes PaymentResponseDto has the same fields as Payment, except 'method' is PaymentMethod
    // and Payment.entity 'method' is string. Adjust as needed.
    const { id, amount, method, userId, bookingId, createdAt, updatedAt, status, transactionId } = payment;
    return {
      id,
      amount,
      method: method as any, // Cast string to PaymentMethod
      userId,
      bookingId,
      createdAt,
      updatedAt,
      status: status as any, // Cast string to PaymentStatus
      transactionId,
    };
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const user = await this.userRepository.findOneBy({ id: createPaymentDto.userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (createPaymentDto.bookingId) {
      const booking = await this.bookingRepository.findOneBy({ id: createPaymentDto.bookingId });
      if (!booking) {
        throw new BadRequestException('Booking not found');
      }
    }
    const payment = this.paymentRepository.create(createPaymentDto);
    await this.paymentRepository.save(payment);
    return this.toPaymentResponseDto(payment);
  }

  async findAll(): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentRepository.find();
    return payments.map(payment => this.toPaymentResponseDto(payment));
  }

  async findByUser(userId: string): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentRepository.find({ where: { userId } });
    return payments.map(payment => this.toPaymentResponseDto(payment));
  }

  async findOne(id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findOneBy({ id });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return this.toPaymentResponseDto(payment);
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<PaymentResponseDto> {
    const paymentEntity = await this.paymentRepository.findOneBy({ id });
    if (!paymentEntity) {
      throw new NotFoundException('Payment not found');
    }
    Object.assign(paymentEntity, updatePaymentDto);
    await this.paymentRepository.save(paymentEntity);
    return this.toPaymentResponseDto(paymentEntity);
  }

  async remove(id: string): Promise<void> {
    const payment = await this.paymentRepository.findOneBy({ id });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    await this.paymentRepository.remove(payment);
  }
}