import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { CreateDeliveryDto, DeliveryResponseDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { UserRole } from 'src/types';
import { Roles } from 'src/auth/decorators/roles.decoretor';
import { DeliveryService } from './deliveries.service';

@ApiTags('deliveries')
@ApiBearerAuth()
@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {
    
  }

   private checkRole(req: any, allowedRoles: UserRole[]) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  @Post()
  @Roles(UserRole.Customer)
  @ApiOperation({ summary: 'Create a new delivery' })
  @ApiResponse({ status: 201, type: DeliveryResponseDto })
  async create(@Body() createDeliveryDto: CreateDeliveryDto, @Req() req): Promise<DeliveryResponseDto> {
    this.checkRole(req, [UserRole.Customer]);
    if (createDeliveryDto.userId !== req.user.id) {
      throw new ForbiddenException('You can only create deliveries for yourself');
    }
    return this.deliveryService.create(createDeliveryDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Get all deliveries' })
  @ApiResponse({ status: 200, type: [DeliveryResponseDto] })
  async findAll(@Req() req): Promise<DeliveryResponseDto[]> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    if (req.user.role === UserRole.Customer) {
      return this.deliveryService.findByUser(req.user.id);
    }
    if (req.user.role === UserRole.Driver) {
      return this.deliveryService.findByDriver(req.user.id);
    }
    return this.deliveryService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Get a delivery by ID' })
  @ApiResponse({ status: 200, type: DeliveryResponseDto })
  async findOne(@Param('id') id: string, @Req() req): Promise<DeliveryResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    const delivery = await this.deliveryService.findOne(id);
    if (req.user.role === UserRole.Customer && delivery.userId !== req.user.id) {
      throw new ForbiddenException('You can only view your own deliveries');
    }
    if (req.user.role === UserRole.Driver && delivery.driverId !== req.user.id) {
      throw new ForbiddenException('You can only view your own deliveries');
    }
    return delivery;
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Driver)
  @ApiOperation({ summary: 'Update a delivery' })
  @ApiResponse({ status: 200, type: DeliveryResponseDto })
  async update(@Param('id') id: string, @Body() updateDeliveryDto: UpdateDeliveryDto, @Req() req): Promise<DeliveryResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver]);
    const delivery = await this.deliveryService.findOne(id);
    if (req.user.role === UserRole.Driver && delivery.driverId !== req.user.id) {
      throw new ForbiddenException('You can only update your own deliveries');
    }
    return this.deliveryService.update(id, updateDeliveryDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete a delivery' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer]);
    const delivery = await this.deliveryService.findOne(id);
    if (req.user.role === UserRole.Customer && delivery.userId !== req.user.id) {
      throw new ForbiddenException('You can only delete your own deliveries');
    }
    return this.deliveryService.remove(id);
  }
}
