// src/rides/rides.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';

import { CreateRideDto, UpdateRideDto, RideResponseDto } from './dto/create-ride.dto';
import { AtGuard } from 'src/auth/guards/at.guard';
import { UserRole } from 'src/users/entities/user.entity';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { User } from 'src/users/entities/user.entity';
import { RideStatus } from './entities/ride.entity';
import { RidesGateway } from './rides.gateway'; // Import RidesGateway
import { IncomingRideRequestDto } from './dto/ride-websocket.dto';
import { RideService } from './rides.service';
import { Roles } from 'src/auth/decorators/roles.decoretor';
import { GetUserWs } from 'src/auth/decorators/get-user-ws.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('rides')
@UseGuards(AtGuard, RolesGuard)
export class RidesController {
  constructor(
    private readonly rideService: RideService,
    private readonly ridesGateway: RidesGateway, // Inject RidesGateway
  ) {}

  @Post()
  @Roles(UserRole.Customer) // Only customers can initiate a ride booking via this endpoint
  async create(
    @Body() createRideDto: CreateRideDto,
    @GetUserWs() customer: User, // Get the authenticated customer
  ): Promise<RideResponseDto> {
    const ride = await this.rideService.create(createRideDto, customer.id); // Pass customer ID to service

    // ⭐ Emit WebSocket event to the driver ⭐
    const payload: IncomingRideRequestDto = {
      rideId: ride.id,
      customerId: customer.id,
      customerName: customer.name || customer.email.split('@')[0], // Use name or part of email
      pickUpLocation: ride.pickUpLocation,
      dropOffLocation: ride.dropOffLocation,
      fare: ride.fare,
      rideType: ride.type,
    };
    await this.ridesGateway.emitIncomingRideRequest(ride.driverId, payload);

    return ride;
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: RideStatus,
    @Query('driverId') driverId: string,
    @Query('customerId') customerId: string,
  ): Promise<{ data: RideResponseDto[], total: number }> {
    return this.rideService.findAll(+page, +limit, status, driverId, customerId);
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  findOne(@Param('id') id: string): Promise<RideResponseDto> {
    return this.rideService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Driver) // Assuming Admin or Driver can update rides
  update(@Param('id') id: string, @Body() updateRideDto: UpdateRideDto): Promise<RideResponseDto> {
    return this.rideService.update(id, updateRideDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin) // Only Admin can delete rides
  remove(@Param('id') id: string): Promise<void> {
    return this.rideService.remove(id);
  }

  // Optional: Add specific endpoints for drivers/customers if not covered by findAll
  @Get('driver/my-rides')
  @Roles(UserRole.Driver)
  findDriverRides(@GetUserWs() driver: User): Promise<RideResponseDto[]> {
    return this.rideService.findByDriver(driver.id);
  }

  @Get('customer/my-rides')
  @Roles(UserRole.Customer)
  findCustomerRides(@GetUserWs() customer: User): Promise<RideResponseDto[]> {
    return this.rideService.findByCustomer(customer.id);
  }
}