import { Module } from '@nestjs/common';
import { PaymentService } from './payments.service';
import { PaymentController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { User } from 'src/users/entities/user.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { DatabaseModule } from 'src/database/database.module';




@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Payment, User, Booking])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
