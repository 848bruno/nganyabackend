import { Module } from '@nestjs/common';
import { BookingService } from './bookings.service';
import { BookingController } from './bookings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { User } from 'src/users/entities/user.entity';
import { Ride } from 'src/rides/entities/ride.entity';
import { DatabaseModule } from 'src/database/database.module';
import { RideModule } from 'src/rides/rides.module';
@Module({
  imports: [RideModule, DatabaseModule,TypeOrmModule.forFeature([Booking, User, Ride])],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
