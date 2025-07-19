import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Request, Query, NotFoundException } from '@nestjs/common';
import { RideService } from './rides.service';
import { CreateRideDto, RideResponseDto} from './dto/create-ride.dto'; // Corrected: UpdateRideDto is now correctly imported from here
import { Roles } from 'src/auth/decorators/roles.decoretor';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UserRole } from 'src/users/entities/user.entity';
import { RideStatus } from './entities/ride.entity';
import { UpdateRideDto } from './dto/update-ride.dto';

@ApiTags('rides')
@ApiBearerAuth()
@Controller('rides')
export class RidesController { // Corrected: Class name is RidesController
  constructor(private readonly rideService: RideService) {}

  private checkRole(req: any, allowedRoles: UserRole[]) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  @Post()
  @Roles(UserRole.Driver)
  @ApiOperation({ summary: 'Create a new ride' })
  @ApiResponse({ status: 201, type: RideResponseDto })
  async create(@Body() createRideDto: CreateRideDto, @Request() req): Promise<RideResponseDto> {
    this.checkRole(req, [UserRole.Driver]);
    if (req.user.id !== createRideDto.driverId && req.user.role !== UserRole.Admin) {
      throw new ForbiddenException('You can only create rides for yourself or as an admin.');
    }
    return this.rideService.create(createRideDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Get all rides (can filter by status, driver, or customer)' })
  @ApiResponse({ status: 200, type: [RideResponseDto] })
  async findAll(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: RideStatus,
    @Query('driverId') driverId?: string,
    @Query('customerId') customerId?: string,
  ): Promise<{ data: RideResponseDto[], total: number }> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);

    // Logic to restrict access based on role
    if (req.user.role === UserRole.Customer && customerId && req.user.id !== customerId) {
      throw new ForbiddenException('Customers can only view their own rides.');
    }
    if (req.user.role === UserRole.Driver && driverId && req.user.id !== driverId) {
      throw new ForbiddenException('Drivers can only view their own rides.');
    }
    if (req.user.role === UserRole.Driver && !driverId) {
        // If a driver doesn't specify driverId, default to their own
        driverId = req.user.id;
    }
    if (req.user.role === UserRole.Customer && !customerId) {
        // If a customer doesn't specify customerId, default to their own
        customerId = req.user.id;
    }


    return await this.rideService.findAll(page, limit, status, driverId, customerId);
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Get a ride by ID' })
  @ApiResponse({ status: 200, type: RideResponseDto })
  async findOne(@Param('id') id: string, @Request() req): Promise<RideResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    const ride = await this.rideService.findOne(id);

    // Implement access control:
    // Admin can see any ride.
    // Driver can see their own rides.
    // Customer can see rides they have booked.
    const isDriverOfRide = req.user.role === UserRole.Driver && ride.driverId === req.user.id;
    // FIX: Add optional chaining for ride.bookings
    const isCustomerOfRide = req.user.role === UserRole.Customer && ride.bookings?.some(b => b.userId === req.user.id);

    if (req.user.role !== UserRole.Admin && !isDriverOfRide && !isCustomerOfRide) {
      throw new ForbiddenException('You do not have permission to view this ride.');
    }

    return ride;
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Driver) // Only admin or the ride's driver can update
  @ApiOperation({ summary: 'Update a ride' })
  @ApiResponse({ status: 200, type: RideResponseDto })
  async update(@Param('id') id: string, @Body() updateRideDto: UpdateRideDto, @Request() req): Promise<RideResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver]);
    const ride = await this.rideService.findOne(id); // Fetch to check ownership

    if (req.user.role !== UserRole.Admin && ride.driverId !== req.user.id) {
      throw new ForbiddenException('You can only update rides you are driving.');
    }

    return await this.rideService.update(id, updateRideDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin, UserRole.Driver) // Only admin or the ride's driver can delete
  @ApiOperation({ summary: 'Delete a ride' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver]);
    const ride = await this.rideService.findOne(id); // Fetch to check ownership

    if (req.user.role !== UserRole.Admin && ride.driverId !== req.user.id) {
      throw new ForbiddenException('You can only delete rides you are driving.');
    }

    await this.rideService.remove(id);
  }
}