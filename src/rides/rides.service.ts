import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRideDto, RideResponseDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Repository } from 'typeorm';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Ride } from './entities/ride.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  private toRideResponseDto(ride: Ride): RideResponseDto {
    // Assuming RideType and RideStatus are imported and ride.type/status are strings
    // If ride.type/status are already enums, just assign directly
    return {
      ...ride,
      type: ride.type as any, // Replace 'as any' with 'as RideType' if RideType is imported
      status: ride.status as any, // Replace 'as any' with 'as RideStatus' if RideStatus is imported
    };
  }

  async create(createRideDto: CreateRideDto): Promise<RideResponseDto> {
    const driver = await this.driverRepository.findOneBy({ id: createRideDto.driverId });
    if (!driver) {
      throw new BadRequestException('Driver not found');
    }
    const vehicle = await this.vehicleRepository.findOneBy({ id: createRideDto.vehicleId });
    if (!vehicle) {
      throw new BadRequestException('Vehicle not found');
    }
    const ride = this.rideRepository.create(createRideDto);
    await this.rideRepository.save(ride);
    return this.toRideResponseDto(ride);
  }

  async findAll(): Promise<RideResponseDto[]> {
    const rides = await this.rideRepository.find();
    return rides.map(ride => this.toRideResponseDto(ride));
  }

  async findByDriver(driverId: string): Promise<RideResponseDto[]> {
    const rides = await this.rideRepository.find({ where: { driverId } });
    return rides.map(ride => this.toRideResponseDto(ride));
  }

  async findByCustomer(customerId: string): Promise<RideResponseDto[]> {
    const bookings = await this.bookingRepository.find({ where: { userId: customerId }, relations: ['ride'] });
    return bookings
      .map(booking => booking.ride)
      .filter((ride): ride is Ride => ride !== null)
      .map(ride => this.toRideResponseDto(ride));
  }

  async findOne(id: string): Promise<RideResponseDto> {
    const ride = await this.rideRepository.findOneBy({ id });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }
    return this.toRideResponseDto(ride);
  }

  async findBookingByRideAndUser(rideId: string, userId: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({ where: { rideId, userId } });
  }

  async update(id: string, updateRideDto: UpdateRideDto): Promise<RideResponseDto> {
    const rideEntity = await this.rideRepository.findOneBy({ id });
    if (!rideEntity) {
      throw new NotFoundException('Ride not found');
    }
    Object.assign(rideEntity, updateRideDto);
    await this.rideRepository.save(rideEntity);
    return this.toRideResponseDto(rideEntity);
  }

  async remove(id: string): Promise<void> {
    const ride = await this.rideRepository.findOneBy({ id });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }
    await this.rideRepository.remove(ride);
  }
}