import { Module } from '@nestjs/common';
import { DriverService } from './drivers.service';
import { DriverController } from './drivers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { Driver } from './entities/driver.entity';
import { User } from 'src/users/entities/user.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Driver, User, Vehicle])],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
