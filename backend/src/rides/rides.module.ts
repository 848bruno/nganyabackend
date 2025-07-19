import { Module } from '@nestjs/common';
import { RideService } from './rides.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';

import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { DatabaseModule } from 'src/database/database.module';
import { RidesController } from './rides.controller';
import { Route } from 'src/routes/entities/route.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Ride, User, Vehicle, Route, Booking, Review])], // Added Review to forFeature
  controllers: [RidesController], // Corrected controller name
  providers: [RideService], // Corrected service name
  exports: [RideService, TypeOrmModule.forFeature([Ride])],
})
export class RideModule {}