import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, UserResponseDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { Repository, IsNull, Not } from 'typeorm';
import { Ride } from 'src/rides/entities/ride.entity';

import * as bcrypt from 'bcrypt';
import { LocationService } from 'src/geo/geo.service';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    private readonly locationService: LocationService,
  ) {}

  public toUserResponseDto(user: User): UserResponseDto {
    const {
      id,
      name,
      email,
      role,
      createdAt,
      updatedAt,
      phone,
      isOnline,
      currentLatitude,
      currentLongitude,
      driverLicenseNumber,
      driverStatus,
      totalRidesCompleted,
      averageRating,
      assignedVehicle,
      assignedVehicleId,
    } = user;

    return {
      id,
      name,
      email,
      role,
      createdAt,
      updatedAt,
      phone,
      isOnline,
      currentLatitude,
      currentLongitude,
      driverLicenseNumber,
      driverStatus,
      totalRidesCompleted,
      averageRating,
      assignedVehicle,
      assignedVehicleId,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findOneBy({ email: createUserDto.email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const { password, role, driverLicenseNumber, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      ...rest,
      password: hashedPassword,
      role,
      isOnline: role === UserRole.Driver ? false : false,
      currentLatitude: null,
      currentLongitude: null,
      driverLicenseNumber: role === UserRole.Driver ? driverLicenseNumber || null : null,
      driverStatus: role === UserRole.Driver ? 'pending' : null,
      totalRidesCompleted: 0,
      averageRating: 0.0,
      assignedVehicle: null,
      assignedVehicleId: null,
    });

    const savedUser = await this.userRepository.save(newUser);
    return this.toUserResponseDto(savedUser);
  }

  async findAll(page: number = 1, limit: number = 10, role?: UserRole, q?: string): Promise<{ data: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.assignedVehicle', 'assignedVehicle')
      .skip(skip)
      .take(limit);

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (q) {
      queryBuilder.andWhere(
        '(user.name ILIKE :q OR user.email ILIKE :q OR user.phone ILIKE :q)',
        { q: `%${q}%` }
      );
    }

    const [users, total] = await queryBuilder.getManyAndCount();
    return { data: users, total };
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['assignedVehicle'],
    });
    return user;
  }

  async findOneDto(id: string): Promise<UserResponseDto> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toUserResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Handle assignedVehicleId update explicitly
    if (updateUserDto.assignedVehicleId !== undefined) {
      if (updateUserDto.assignedVehicleId === null) {
        user.assignedVehicle = null;
        user.assignedVehicleId = null;
      } else {
        const vehicle = await this.vehicleRepository.findOneBy({ id: updateUserDto.assignedVehicleId });
        if (!vehicle) {
          throw new BadRequestException(`Vehicle with ID ${updateUserDto.assignedVehicleId} not found.`);
        }
        user.assignedVehicle = vehicle;
        user.assignedVehicleId = vehicle.id;
      }
    }

    // Apply other updates to the user object
    Object.assign(user, updateUserDto);

    await this.userRepository.save(user);
    return this.toUserResponseDto(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.remove(user);
  }

  async updateDriverOnlineStatus(userId: string, isOnline: boolean): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId, role: UserRole.Driver });
    if (!user) {
      throw new NotFoundException(`Driver (User ID ${userId}) not found or is not a driver.`);
    }
    user.isOnline = isOnline;
    return this.userRepository.save(user);
  }

  async updateDriverLocation(userId: string, latitude: number, longitude: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId, role: UserRole.Driver });
    if (!user) {
      throw new NotFoundException(`Driver (User ID ${userId}) not found or is not a driver.`);
    }
    user.currentLatitude = latitude;
    user.currentLongitude = longitude;
    return this.userRepository.save(user);
  }

  async assignVehicleToDriver(driverUserId: string, vehicleId: string): Promise<User> {
    const driver = await this.userRepository.findOneBy({ id: driverUserId, role: UserRole.Driver });
    if (!driver) {
      throw new NotFoundException(`Driver (User ID ${driverUserId}) not found.`);
    }
    const vehicle = await this.vehicleRepository.findOneBy({ id: vehicleId });
    if (!vehicle) {
      throw new BadRequestException(`Vehicle with ID ${vehicleId} not found.`);
    }

    driver.assignedVehicle = vehicle;
    driver.assignedVehicleId = vehicle.id;

    return this.userRepository.save(driver);
  }

  async getDriverAssignedVehicle(userId: string): Promise<Vehicle | null> {
    const driver = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.Driver },
      relations: ['assignedVehicle'],
    });
    return driver?.assignedVehicle || null;
  }

  async getDriverRides(userId: string, page: number = 1, limit: number = 10, status?: string): Promise<{ data: Ride[], total: number }> {
    const skip = (page - 1) * limit;
    const whereCondition: any = { driverId: userId };

    if (status) {
      whereCondition.status = status;
    }

    const [rides, total] = await this.rideRepository.findAndCount({
      where: whereCondition,
      skip: skip,
      take: limit,
      // ⭐ FIX: Changed 'user' to 'driver' in relations as Ride entity has a 'driver' (User) relation ⭐
      relations: ['driver', 'vehicle', 'route', 'bookings', 'bookings.user'],
    });

    return { data: rides, total: total };
  }

  async findNearestOnlineDrivers(
    originLat: number,
    originLon: number,
    maxDistanceKm: number = 5,
    limit: number = 5,
  ): Promise<(User & { distance?: number })[]> {
    const onlineDrivers = await this.userRepository.find({
      where: {
        role: UserRole.Driver,
        isOnline: true,
        currentLatitude: Not(IsNull()),
        currentLongitude: Not(IsNull()),
      },
      relations: ['assignedVehicle'],
    });

    if (!onlineDrivers.length) {
      return [];
    }

    const nearestDrivers = this.locationService.findNearestDrivers(
      originLat,
      originLon,
      onlineDrivers,
      maxDistanceKm,
      limit,
    );

    return nearestDrivers;
  }
}
