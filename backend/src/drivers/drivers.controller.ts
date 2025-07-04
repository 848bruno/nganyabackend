import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req } from '@nestjs/common';
import { DriverService } from './drivers.service';
import { CreateDriverDto, DriverResponseDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

import { Roles } from 'src/auth/decorators/roles.decoretor';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from 'src/users/entities/user.entity';


@ApiTags('drivers')
@ApiBearerAuth()
@Controller('drivers')
export class DriverController {
  constructor(private readonly driverService: DriverService) {
  }

  protected checkRole(req: any, roles: UserRole[]): void {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create a new driver' })
  @ApiResponse({ status: 201, type: DriverResponseDto })
  async create(@Body() createDriverDto: CreateDriverDto, @Req() req): Promise<DriverResponseDto> {
    this.checkRole(req, [UserRole.Admin]);
    return await this.driverService.create(createDriverDto);
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
      const driver = await this.driverService.findOne(id);
      if (driver.userId !== req.user.id) {
        throw new ForbiddenException('You can only view your own driver profile');
      }
      return driver;
    }
    return this.driverService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Driver)
  @ApiOperation({ summary: 'Update a driver' })
  @ApiResponse({ status: 200, type: DriverResponseDto })
  async update(@Param('id') id: string, @Body() updateDriverDto:UpdateDriverDto, @Req() req): Promise<DriverResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver]);
    if (req.user.role === UserRole.Driver) {
      const driver = await this.driverService.findOne(id);
      if (driver.userId !== req.user.id) {
        throw new ForbiddenException('You can only update your own driver profile');
      }
    }
    return await this.driverService.update(id, updateDriverDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete a driver' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    this.checkRole(req, [UserRole.Admin]);
    await this.driverService.remove(id);
  }
}
