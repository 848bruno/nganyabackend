// src/rides/rides.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RidesController } from './rides.controller';
import { Ride } from './entities/ride.entity';
import { User } from 'src/users/entities/user.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Route } from 'src/routes/entities/route.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { RidesGateway } from './rides.gateway'; // Import the Gateway
import { RideService } from './rides.service';
import { RouteModule } from 'src/routes/routes.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, User, Vehicle, Booking, Route, Review]),
    forwardRef(() => RouteModule), // Use forwardRef if RoutesModule also imports RidesModule
  ],
  controllers: [RidesController],
  providers: [RideService, RidesGateway], // Add RidesGateway here
  exports: [RideService, RidesGateway], // Export RideService and RidesGateway for use in other modules if needed
})
export class RidesModule {}