import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Request } from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto, UserResponseDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/auth/decorators/roles.decoretor';

import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from './entities/user.entity';


@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {
  }

  private checkRole(req: any, allowedRoles: UserRole[]) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }
  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() createUserDto: CreateUserDto, @Request() req): Promise<UserResponseDto> {
    this.checkRole(req, [UserRole.Admin]);
    return  this.userService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(@Request() req): Promise<UserResponseDto[]> {
    this.checkRole(req, [UserRole.Admin]);
    return await this.userService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(@Param('id') id: string, @Request() req): Promise<UserResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    if (req.user.role !== UserRole.Admin && req.user.id !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }
    const user = await this.userService.findOne(id);
    return {
      ...user,
      role: user.role as UserRole,
    } as UserResponseDto;
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req): Promise<UserResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    if (req.user.role !== UserRole.Admin && req.user.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    this.checkRole(req, [UserRole.Admin]);
    await this.userService.remove(id);
  }

  
}
