import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req } from '@nestjs/common';
import { RideService } from './rides.service';
import { CreateRideDto, RideResponseDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { UserRole } from 'src/types';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decoretor';

@ApiTags('rides')
@ApiBearerAuth()
@Controller('rides')
export class RideController  {
  constructor(private readonly rideService: RideService) {
    
  }

   private checkRole(req: any, allowedRoles: UserRole[]) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  @Post()
  @Roles(UserRole.Driver)
  @ApiOperation({ summary: 'Create a new ride' })
  @ApiResponse({ status: 201, type: RideResponseDto })
  async create(@Body() createRideDto: CreateRideDto, @Req() req): Promise<RideResponseDto> {
    this.checkRole(req, [UserRole.Driver]);
    if (createRideDto.driverId !== req.user.id) {
      throw new ForbiddenException('You can only create rides for yourself');
    }
    return this.rideService.create(createRideDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Driver, UserRole.Customer)
  @ApiOperation({ summary: 'Get all rides' })
  @ApiResponse({ status: 200, type: [RideResponseDto] })
  async findAll(@Req() req): Promise<RideResponseDto[]> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver, UserRole.Customer]);
    if (req.user.role === UserRole.Driver) {
      return this.rideService.findByDriver(req.user.id);
    }
    if (req.user.role === UserRole.Customer) {
      return this.rideService.findByCustomer(req.user.id);
    }
    return this.rideService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Driver, UserRole.Customer)
  @ApiOperation({ summary: 'Get a ride by ID' })
  @ApiResponse({ status: 200, type: RideResponseDto })
  async findOne(@Param('id') id: string, @Req() req): Promise<RideResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver, UserRole.Customer]);
    const ride = await this.rideService.findOne(id);
    if (req.user.role === UserRole.Driver && ride.driverId !== req.user.id) {
      throw new ForbiddenException('You can only view your own rides');
    }
    if (req.user.role === UserRole.Customer) {
      const booking = await this.rideService.findBookingByRideAndUser(id, req.user.id);
      if (!booking) {
        throw new ForbiddenException('You can only view rides you have booked');
      }
    }
    return ride;
  }

  @Patch(':id')
  @Roles(UserRole.Driver, UserRole.Admin)
  @ApiOperation({ summary: 'Update a ride' })
  @ApiResponse({ status: 200, type: RideResponseDto })
  async update(@Param('id') id: string, @Body() updateRideDto: UpdateRideDto, @Req() req): Promise<RideResponseDto> {
    this.checkRole(req, [UserRole.Driver, UserRole.Admin]);
    const ride = await this.rideService.findOne(id);
    if (req.user.role === UserRole.Driver && ride.driverId !== req.user.id) {
      throw new ForbiddenException('You can only update your own rides');
    }
    return this.rideService.update(id, updateRideDto);
  }

  @Delete(':id')
  @Roles(UserRole.Driver, UserRole.Admin)
  @ApiOperation({ summary: 'Delete a ride' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    this.checkRole(req, [UserRole.Driver, UserRole.Admin]);
    const ride = await this.rideService.findOne(id);
    if (req.user.role === UserRole.Driver && ride.driverId !== req.user.id) {
      throw new ForbiddenException('You can only delete your own rides');
    }
    return this.rideService.remove(id);
  }
}