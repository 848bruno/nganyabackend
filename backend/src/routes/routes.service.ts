import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRouteDto, RouteResponseDto, UpdateRouteDto } from './dto/create-route.dto';
import { Repository } from 'typeorm';
import { Route } from './entities/route.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from 'src/users/entities/user.entity'; // Import User entity

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    @InjectRepository(User) // Inject User repository instead of Driver
    private userRepository: Repository<User>,
  ) {}

  // Helper method to convert Route entity to RouteResponseDto
  private toRouteResponseDto(route: Route): RouteResponseDto {
    const { id, driverId, driver, startPoint, endPoint, stops, startTime, availableSeats, createdAt, updatedAt } = route;
    return {
      id,
      driverId,
      driver, // Include the full driver (User) object
      startPoint,
      endPoint,
      stops,
      startTime,
      availableSeats,
      createdAt,
      updatedAt,
    };
  }

  async create(createRouteDto: CreateRouteDto): Promise<RouteResponseDto> {
    const driver = await this.userRepository.findOneBy({ id: createRouteDto.driverId, role: UserRole.Driver });
    if (!driver) {
      throw new BadRequestException('Driver (User) not found');
    }

    const route = this.routeRepository.create({
      ...createRouteDto,
      driver: driver, // Assign the fetched User object as the driver
      driverId: driver.id, // Ensure driverId is also set
    });

    const savedRoute = await this.routeRepository.save(route);
    return this.toRouteResponseDto(savedRoute);
  }

  async findAll(): Promise<RouteResponseDto[]> {
    const routes = await this.routeRepository.find({
      relations: ['driver'], // Eager load the driver (User) relation
    });
    return routes.map(route => this.toRouteResponseDto(route));
  }

  async findByDriver(driverId: string): Promise<RouteResponseDto[]> {
    // Verify the driver exists and is actually a driver
    const driver = await this.userRepository.findOneBy({ id: driverId, role: UserRole.Driver });
    if (!driver) {
      throw new NotFoundException('Driver (User) not found');
    }

    const routes = await this.routeRepository.find({
      where: { driverId },
      relations: ['driver'], // Eager load the driver (User) relation
    });
    return routes.map(route => this.toRouteResponseDto(route));
  }

  async findOne(id: string): Promise<RouteResponseDto> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['driver'], // Eager load the driver (User) relation
    });
    if (!route) {
      throw new NotFoundException('Route not found');
    }
    return this.toRouteResponseDto(route);
  }

  async update(id: string, updateRouteDto: UpdateRouteDto): Promise<RouteResponseDto> {
    const route = await this.findOne(id); // Use findOne to get the entity with relations

    // If driverId is being updated, fetch the new driver (User)
    if (updateRouteDto.driverId) {
      const newDriver = await this.userRepository.findOneBy({ id: updateRouteDto.driverId, role: UserRole.Driver });
      if (!newDriver) {
        throw new BadRequestException('New driver (User) not found');
      }
      route.driver = newDriver;
      route.driverId = newDriver.id;
    }

    Object.assign(route, updateRouteDto); // Apply other updates

    const updatedRoute = await this.routeRepository.save(route);
    return this.toRouteResponseDto(updatedRoute);
  }

  async remove(id: string): Promise<void> {
    const route = await this.routeRepository.findOneBy({ id });
    if (!route) {
      throw new NotFoundException('Route not found');
    }
    await this.routeRepository.remove(route);
  }
}
