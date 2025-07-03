import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingResponseDto, CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { In, Repository } from 'typeorm';
import { Route } from 'src/routes/entities/route.entity';
import { User } from 'src/users/entities/user.entity';
import { Ride } from 'src/rides/entities/ride.entity';
import { Booking } from './entities/booking.entity';
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
    // Adjust this mapping as needed to match BookingResponseDto structure
    const { id, userId, rideId, type, seatNumber, createdAt, updatedAt, status } = booking;
    return {
      id,
      userId,
      rideId,
      type: type as any, // Cast to BookingType if needed
      seatNumber,
      createdAt,
      updatedAt,
      status: status as any, // Cast to BookingStatus if needed
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
    if (createBookingDto.type === 'ride' && ride.type === 'carpool' && createBookingDto.seatNumber) {
      const route = await this.rideRepository.manager.getRepository(Route).findOne({ where: { id: ride.routeId } });
      if (route && createBookingDto.seatNumber > route.availableSeats) {
        throw new BadRequestException('Seat number exceeds available seats');
      }
    }
    const booking = this.bookingRepository.create(createBookingDto);
    await this.bookingRepository.save(booking);
    return this.toBookingResponseDto(booking);
  }

  async findAll(): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.find();
    return bookings.map(this.toBookingResponseDto);
  }

  async findByUser(userId: string): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.find({ where: { userId } });
    return bookings.map(this.toBookingResponseDto);
  }

  async findByDriver(driverId: string): Promise<BookingResponseDto[]> {
    const rides = await this.rideRepository.find({ where: { driverId } });
    const rideIds = rides.map(ride => ride.id);
    const bookings = await this.bookingRepository.find({ where: { rideId: In(rideIds) } });
    return bookings.map(this.toBookingResponseDto);
  }

  async findOne(id: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOneBy({ id });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return this.toBookingResponseDto(booking);
  }

  async update(id: string, updateBookingDto: UpdateBookingDto): Promise<BookingResponseDto> {
    const bookingEntity = await this.bookingRepository.findOneBy({ id });
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