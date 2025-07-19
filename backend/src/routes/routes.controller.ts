import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req, Query } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto, RouteResponseDto, UpdateRouteDto } from './dto/create-route.dto'; // Ensure UpdateRouteDto is imported
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decoretor';
import { UserRole } from 'src/users/entities/user.entity';
import { LocationService } from 'src/geo/geo.service'; // Re-add LocationService as it's used in the new calculateRoute logic

@ApiTags('routes')
@ApiBearerAuth()
@Controller('route') // Controller path is 'route'
export class RouteController { // Changed class name to RouteController
  constructor(
    private readonly routeService: RoutesService, // Injected RoutesService
    private readonly locationService: LocationService, // Re-inject LocationService
  ) {}

  private checkRole(req: any, allowedRoles: UserRole[]) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

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

    // 2. Get route using lon, lat pairs (OSRM expects longitude,latitude)
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

  @Post('geocode') // New endpoint for geocoding
  @ApiOperation({ summary: 'Geocode an address to coordinates' })
  @ApiBody({
    schema: {
      example: {
        address: 'Nairobi, Kenya'
      }
    }
  })
  async geocodeAddress(@Body() body: { address: string }) {
    return this.locationService.geocode(body.address);
  }

  @Post()
  @Roles(UserRole.Driver)
  @ApiOperation({ summary: 'Create a new route' })
  @ApiResponse({ status: 201, type: RouteResponseDto })
  async create(@Body() createRouteDto: CreateRouteDto, @Req() req): Promise<RouteResponseDto> {
    this.checkRole(req, [UserRole.Driver]);
    if (createRouteDto.driverId !== req.user.id) {
      throw new ForbiddenException('You can only create routes for yourself');
    }
    return this.routeService.create(createRouteDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Driver, UserRole.Customer)
  @ApiOperation({ summary: 'Get all routes' })
  @ApiResponse({ status: 200, type: [RouteResponseDto] })
  async findAll(@Req() req): Promise<RouteResponseDto[]> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver, UserRole.Customer]);
    if (req.user.role === UserRole.Driver) {
      return this.routeService.findByDriver(req.user.id);
    }
    return this.routeService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Driver, UserRole.Customer)
  @ApiOperation({ summary: 'Get a route by ID' })
  @ApiResponse({ status: 200, type: RouteResponseDto })
  async findOne(@Param('id') id: string, @Req() req): Promise<RouteResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver, UserRole.Customer]);
    const route = await this.routeService.findOne(id);
    if (req.user.role === UserRole.Driver && route.driverId !== req.user.id) {
      throw new ForbiddenException('You can only view your own routes');
    }
    return route;
  }

  @Patch(':id')
  @Roles(UserRole.Driver)
  @ApiOperation({ summary: 'Update a route' })
  @ApiResponse({ status: 200, type: RouteResponseDto })
  async update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto, @Req() req): Promise<RouteResponseDto> {
    this.checkRole(req, [UserRole.Driver]);
    const route = await this.routeService.findOne(id);
    if (route.driverId !== req.user.id) {
      throw new ForbiddenException('You can only update your own routes');
    }
    return this.routeService.update(id, updateRouteDto);
  }

  @Delete(':id')
  @Roles(UserRole.Driver, UserRole.Admin)
  @ApiOperation({ summary: 'Delete a route' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    this.checkRole(req, [UserRole.Driver, UserRole.Admin]);
    const route = await this.routeService.findOne(id);
    if (req.user.role === UserRole.Driver && route.driverId !== req.user.id) {
      throw new ForbiddenException('You can only delete your own routes');
    }
    return this.routeService.remove(id);
  }
}
