import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req } from '@nestjs/common';
import { RouteService } from './routes.service';
import { CreateRouteDto, RouteResponseDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decoretor';
import { UserRole } from 'src/users/entities/user.entity';


@ApiTags('routes')
@ApiBearerAuth()
@Controller('routes')
export class RouteController{
  constructor(private readonly routeService: RouteService) {
    
  }

   private checkRole(req: any, allowedRoles: UserRole[]) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
 
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