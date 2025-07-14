import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RouteController } from './geo.controller';
import { LocationService } from './geo.service';

@Module({
  imports: [HttpModule],
  controllers: [RouteController],
  providers: [LocationService],
})
export class GeoModule {}
