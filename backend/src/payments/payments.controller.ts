import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req } from '@nestjs/common';
import { PaymentService } from './payments.service';
import { CreatePaymentDto, PaymentResponseDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

import { Roles } from 'src/auth/decorators/roles.decoretor';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from 'src/users/entities/user.entity';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController  {
  constructor(private readonly paymentService: PaymentService) {
    
  }

   private checkRole(req: any, allowedRoles: UserRole[]) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  @Post()
  @Roles(UserRole.Customer)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  async create(@Body() createPaymentDto: CreatePaymentDto, @Req() req): Promise<PaymentResponseDto> {
    this.checkRole(req, [UserRole.Customer]);
    if (createPaymentDto.userId !== req.user.id) {
      throw new ForbiddenException('You can only create payments for yourself');
    }
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Customer)
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, type: [PaymentResponseDto] })
  async findAll(@Req() req): Promise<PaymentResponseDto[]> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer]);
    if (req.user.role === UserRole.Customer) {
      return this.paymentService.findByUser(req.user.id);
    }
    return this.paymentService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Customer)
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async findOne(@Param('id') id: string, @Req() req): Promise<PaymentResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer]);
    const payment = await this.paymentService.findOne(id);
    if (req.user.role === UserRole.Customer && payment.userId !== req.user.id) {
      throw new ForbiddenException('You can only view your own payments');
    }
    return payment;
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update a payment' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto, @Req() req): Promise<PaymentResponseDto> {
    this.checkRole(req, [UserRole.Admin]);
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    this.checkRole(req, [UserRole.Admin]);
    return this.paymentService.remove(id);
  }
}