import { Module } from '@nestjs/common';
import { DeliveryService } from './deliveries.service';
import { DeliveryController } from './deliveries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { Delivery } from './entities/delivery.entity';
import { User } from 'src/users/entities/user.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Delivery, User, Driver, Vehicle])],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
