import { Module } from '@nestjs/common';

import { RouteController } from './routes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { Route } from './entities/route.entity';
import { RoutesService } from './routes.service';
import { UsersModule } from 'src/users/users.module';


@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Route]), UsersModule],
  controllers: [RouteController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RouteModule {}