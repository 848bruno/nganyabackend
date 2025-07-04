import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, VehicleResponseDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

import { Roles } from 'src/auth/decorators/roles.decoretor';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserRole } from 'src/users/entities/user.entity';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {
  
  }

   private checkRole(req: any, allowedRoles: UserRole[]) {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenException('You do not have permission to perform this action');
      }
    }


  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({ status: 201, type: VehicleResponseDto })
  async create(@Body() createVehicleDto: CreateVehicleDto, @Req() req): Promise<VehicleResponseDto> {
    this.checkRole(req, [UserRole.Admin]);
    return await this.vehicleService.create(createVehicleDto);
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get all vehicles' })
  @ApiResponse({ status: 200, type: [VehicleResponseDto] })
  async findAll(@Req() req): Promise<VehicleResponseDto[]> {
    this.checkRole(req, [UserRole.Admin]);
    return await this.vehicleService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Driver)
  @ApiOperation({ summary: 'Get a vehicle by ID' })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  async findOne(@Param('id') id: string, @Req() req): Promise<VehicleResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver]);
    return await this.vehicleService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiResponse({ status: 200, type: VehicleResponseDto })
  async update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto, @Req() req): Promise<VehicleResponseDto> {
    this.checkRole(req, [UserRole.Admin]);
    return await this.vehicleService.update(
      id, updateVehicleDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete a vehicle' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    this.checkRole(req, [UserRole.Admin]);
    await this.vehicleService.remove(id);
  }
}