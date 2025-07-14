import {  Get, Patch, Param, Delete, Query, InternalServerErrorException } from '@nestjs/common';
import { LocationService } from './geo.service';
import { CreateGeoDto } from './dto/create-geo.dto';
import { UpdateGeoDto } from './dto/update-geo.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators';
import { Body, Controller, Post } from '@nestjs/common';
// updated import
@ApiBearerAuth()
@ApiTags('Route') 
@Controller('route')
export class RouteController {
  constructor(private readonly locationService: LocationService) {}
@Public()
  @Post('calculate')
    @ApiOperation({ summary: 'Calculate route between two addresses' }) 
  @ApiBody({
    schema: {
      example: {
        pickup: 'Nairobi',
        dropoff: 'Mombasa'
      }
    }
  })
  async calculateRoute(@Body() body: { pickup: string; dropoff: string }) {
    // 1. Geocode both addresses
    const [start, end] = await Promise.all([
      this.locationService.geocode(body.pickup),
      this.locationService.geocode(body.dropoff)
    ]);

    // 2. Get route using lon, lat pairs
    const route = await this.locationService.getRoute(
      [start.lon, start.lat],
      [end.lon, end.lat]
    );

    // 3. Return enriched route response
    return {
      start,
      end,
      distance: route.distance, // meters
      duration: route.duration, // seconds
      geometry: route.geometry, // GeoJSON LineString
      instructions: route.legs[0].steps.map(step => ({
        distance: step.distance,
        duration: step.duration,
        instruction: step.maneuver.instruction,
        location: step.maneuver.location
      }))
    };
  }
}
