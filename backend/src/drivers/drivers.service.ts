// src/drivers/drivers.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDriverDto, DriverResponseDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';

import { InjectRepository } from '@nestjs/typeorm';

// Define DriverDashboardStats interface (as before, or import from a shared types file)
interface DriverDashboardStats {
  todayEarnings: number;
  weeklyEarnings: number;
  totalBookings: number;
  totalRides: number;
  rating: number;
  completionRate: number;
  hoursOnline: number;
}

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Converts a Driver entity into a DriverResponseDto.
   * This is crucial for type compatibility when returning entities as DTOs.
   */
  private toDriverResponseDto(driver: Driver): DriverResponseDto {
    const { id, isOnline, latitude, longitude, licenseNumber, rating, vehicleId, createdAt, updatedAt } = driver;
    // Ensure latitude and longitude are explicitly handled as number | null if your DTO supports it.
    // If your DriverResponseDto has latitude?: number; (meaning number | undefined),
    // then you might need to convert null to undefined explicitly if that's the DTO's contract.
    // However, it's better to define DTO properties as `number | null` if the entity is `nullable: true`.
    return {
      id,
      isOnline,
      latitude: latitude, // This should be fine if DriverResponseDto allows null
      longitude: longitude, // This should be fine if DriverResponseDto allows null
      licenseNumber,
      rating,
      vehicleId,
      createdAt,
      updatedAt,
      // If you want to include user details in the DTO, uncomment and ensure 'user' relation is loaded
      // user: driver.user ? { id: driver.user.id, name: driver.user.name, email: driver.user.email, role: driver.user.role as string } : undefined,
    };
  }

  // ⭐ MODIFIED: Create Driver ⭐
  async create(userId: string, createDriverDto: CreateDriverDto): Promise<DriverResponseDto> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || user.role !== UserRole.Driver) {
      throw new BadRequestException('Invalid user ID or user is not assigned the driver role.');
    }

    const existingDriver = await this.driverRepository.findOneBy({ id: userId });
    if (existingDriver) {
      throw new BadRequestException('A driver profile already exists for this user.');
    }

    const driver = this.driverRepository.create({
      ...createDriverDto,
      id: userId,
      user: user,
    });

    const savedDriver = await this.driverRepository.save(driver);
    return this.toDriverResponseDto(savedDriver);
  }

  async findAll(): Promise<DriverResponseDto[]> {
    const drivers = await this.driverRepository.find({
      relations: ['user'],
    });
    return drivers.map(driver => this.toDriverResponseDto(driver));
  }

  // ⭐ MODIFIED: findOne now returns the raw Driver entity internally ⭐
  // This is crucial for methods like 'update' and 'remove' that operate on the entity.
  async findOneEntity(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['user'], // Keep relations if needed for internal logic, otherwise remove for performance
    });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return driver;
  }

  // Public method to get a DriverResponseDto
  async findOne(id: string): Promise<DriverResponseDto> {
    const driver = await this.findOneEntity(id); // Get the entity
    return this.toDriverResponseDto(driver); // Convert to DTO for public API
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<DriverResponseDto> {
    const driver = await this.findOneEntity(id); // ⭐ Use findOneEntity to get the raw entity ⭐
    Object.assign(driver, updateDriverDto);
    const updatedDriver = await this.driverRepository.save(driver);
    return this.toDriverResponseDto(updatedDriver);
  }

  async remove(id: string): Promise<void> {
    const driver = await this.findOneEntity(id); // ⭐ Use findOneEntity to get the raw entity ⭐
    // findOneEntity already throws NotFoundException if not found, so the if check is redundant here.
    await this.driverRepository.remove(driver);
  }

  // ⭐ MODIFIED/NEW: Update driver location with automatic online status ⭐
  async updateDriverLocation(driverId: string, latitude: number, longitude: number): Promise<DriverResponseDto> {
    const driver = await this.findOneEntity(driverId); // ⭐ Use findOneEntity ⭐
    
    driver.latitude = latitude;
    driver.longitude = longitude;
    driver.isOnline = true; // Automatically set to online when coordinates are updated

    const updatedDriver = await this.driverRepository.save(driver);
    return this.toDriverResponseDto(updatedDriver);
  }

  // ⭐ NEW: Get Driver Stats ⭐
  async getDriverStats(driverId: string): Promise<DriverDashboardStats> {
    const driver = await this.driverRepository.findOne({
      where: { id: driverId },
      relations: ['rides', 'reviews'],
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found.');
    }

    // --- Calculate Stats (Logic remains similar) ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const completedRides = driver.rides?.filter(ride => ride.status === 'completed') || [];

    const todayEarnings = completedRides
      .filter(ride => new Date(ride.createdAt) >= today)
      .reduce((sum, ride) => sum + (ride.fare || 0), 0);

    const weeklyEarnings = completedRides
      .filter(ride => new Date(ride.createdAt) >= oneWeekAgo)
      .reduce((sum, ride) => sum + (ride.fare || 0), 0);

    const totalRides = completedRides.length;
    const totalBookings = driver.rides?.length || 0;
    const completionRate = driver.rides?.length > 0
      ? (completedRides.length / driver.rides.length) * 100
      : 0;

    const averageRating = driver.reviews?.length > 0
      ? driver.reviews.reduce((sum, review) => sum + review.rating, 0) / driver.reviews.length
      : 0;

    const hoursOnline = 0;

    return {
      todayEarnings,
      weeklyEarnings,
      totalBookings,
      totalRides,
      rating: parseFloat(averageRating.toFixed(1)),
      completionRate: parseFloat(completionRate.toFixed(1)),
      hoursOnline,
    };
  }
}