// src/bookings/bookings.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingResponseDto, CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { In, Repository } from 'typeorm';
import { Route } from 'src/routes/entities/route.entity';
import { User } from 'src/users/entities/user.entity';
import { Ride } from 'src/rides/entities/ride.entity';
import { Booking, BookingStatus, BookingType } from './entities/booking.entity'; // Import BookingStatus and BookingType
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private toBookingResponseDto(booking: Booking): BookingResponseDto {
    // FIX: Changed 'seatNumber' to 'numberOfSeats' and added 'fareAtBooking'
    const { id, userId, rideId, type, numberOfSeats, fareAtBooking, createdAt, updatedAt, status } = booking;
    return {
      id,
      userId,
      rideId,
      type: type, // Now correctly typed as BookingType
      numberOfSeats, // Corrected property name
      fareAtBooking, // Added this property
      createdAt,
      updatedAt,
      status: status, // Now correctly typed as BookingStatus
      // You might also want to include user and ride objects if they are eager loaded
      // user: booking.user,
      // ride: booking.ride,
    };
  }

  async create(createBookingDto: CreateBookingDto): Promise<BookingResponseDto> {
    const user = await this.userRepository.findOneBy({ id: createBookingDto.userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const ride = await this.rideRepository.findOneBy({ id: createBookingDto.rideId });
    if (!ride) {
      throw new BadRequestException('Ride not found');
    }

    // FIX: Use createBookingDto.numberOfSeats instead of seatNumber
    if (createBookingDto.type === BookingType.Ride && ride.type === 'carpool' && createBookingDto.numberOfSeats) {
      if (!ride.routeId) {
        throw new BadRequestException('Carpool ride must have an associated route.');
      }
      const route = await this.rideRepository.manager.getRepository(Route).findOne({ where: { id: ride.routeId } });
      if (route && createBookingDto.numberOfSeats > route.availableSeats) {
        throw new BadRequestException('Seat number exceeds available seats for this route.');
      }
    }
    const booking = this.bookingRepository.create(createBookingDto);
    await this.bookingRepository.save(booking);
    return this.toBookingResponseDto(booking);
  }

  async findAll(): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.find(); // Consider adding relations here if needed for DTO
    return bookings.map(this.toBookingResponseDto);
  }

  async findByUser(userId: string): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.find({ where: { userId } }); // Consider adding relations here
    return bookings.map(this.toBookingResponseDto);
  }

  async findByDriver(driverId: string): Promise<BookingResponseDto[]> {
    const rides = await this.rideRepository.find({ where: { driverId } });
    const rideIds = rides.map(ride => ride.id);
    const bookings = await this.bookingRepository.find({ where: { rideId: In(rideIds) } }); // Consider adding relations here
    return bookings.map(this.toBookingResponseDto);
  }

  async findOne(id: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOneBy({ id }); // Consider adding relations here
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return this.toBookingResponseDto(booking);
  }

  async update(id: string, updateBookingDto: UpdateBookingDto): Promise<BookingResponseDto> {
    const bookingEntity = await this.bookingRepository.findOneBy({ id }); // Consider adding relations here
    if (!bookingEntity) {
      throw new NotFoundException('Booking not found');
    }
    Object.assign(bookingEntity, updateBookingDto);
    await this.bookingRepository.save(bookingEntity);
    return this.toBookingResponseDto(bookingEntity);
  }

  async remove(id: string): Promise<void> {
    const booking = await this.bookingRepository.findOneBy({ id });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    await this.bookingRepository.remove(booking);
  }
}