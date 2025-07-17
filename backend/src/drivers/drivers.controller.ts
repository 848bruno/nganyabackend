// src/drivers/drivers.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req } from '@nestjs/common';
import { DriverService } from './drivers.service';
import { CreateDriverDto, DriverResponseDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

import { Roles } from 'src/auth/decorators/roles.decoretor';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UserRole } from 'src/users/entities/user.entity';
import { IsNumber, IsUUID } from 'class-validator'; // Add IsUUID

// DTO for location update payload
class DriverLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

@ApiTags('drivers')
@ApiBearerAuth()
@Controller('drivers')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  protected checkRole(req: any, roles: UserRole[]): void {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  // ⭐ MODIFIED: Create Driver - now requires userId from request if admin creates it ⭐
  @Post()
  @Roles(UserRole.Admin) // Only Admin can create a driver profile for a user
  @ApiOperation({ summary: 'Create a new driver profile for an existing user (admin only)' })
  @ApiResponse({ status: 201, type: DriverResponseDto })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid', description: 'ID of the user who will be the driver' },
        licenseNumber: { type: 'string', example: 'XYZ12345' },
        // ... other CreateDriverDto properties
      },
      required: ['userId', 'licenseNumber'],
    },
  })
  async create(@Body() body: { userId: string } & CreateDriverDto, @Req() req): Promise<DriverResponseDto> {
    this.checkRole(req, [UserRole.Admin]);
    // Admin provides the userId for which to create the driver profile
    return await this.driverService.create(body.userId, body);
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get all drivers' })
  @ApiResponse({ status: 200, type: [DriverResponseDto] })
  async findAll(@Req() req): Promise<DriverResponseDto[]> {
    this.checkRole(req, [UserRole.Admin]);
    return this.driverService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Driver)
  @ApiOperation({ summary: 'Get a driver by ID' })
  @ApiResponse({ status: 200, type: DriverResponseDto })
  async findOne(@Param('id') id: string, @Req() req): Promise<DriverResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver]);
    if (req.user.role === UserRole.Driver) {
      // A driver can only view their own profile
      if (id !== req.user.id) {
        throw new ForbiddenException('You can only view your own driver profile');
      }
    }
    return this.driverService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Driver)
  @ApiOperation({ summary: 'Update a driver profile' })
  @ApiResponse({ status: 200, type: DriverResponseDto })
  async update(@Param('id') id: string, @Body() updateDriverDto:UpdateDriverDto, @Req() req): Promise<DriverResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver]);
    if (req.user.role === UserRole.Driver) {
      // A driver can only update their own profile
      if (id !== req.user.id) {
        throw new ForbiddenException('You can only update your own driver profile');
      }
    }
    return await this.driverService.update(id, updateDriverDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete a driver profile (admin only)' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    this.checkRole(req, [UserRole.Admin]);
    await this.driverService.remove(id);
  }

  // ⭐ NEW ENDPOINT: Update authenticated driver's location and set online status ⭐
  @Post('location')
  @Roles(UserRole.Driver)
  @ApiOperation({ summary: 'Update authenticated driver\'s current location and set them online' })
  @ApiResponse({ status: 200, type: DriverResponseDto })
  @ApiBody({ type: DriverLocationDto })
  async updateLocation(@Body() locationDto: DriverLocationDto, @Req() req): Promise<DriverResponseDto> {
    this.checkRole(req, [UserRole.Driver]);
    // The driver's ID is the same as the authenticated user's ID
    const driverId = req.user.id;
    return await this.driverService.updateDriverLocation(
      driverId,
      locationDto.latitude,
      locationDto.longitude,
    );
  }

  // ⭐ NEW ENDPOINT: Get authenticated driver's dashboard statistics ⭐
  @Get('me/stats')
  @Roles(UserRole.Driver)
  @ApiOperation({ summary: 'Get authenticated driver\'s dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Driver dashboard statistics' })
  async getMyStats(@Req() req): Promise<any> { // Consider defining a specific DTO for the response
    this.checkRole(req, [UserRole.Driver]);
    const driverId = req.user.id; // The driver's ID is the authenticated user's ID
    return await this.driverService.getDriverStats(driverId);
  }
}