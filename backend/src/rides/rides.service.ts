import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRideDto, RideResponseDto} from './dto/create-ride.dto'; // Import UpdateRideDto and RideResponseDto
import { Booking } from 'src/bookings/entities/booking.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity'; // ⭐ Updated: Import User entity and UserRole ⭐
import { Ride, RideStatus, RideType } from './entities/ride.entity'; // ⭐ Imported RideStatus and RideType ⭐
import { InjectRepository } from '@nestjs/typeorm';
import { Route } from 'src/routes/entities/route.entity'; // Import Route entity
import { Review } from 'src/reviews/entities/review.entity'; // Import Review entity
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { UpdateRideDto } from './dto/update-ride.dto';

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(User) // ⭐ Updated: Inject User repository instead of Driver ⭐
    private userRepository: Repository<User>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Route) // Inject Route repository
    private routeRepository: Repository<Route>,
    @InjectRepository(Review) // Inject Review repository
    private reviewRepository: Repository<Review>, // Make sure this is injected if used in relations
  ) {}

  private toRideResponseDto(ride: Ride): RideResponseDto {
    // Assuming RideType and RideStatus are imported and ride.type/status are already enums
    return {
      id: ride.id,
      driverId: ride.driverId,
      driver: ride.driver, // Include the full driver (User) object
      vehicleId: ride.vehicleId,
      vehicle: ride.vehicle, // Include the full vehicle object
      routeId: ride.routeId,
      route: ride.route, // Include the full route object
      pickUpLocation: ride.pickUpLocation,
      dropOffLocation: ride.dropOffLocation,
      type: ride.type, // Now correctly typed as RideType
      status: ride.status, // Now correctly typed as RideStatus
      fare: ride.fare,
      startTime: ride.startTime,
      endTime: ride.endTime,
      createdAt: ride.createdAt,
      updatedAt: ride.updatedAt,
      bookings: ride.bookings, // Include bookings
      reviews: ride.reviews, // Include reviews
    };
  }

  async create(createRideDto: CreateRideDto): Promise<RideResponseDto> {
    const driver = await this.userRepository.findOneBy({ id: createRideDto.driverId, role: UserRole.Driver });
    if (!driver) {
      throw new BadRequestException('Driver (User) not found');
    }
    const vehicle = await this.vehicleRepository.findOneBy({ id: createRideDto.vehicleId });
    if (!vehicle) {
      throw new BadRequestException('Vehicle not found');
    }

    let route: Route | null = null;
    if (createRideDto.routeId) {
      route = await this.routeRepository.findOneBy({ id: createRideDto.routeId });
      if (!route) {
        throw new BadRequestException('Route not found');
      }
    }

    const ride = this.rideRepository.create({
      ...createRideDto,
      driver: driver, // Assign the User object
      vehicle: vehicle, // Assign the Vehicle object
      route: route, // Assign the Route object
    });

    const savedRide = await this.rideRepository.save(ride);
    return this.toRideResponseDto(savedRide);
  }

  async findAll(page: number = 1, limit: number = 10, status?: RideStatus, driverId?: string, customerId?: string): Promise<{ data: RideResponseDto[], total: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.rideRepository.createQueryBuilder('ride')
      .leftJoinAndSelect('ride.driver', 'driver') // Eager load driver (User)
      .leftJoinAndSelect('ride.vehicle', 'vehicle') // Eager load vehicle
      .leftJoinAndSelect('ride.route', 'route') // Eager load route
      .leftJoinAndSelect('ride.bookings', 'bookings') // Eager load bookings
      .leftJoinAndSelect('bookings.user', 'bookingUser') // Eager load user for each booking
      .leftJoinAndSelect('ride.reviews', 'reviews') // Eager load reviews
      .skip(skip)
      .take(limit);

    if (status) {
      queryBuilder.andWhere('ride.status = :status', { status });
    }
    if (driverId) {
      queryBuilder.andWhere('ride.driverId = :driverId', { driverId });
    }
    if (customerId) {
      // To find rides by customer, we need to join through bookings
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
        // Re-throw to propagate the 500
        throw error;
    }
  }

  async findByDriver(driverId: string): Promise<RideResponseDto[]> {
    // Verify the driver exists and is actually a driver
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
    // This method is already robust, just ensuring it uses the correct imports and DTO conversion
    try {
        const bookings = await this.bookingRepository.find({
            where: { userId: customerId },
            relations: ['ride', 'ride.driver', 'ride.vehicle', 'ride.route', 'ride.reviews'], // Ensure ride relations are loaded
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
            relations: ['driver', 'vehicle', 'route', 'bookings', 'bookings.user', 'reviews'], // Eager load all relevant relations
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
      relations: ['driver', 'vehicle', 'route'], // Load relations that might be updated
    });
    if (!rideEntity) {
      throw new NotFoundException('Ride not found');
    }

    // Handle driver update
    if (updateRideDto.driverId) {
      const newDriver = await this.userRepository.findOneBy({ id: updateRideDto.driverId, role: UserRole.Driver });
      if (!newDriver) {
        throw new BadRequestException('New driver (User) not found');
      }
      rideEntity.driver = newDriver;
      rideEntity.driverId = newDriver.id;
    }

    // Handle vehicle update
    if (updateRideDto.vehicleId) {
      const newVehicle = await this.vehicleRepository.findOneBy({ id: updateRideDto.vehicleId });
      if (!newVehicle) {
        throw new BadRequestException('New vehicle not found');
      }
      rideEntity.vehicle = newVehicle;
      rideEntity.vehicleId = newVehicle.id;
    }

    // Handle route update
    if (updateRideDto.routeId !== undefined) { // Allow routeId to be null for unassignment
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

    Object.assign(rideEntity, updateRideDto); // Apply other updates

    const updatedRide = await this.rideRepository.save(rideEntity);
    return this.toRideResponseDto(updatedRide);
  }

  async remove(id: string): Promise<void> {
    const ride = await this.rideRepository.findOneBy({ id });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }
    await this.rideRepository.remove(ride);
  }
}
