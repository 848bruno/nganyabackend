import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDeliveryDto, DeliveryResponseDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { Repository } from 'typeorm';

import { User, UserRole } from 'src/users/entities/user.entity';
import { Delivery, DeliveryStatus } from './entities/delivery.entity'; 
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

@Injectable()
export class DeliveryService { 
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    // ⭐ Removed @InjectRepository(Driver) private driverRepository: Repository<Driver>, ⭐
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  private toResponseDto(delivery: Delivery): DeliveryResponseDto {
    const {
      id,
      userId,
      user, // Include user object
      driverId,
      driver, // Include driver (User) object
      vehicleId,
      vehicle, // Include vehicle object
      pickUpLocation,
      dropOffLocation,
      itemType,
      status,
      proofOfDelivery,
      cost,
      createdAt,
      updatedAt,
    } = delivery;

    return {
      id,
      userId,
      user,
      driverId,
      driver,
      vehicleId,
      vehicle,
      pickUpLocation,
      dropOffLocation,
      itemType,
      status: status as DeliveryStatus, // Explicitly cast to DeliveryStatus
      proofOfDelivery,
      cost,
      createdAt,
      updatedAt,
    };
  }

  async create(createDeliveryDto: CreateDeliveryDto): Promise<DeliveryResponseDto> {
    const user = await this.userRepository.findOneBy({ id: createDeliveryDto.userId });
    if (!user) {
      throw new BadRequestException('User (customer) not found');
    }

    let driver: User | null = null;
    if (createDeliveryDto.driverId) {
      driver = await this.userRepository.findOneBy({ id: createDeliveryDto.driverId, role: UserRole.Driver }); // ⭐ Check for Driver role ⭐
      if (!driver) {
        throw new BadRequestException('Driver (User) not found or is not a driver.');
      }
    }

    let vehicle: Vehicle | null = null;
    if (createDeliveryDto.vehicleId) {
      vehicle = await this.vehicleRepository.findOneBy({ id: createDeliveryDto.vehicleId });
      if (!vehicle) {
        throw new BadRequestException('Vehicle not found');
      }
    }

    const delivery = this.deliveryRepository.create({
      ...createDeliveryDto,
      user: user,
      driver: driver, // Assign the fetched User object
      vehicle: vehicle, // Assign the fetched Vehicle object
      driverId: driver ? driver.id : null, // Ensure driverId is null if no driver
      vehicleId: vehicle ? vehicle.id : null, // Ensure vehicleId is null if no vehicle
    });

    const savedDelivery = await this.deliveryRepository.save(delivery);
    return this.toResponseDto(savedDelivery);
  }

  async findAll(page: number = 1, limit: number = 10, status?: DeliveryStatus, userId?: string, driverId?: string): Promise<{ data: DeliveryResponseDto[], total: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.deliveryRepository.createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.user', 'user')
      .leftJoinAndSelect('delivery.driver', 'driver') // ⭐ Join with User for driver ⭐
      .leftJoinAndSelect('delivery.vehicle', 'vehicle')
      .skip(skip)
      .take(limit);

    if (status) {
      queryBuilder.andWhere('delivery.status = :status', { status });
    }
    if (userId) {
      queryBuilder.andWhere('delivery.userId = :userId', { userId });
    }
    if (driverId) {
      queryBuilder.andWhere('delivery.driverId = :driverId', { driverId });
    }

    const [deliveries, total] = await queryBuilder.getManyAndCount();
    return {
      data: deliveries.map((delivery) => this.toResponseDto(delivery)),
      total,
    };
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10): Promise<{ data: DeliveryResponseDto[], total: number }> {
    const skip = (page - 1) * limit;
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User (customer) not found');
    }

    const [deliveries, total] = await this.deliveryRepository.findAndCount({
      where: { userId },
      relations: ['user', 'driver', 'vehicle'], // ⭐ Ensure relations are loaded ⭐
      skip: skip,
      take: limit,
    });
    return { data: deliveries.map((delivery) => this.toResponseDto(delivery)), total };
  }

  async findByDriver(driverId: string, page: number = 1, limit: number = 10): Promise<{ data: DeliveryResponseDto[], total: number }> {
    const skip = (page - 1) * limit;
    const driver = await this.userRepository.findOneBy({ id: driverId, role: UserRole.Driver }); // ⭐ Check for Driver role ⭐
    if (!driver) {
      throw new NotFoundException('Driver (User) not found');
    }

    const [deliveries, total] = await this.deliveryRepository.findAndCount({
      where: { driverId },
      relations: ['user', 'driver', 'vehicle'], // ⭐ Ensure relations are loaded ⭐
      skip: skip,
      take: limit,
    });
    return { data: deliveries.map((delivery) => this.toResponseDto(delivery)), total };
  }

  async findOne(id: string): Promise<DeliveryResponseDto> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id },
      relations: ['user', 'driver', 'vehicle'], // ⭐ Ensure relations are loaded ⭐
    });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    return this.toResponseDto(delivery);
  }

  async update(id: string, updateDeliveryDto: UpdateDeliveryDto): Promise<DeliveryResponseDto> {
    const deliveryEntity = await this.deliveryRepository.findOne({
      where: { id },
      relations: ['user', 'driver', 'vehicle'], // ⭐ Load relations for update ⭐
    });
    if (!deliveryEntity) {
      throw new NotFoundException('Delivery not found');
    }

    // Handle user update
    if (updateDeliveryDto.userId) {
      const newUser = await this.userRepository.findOneBy({ id: updateDeliveryDto.userId });
      if (!newUser) {
        throw new BadRequestException('User (customer) not found');
      }
      deliveryEntity.user = newUser;
      deliveryEntity.userId = newUser.id;
    }

    // Handle driver update
    if (updateDeliveryDto.driverId !== undefined) { // Allow null to unassign
      const newDriver = updateDeliveryDto.driverId === null
        ? null
        : await this.userRepository.findOneBy({ id: updateDeliveryDto.driverId, role: UserRole.Driver }); // ⭐ Check for Driver role ⭐

      if (updateDeliveryDto.driverId !== null && !newDriver) {
        throw new BadRequestException('New driver (User) not found or is not a driver.');
      }
      deliveryEntity.driver = newDriver;
      deliveryEntity.driverId = newDriver ? newDriver.id : null; // ⭐ Set driverId to null if driver is null ⭐
    }

    // Handle vehicle update
    if (updateDeliveryDto.vehicleId !== undefined) { // Allow null to unassign
      const newVehicle = updateDeliveryDto.vehicleId === null
        ? null
        : await this.vehicleRepository.findOneBy({ id: updateDeliveryDto.vehicleId });

      if (updateDeliveryDto.vehicleId !== null && !newVehicle) {
        throw new BadRequestException('New vehicle not found');
      }
      deliveryEntity.vehicle = newVehicle;
      deliveryEntity.vehicleId = newVehicle ? newVehicle.id : null; // ⭐ Set vehicleId to null if vehicle is null ⭐
    }

    Object.assign(deliveryEntity, updateDeliveryDto); // Apply other updates

    const updatedDelivery = await this.deliveryRepository.save(deliveryEntity);
    return this.toResponseDto(updatedDelivery);
  }

  async remove(id: string): Promise<void> {
    const delivery = await this.deliveryRepository.findOneBy({ id });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    await this.deliveryRepository.remove(delivery);
  }
}
