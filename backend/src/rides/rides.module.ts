import { Module } from '@nestjs/common';
import { RideService } from './rides.service';
import { RideController } from './rides.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Ride, Driver, Vehicle, Booking])],
  controllers: [RideController],
  providers: [RideService],
  exports: [RideService],
})
export class RideModule {}