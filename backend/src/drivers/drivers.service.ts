import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDriverDto, DriverResponseDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';

import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createDriverDto: CreateDriverDto): Promise<DriverResponseDto> {
    const user = await this.userRepository.findOneBy({ id: createDriverDto.userId });
    if (!user || user.role !== UserRole.Driver) {
      throw new BadRequestException('Invalid user or user is not a driver');
    }
    const driver = this.driverRepository.create(createDriverDto);
    await this.driverRepository.save(driver);
    return driver;
  }

  async findAll(): Promise<DriverResponseDto[]> {
    return this.driverRepository.find();
  }

  async findOne(id: string): Promise<DriverResponseDto> {
    const driver = await this.driverRepository.findOneBy({ id });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return driver;
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<DriverResponseDto> {
    const driver = await this.findOne(id);
    Object.assign(driver, updateDriverDto);
    await this.driverRepository.save(driver);
    return driver;
  }

  async remove(id: string): Promise<void> {
    const driver = await this.driverRepository.findOneBy({ id });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    await this.driverRepository.remove(driver);
  }
}