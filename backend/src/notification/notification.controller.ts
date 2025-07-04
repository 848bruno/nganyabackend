import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, NotificationResponseDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

import { Roles } from 'src/auth/decorators/roles.decoretor';
import { UserRole } from 'src/users/entities/user.entity';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {
  
  }

   private checkRole(req: any, allowedRoles: UserRole[]) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, type: NotificationResponseDto })
  async create(@Body() createNotificationDto: CreateNotificationDto, @Req() req): Promise<NotificationResponseDto> {
    this.checkRole(req, [UserRole.Admin]);
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, type: [NotificationResponseDto] })
  async findAll(@Req() req): Promise<NotificationResponseDto[]> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    if (req.user.role === UserRole.Customer || req.user.role === UserRole.Driver) {
      return this.notificationService.findByUser(req.user.id);
    }
    return this.notificationService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async findOne(@Param('id') id: string, @Req() req): Promise<NotificationResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    const notification = await this.notificationService.findOne(id);
    if ((req.user.role === UserRole.Customer || req.user.role === UserRole.Driver) && notification.userId !== req.user.id) {
      throw new ForbiddenException('You can only view your own notifications');
    }
    return notification;
  }

  @Patch(':id')
  @Roles(UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Update a notification' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto, @Req() req): Promise<NotificationResponseDto> {
    this.checkRole(req, [UserRole.Customer, UserRole.Driver]);
    const notification = await this.notificationService.findOne(id);
    if ((req.user.role === UserRole.Customer || req.user.role === UserRole.Driver) && notification.userId !== req.user.id) {
      throw new ForbiddenException('You can only update your own notifications');
    }
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    const notification = await this.notificationService.findOne(id);
    if ((req.user.role === UserRole.Customer || req.user.role === UserRole.Driver) && notification.userId !== req.user.id) {
      throw new ForbiddenException('You can only delete your own notifications');
    }
    await this.notificationService.remove(id);
  }
}