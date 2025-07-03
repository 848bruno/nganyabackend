import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDeliveryDto, DeliveryResponseDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { Repository } from 'typeorm';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { User } from 'src/users/entities/user.entity';
import { Delivery } from './entities/delivery.entity';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  private toResponseDto(delivery: Delivery): DeliveryResponseDto {
    const { id, userId, driverId, vehicleId, status, ...rest } = delivery;
    return {
      id,
      userId,
      driverId,
      vehicleId,
      status: status as any, // Cast to DeliveryStatus
      ...rest,
    };
  }

  async create(createDeliveryDto: CreateDeliveryDto): Promise<DeliveryResponseDto> {
    const user = await this.userRepository.findOneBy({ id: createDeliveryDto.userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (createDeliveryDto.driverId) {
      const driver = await this.driverRepository.findOneBy({ id: createDeliveryDto.driverId });
      if (!driver) {
        throw new BadRequestException('Driver not found');
      }
    }
    if (createDeliveryDto.vehicleId) {
      const vehicle = await this.vehicleRepository.findOneBy({ id: createDeliveryDto.vehicleId });
      if (!vehicle) {
        throw new BadRequestException('Vehicle not found');
      }
    }
    const delivery = this.deliveryRepository.create(createDeliveryDto);
    await this.deliveryRepository.save(delivery);
    return this.toResponseDto(delivery);
  }

  async findAll(): Promise<DeliveryResponseDto[]> {
    const deliveries = await this.deliveryRepository.find();
    return deliveries.map((delivery) => this.toResponseDto(delivery));
  }

  async findByUser(userId: string): Promise<DeliveryResponseDto[]> {
    const deliveries = await this.deliveryRepository.find({ where: { userId } });
    return deliveries.map((delivery) => this.toResponseDto(delivery));
  }

  async findByDriver(driverId: string): Promise<DeliveryResponseDto[]> {
    const deliveries = await this.deliveryRepository.find({ where: { driverId } });
    return deliveries.map((delivery) => this.toResponseDto(delivery));
  }

  async findOne(id: string): Promise<DeliveryResponseDto> {
    const delivery = await this.deliveryRepository.findOneBy({ id });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    return this.toResponseDto(delivery);
  }

  async update(id: string, updateDeliveryDto: UpdateDeliveryDto): Promise<DeliveryResponseDto> {
    const deliveryEntity = await this.deliveryRepository.findOneBy({ id });
    if (!deliveryEntity) {
      throw new NotFoundException('Delivery not found');
    }
    if (updateDeliveryDto.driverId) {
      const driver = await this.driverRepository.findOneBy({ id: updateDeliveryDto.driverId });
      if (!driver) {
        throw new BadRequestException('Driver not found');
      }
    }
    if (updateDeliveryDto.vehicleId) {
      const vehicle = await this.vehicleRepository.findOneBy({ id: updateDeliveryDto.vehicleId });
      if (!vehicle) {
        throw new BadRequestException('Vehicle not found');
      }
    }
    Object.assign(deliveryEntity, updateDeliveryDto);
    await this.deliveryRepository.save(deliveryEntity);
    return this.toResponseDto(deliveryEntity);
  }

  async remove(id: string): Promise<void> {
    const delivery = await this.deliveryRepository.findOneBy({ id });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    await this.deliveryRepository.remove(delivery);
  }
}
