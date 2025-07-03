import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req } from '@nestjs/common';
import { BookingService } from './bookings.service';
import { BookingResponseDto, CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UserRole } from 'src/types';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decoretor';
import { RideService } from '../rides/rides.service';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController{
  constructor(
    private readonly bookingService: BookingService,
    private readonly rideService: RideService
  ) {
  
  }

   private checkRole(req: any, allowedRoles: UserRole[]) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  @Post()
  @Roles(UserRole.Customer)
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req): Promise<BookingResponseDto> {
    this.checkRole(req, [UserRole.Customer]);
    if (createBookingDto.userId !== req.user.id) {
      throw new ForbiddenException('You can only create bookings for yourself');
    }
    return this.bookingService.create(createBookingDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, type: [BookingResponseDto] })
  async findAll(@Req() req): Promise<BookingResponseDto[]> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    if (req.user.role === UserRole.Customer) {
      return this.bookingService.findByUser(req.user.id);
    }
    if (req.user.role === UserRole.Driver) {
      return this.bookingService.findByDriver(req.user.id);
    }
    return this.bookingService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Get a booking by ID' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async findOne(@Param('id') id: string, @Req() req): Promise<BookingResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    const booking = await this.bookingService.findOne(id);
    if (req.user.role === UserRole.Customer && booking.userId !== req.user.id) {
      throw new ForbiddenException('You can only view your own bookings');
    }
    if (req.user.role === UserRole.Driver) {
      const ride = await this.rideService.findOne(booking.rideId);
      if (ride.driverId !== req.user.id) {
        throw new ForbiddenException('You can only view bookings for your rides');
      }
    }
    return booking;
  }

  @Patch(':id')
  @Roles(UserRole.Customer, UserRole.Admin)
  @ApiOperation({ summary: 'Update a booking' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto, @Req() req): Promise<BookingResponseDto> {
    this.checkRole(req, [UserRole.Customer, UserRole.Admin]);
    const booking = await this.bookingService.findOne(id);
    if (req.user.role === UserRole.Customer && booking.userId !== req.user.id) {
      throw new ForbiddenException('You can only update your own bookings');
    }
    return this.bookingService.update(id, updateBookingDto);
  }

  @Delete(':id')
  @Roles(UserRole.Customer, UserRole.Admin)
  @ApiOperation({ summary: 'Delete a booking' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    this.checkRole(req, [UserRole.Customer, UserRole.Admin]);
    const booking = await this.bookingService.findOne(id);
    if (req.user.role === UserRole.Customer && booking.userId !== req.user.id) {
      throw new ForbiddenException('You can only delete your own bookings');
    }
    return this.bookingService.remove(id);
  }
}
