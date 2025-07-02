import { Module } from '@nestjs/common';
import { RouteService } from './routes.service';
import { RouteController } from './routes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { Route } from './entities/route.entity';
import { Driver } from 'src/drivers/entities/driver.entity';

@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Route, Driver])],
  controllers: [RouteController],
  providers: [RouteService],
  exports: [RouteService],
})
export class RouteModule {}