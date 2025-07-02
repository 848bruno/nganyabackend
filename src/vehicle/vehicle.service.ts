import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVehicleDto, VehicleResponseDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  private toResponseDto(vehicle: Vehicle): VehicleResponseDto {
    // Assuming VehicleStatus is an enum and vehicle.status is a string
    // Adjust the import if VehicleStatus is in a different file
    // import { VehicleStatus } from './dto/create-vehicle.dto';
    const { id, model, year, status, ...rest } = vehicle;
    return {
      id,
      model,
      year,
      status: status as any, // Cast to VehicleStatus, adjust as needed
      ...rest,
    } as VehicleResponseDto;
  }

  async create(createVehicleDto: CreateVehicleDto): Promise<VehicleResponseDto> {
    const vehicle = this.vehicleRepository.create(createVehicleDto);
    await this.vehicleRepository.save(vehicle);
    return this.toResponseDto(vehicle);
  }

  async findAll(): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehicleRepository.find();
    return vehicles.map(vehicle => this.toResponseDto(vehicle));
  }

  async findOne(id: string): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return this.toResponseDto(vehicle);
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<VehicleResponseDto> {
    const vehicleEntity = await this.vehicleRepository.findOneBy({ id });
    if (!vehicleEntity) {
      throw new NotFoundException('Vehicle not found');
    }
    Object.assign(vehicleEntity, updateVehicleDto);
    await this.vehicleRepository.save(vehicleEntity);
    return this.toResponseDto(vehicleEntity);
  }

  async remove(id: string): Promise<void> {
    const vehicleEntity = await this.vehicleRepository.findOneBy({ id });
    if (!vehicleEntity) {
      throw new NotFoundException('Vehicle not found');
    }
    await this.vehicleRepository.remove(vehicleEntity);
  }
}