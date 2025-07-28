// src/rides/ride.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRideDto, RideResponseDto, UpdateRideDto } from './dto/create-ride.dto';
import { Booking, BookingStatus } from 'src/bookings/entities/booking.entity'; // Import BookingStatus
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Ride, RideStatus, RideType } from './entities/ride.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Route } from 'src/routes/entities/route.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { RoutesService } from 'src/routes/routes.service';

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private routesService: RoutesService,
  ) {}

  private toRideResponseDto(ride: Ride): RideResponseDto {
    return {
      id: ride.id,
      driverId: ride.driverId,
      driver: ride.driver,
      vehicleId: ride.vehicleId,
      vehicle: ride.vehicle,
      routeId: ride.routeId,
      route: ride.route,
      pickUpLocation: ride.pickUpLocation,
      dropOffLocation: ride.dropOffLocation,
      type: ride.type,
      status: ride.status,
      fare: ride.fare,
      startTime: ride.startTime,
      endTime: ride.endTime,
      createdAt: ride.createdAt,
      updatedAt: ride.updatedAt,
      bookings: ride.bookings,
      reviews: ride.reviews,
    };
  }

  async create(createRideDto: CreateRideDto, customerId: string): Promise<RideResponseDto> {
    const driver = await this.userRepository.findOneBy({ id: createRideDto.driverId, role: UserRole.Driver });
    if (!driver) {
      throw new BadRequestException('Assigned driver (User) not found or is not a driver.');
    }
    const vehicle = await this.vehicleRepository.findOneBy({ id: createRideDto.vehicleId });
    if (!vehicle) {
      throw new BadRequestException('Vehicle not found.');
    }

    let route: Route | null = null;
    if (createRideDto.routeId) {
      route = await this.routeRepository.findOneBy({ id: createRideDto.routeId });
      if (!route) {
        throw new BadRequestException('Route not found.');
      }
    }

    const ride = this.rideRepository.create({
      ...createRideDto,
      driver: driver,
      vehicle: vehicle,
      route: route,
      status: RideStatus.Pending,
    });

    const savedRide = await this.rideRepository.save(ride);

    // Create a booking for the customer immediately
    const booking = this.bookingRepository.create({
      rideId: savedRide.id,
      userId: customerId,
      status: BookingStatus.Pending, // Using BookingStatus enum
      numberOfSeats: 1, // This property now exists in Booking entity
      fareAtBooking: savedRide.fare, // This property now exists in Booking entity
      // If you have 'type' in Booking, it should default or be explicitly set
      // For a ride booking, it would be:
      // type: BookingType.Ride,
    });
    await this.bookingRepository.save(booking);

    const fullRide = await this.rideRepository.findOne({
      where: { id: savedRide.id },
      relations: ['driver', 'vehicle', 'route', 'bookings', 'bookings.user', 'reviews'],
    });

    if (!fullRide) {
      throw new NotFoundException('Failed to retrieve full ride details after creation.');
    }

    return this.toRideResponseDto(fullRide);
  }

  async findAll(page: number = 1, limit: number = 10, status?: RideStatus, driverId?: string, customerId?: string): Promise<{ data: RideResponseDto[], total: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.rideRepository.createQueryBuilder('ride')
      .leftJoinAndSelect('ride.driver', 'driver')
      .leftJoinAndSelect('ride.vehicle', 'vehicle')
      .leftJoinAndSelect('ride.route', 'route')
      .leftJoinAndSelect('ride.bookings', 'bookings')
      .leftJoinAndSelect('bookings.user', 'bookingUser')
      .leftJoinAndSelect('ride.reviews', 'reviews')
      .skip(skip)
      .take(limit);

    if (status) {
      queryBuilder.andWhere('ride.status = :status', { status });
    }
    if (driverId) {
      queryBuilder.andWhere('ride.driverId = :driverId', { driverId });
    }
    if (customerId) {
      queryBuilder.innerJoin('ride.bookings', 'customerBooking', 'customerBooking.userId = :customerId', { customerId });
    }

    try {
        const [rides, total] = await queryBuilder.getManyAndCount();
        return {
            data: rides.map(ride => this.toRideResponseDto(ride)),
            total,
        };
    } catch (error) {
        console.error('RideService.findAll: Error fetching rides with relations:', error);
        throw error;
    }
  }

  async findByDriver(driverId: string): Promise<RideResponseDto[]> {
    const driver = await this.userRepository.findOneBy({ id: driverId, role: UserRole.Driver });
    if (!driver) {
      throw new NotFoundException('Driver (User) not found');
    }

    try {
        const rides = await this.rideRepository.find({
            where: { driverId },
            relations: ['driver', 'vehicle', 'route', 'bookings', 'bookings.user', 'reviews'],
        });
        return rides.map(ride => this.toRideResponseDto(ride));
    } catch (error) {
        console.error('RideService.findByDriver: Error fetching driver rides with relations:', error);
        throw error;
    }
  }

  async findByCustomer(customerId: string): Promise<RideResponseDto[]> {
    try {
        const bookings = await this.bookingRepository.find({
            where: { userId: customerId },
            relations: ['ride', 'ride.driver', 'ride.vehicle', 'ride.route', 'ride.reviews', 'ride.bookings', 'ride.bookings.user'],
        });
        return bookings
            .map(booking => booking.ride)
            .filter((ride): ride is Ride => ride !== null)
            .map(ride => this.toRideResponseDto(ride));
    } catch (error) {
        console.error('RideService.findByCustomer: Error fetching customer rides with relations:', error);
        throw error;
    }
  }

  async findOne(id: string): Promise<RideResponseDto> {
    try {
        const ride = await this.rideRepository.findOne({
            where: { id },
            relations: ['driver', 'vehicle', 'route', 'bookings', 'bookings.user', 'reviews'],
        });
        if (!ride) {
            throw new NotFoundException('Ride not found');
        }
        return this.toRideResponseDto(ride);
    } catch (error) {
        console.error('RideService.findOne: Error fetching single ride with relations:', error);
        throw error;
    }
  }

  async findBookingByRideAndUser(rideId: string, userId: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({ where: { rideId, userId } });
  }

  async update(id: string, updateRideDto: UpdateRideDto): Promise<RideResponseDto> {
    const rideEntity = await this.rideRepository.findOne({
      where: { id },
      relations: ['driver', 'vehicle', 'route'],
    });
    if (!rideEntity) {
      throw new NotFoundException('Ride not found');
    }

    if (updateRideDto.driverId) {
      const newDriver = await this.userRepository.findOneBy({ id: updateRideDto.driverId, role: UserRole.Driver });
      if (!newDriver) {
        throw new BadRequestException('New driver (User) not found');
      }
      rideEntity.driver = newDriver;
      rideEntity.driverId = newDriver.id;
    }

    if (updateRideDto.vehicleId) {
      const newVehicle = await this.vehicleRepository.findOneBy({ id: updateRideDto.vehicleId });
      if (!newVehicle) {
        throw new BadRequestException('New vehicle not found');
      }
      rideEntity.vehicle = newVehicle;
      rideEntity.vehicleId = newVehicle.id;
    }

    if (updateRideDto.routeId !== undefined) {
      if (updateRideDto.routeId === null) {
        rideEntity.route = null;
        rideEntity.routeId = null;
      } else {
        const newRoute = await this.routeRepository.findOneBy({ id: updateRideDto.routeId });
        if (!newRoute) {
          throw new BadRequestException('New route not found');
        }
        rideEntity.route = newRoute;
        rideEntity.routeId = newRoute.id;
      }
    }

    Object.assign(rideEntity, updateRideDto);

    const updatedRide = await this.rideRepository.save(rideEntity);
    const fullRide = await this.rideRepository.findOne({
        where: { id: updatedRide.id },
        relations: ['driver', 'vehicle', 'route', 'bookings', 'bookings.user', 'reviews'],
    });

    if (!fullRide) {
        throw new NotFoundException('Failed to retrieve updated ride details.');
    }

    return this.toRideResponseDto(fullRide);
  }

  async remove(id: string): Promise<void> {
    const ride = await this.rideRepository.findOneBy({ id });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }
    await this.rideRepository.remove(ride);
  }

  async acceptRide(rideId: string, driverId: string): Promise<RideResponseDto> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId, driverId: driverId, status: RideStatus.Pending },
      relations: ['driver', 'vehicle', 'route', 'bookings'],
    });

    if (!ride) {
      throw new NotFoundException('Pending ride not found or not assigned to this driver.');
    }

    if (ride.status !== RideStatus.Pending) {
      throw new BadRequestException(`Ride is not in a PENDING status (current: ${ride.status}).`);
    }

    ride.status = RideStatus.Accepted;
    ride.startTime = new Date();

    const updatedRide = await this.rideRepository.save(ride);

    const customerBooking = updatedRide.bookings.find(b => b.rideId === updatedRide.id);
    if (customerBooking) {
        await this.bookingRepository.update(
            { id: customerBooking.id },
            { status: BookingStatus.Confirmed } // Using BookingStatus enum
        );
    }

    const fullRide = await this.rideRepository.findOne({
        where: { id: updatedRide.id },
        relations: ['driver', 'vehicle', 'route', 'bookings', 'bookings.user', 'reviews'],
    });

    if (!fullRide) {
        throw new NotFoundException('Failed to retrieve accepted ride details.');
    }

    return this.toRideResponseDto(fullRide);
  }

  async declineRide(rideId: string, driverId: string): Promise<RideResponseDto> {
    const ride = await this.rideRepository.findOne({
      where: { id: rideId, driverId: driverId, status: RideStatus.Pending },
      relations: ['driver', 'vehicle', 'route', 'bookings'],
    });

    if (!ride) {
      throw new NotFoundException('Pending ride not found or not assigned to this driver.');
    }

    if (ride.status !== RideStatus.Pending) {
        throw new BadRequestException(`Ride is not in a PENDING status (current: ${ride.status}).`);
    }

    ride.status = RideStatus.Rejected;
    const updatedRide = await this.rideRepository.save(ride);

    const customerBooking = updatedRide.bookings.find(b => b.rideId === updatedRide.id);
    if (customerBooking) {
        await this.bookingRepository.update(
            { id: customerBooking.id },
            { status: BookingStatus.Rejected } // Using BookingStatus enum
        );
    }

    const fullRide = await this.rideRepository.findOne({
        where: { id: updatedRide.id },
        relations: ['driver', 'vehicle', 'route', 'bookings', 'bookings.user', 'reviews'],
    });

    if (!fullRide) {
        throw new NotFoundException('Failed to retrieve declined ride details.');
    }

    return this.toRideResponseDto(fullRide);
  }
}