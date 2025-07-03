import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRouteDto, RouteResponseDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Repository } from 'typeorm';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Route } from './entities/route.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<RouteResponseDto> {
    const driver = await this.driverRepository.findOneBy({ id: createRouteDto.driverId });
    if (!driver) {
      throw new BadRequestException('Driver not found');
    }
    const route = this.routeRepository.create(createRouteDto);
    await this.routeRepository.save(route);
    return route;
  }

  async findAll(): Promise<RouteResponseDto[]> {
    return this.routeRepository.find();
  }

  async findByDriver(driverId: string): Promise<RouteResponseDto[]> {
    return this.routeRepository.find({ where: { driverId } });
  }

  async findOne(id: string): Promise<RouteResponseDto> {
    const route = await this.routeRepository.findOneBy({ id });
    if (!route) {
      throw new NotFoundException('Route not found');
    }
    return route;
  }

  async update(id: string, updateRouteDto: UpdateRouteDto): Promise<RouteResponseDto> {
    const route = await this.findOne(id);
    Object.assign(route, updateRouteDto);
    await this.routeRepository.save(route);
    return route;
  }

  async remove(id: string): Promise<void> {
    const route = await this.routeRepository.findOneBy({ id });
    if (!route) {
      throw new NotFoundException('Route not found');
    }
    await this.routeRepository.remove(route);
  }
}