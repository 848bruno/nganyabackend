import { Module } from '@nestjs/common';

import { RouteController } from './routes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { Route } from './entities/route.entity';
import { RoutesService } from './routes.service';
import { UsersModule } from 'src/users/users.module';
import { GeoModule } from 'src/geo/geo.module';


@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Route]), UsersModule, GeoModule],
  controllers: [RouteController],
  providers: [RoutesService],
  exports: [RoutesService, TypeOrmModule.forFeature([Route])],
})
export class RouteModule {}