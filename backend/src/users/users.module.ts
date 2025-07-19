import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

import { GeoModule } from 'src/geo/geo.module';
import { Ride } from 'src/rides/entities/ride.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Vehicle, Ride]),
    GeoModule, 
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule.forFeature([User])], 
})
export class UsersModule {}
