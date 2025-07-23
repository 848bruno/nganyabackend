import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Request, Query, BadRequestException, NotFoundException, ParseFloatPipe } from '@nestjs/common'; // ⭐ Added ParseFloatPipe import ⭐
import { UserService } from './users.service';
import { CreateUserDto, UserResponseDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/auth/decorators/roles.decoretor';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { User, UserRole } from './entities/user.entity';
import { LocationService } from 'src/geo/geo.service'; // Import LocationService
import { Vehicle } from 'src/vehicle/entities/vehicle.entity'; // Import Vehicle for return type
import { Public } from 'src/auth/decorators';

// DTOs for new endpoints
class UpdateOnlineStatusDto {
  isOnline: boolean;
}

class UpdateLocationDto {
  latitude: number;
  longitude: number;
}

class AssignVehicleDto {
  vehicleId: string;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly locationService: LocationService, // Inject LocationService
  ) {}

  private checkRole(req: any, allowedRoles: UserRole[]) {
    console.log('checkRole: req.user:', req.user);
    if (!req.user) {
   
      throw new ForbiddenException('Authentication required to perform this action');
    }
    

    const includesRole = allowedRoles.includes(req.user.role);
    

    if (!includesRole) {
      console.error(`checkRole: User role '${req.user.role}' not in allowed roles: ${allowedRoles.join(', ')}. THROWING FORBIDDEN (role mismatch).`); // ⭐ NEW LOG ⭐
      throw new ForbiddenException('You do not have permission to perform this action');
    }
    console.log('checkRole: Role check PASSED.');
  }

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create a new user (can be a driver or customer)' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() createUserDto: CreateUserDto, @Request() req): Promise<UserResponseDto> {
    this.checkRole(req, [UserRole.Admin]);
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Get all users (admin only, can filter by role)' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: UserRole,
    @Query('q') q?: string,
  ): Promise<{ data: User[]; total: number }> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    return await this.userService.findAll(page, limit, role, q);
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Get a user by ID (including self)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(@Param('id') id: string, @Request() req): Promise<UserResponseDto> { // ⭐ FIXED: Changed return type to UserResponseDto ⭐
    console.log('findOne: req.user (from JWT guard):', req.user);

    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);

    let userIdToFetch = id;
    if (id === 'me') {
      if (!req.user || !req.user.id) {
        console.error('findOne: THROWING FORBIDDEN (no req.user.id for "me").'); // ⭐ NEW LOG ⭐
        throw new ForbiddenException('Authentication required to access "me" profile.');
      }
      userIdToFetch = req.user.id;
    }

    if (req.user.role !== UserRole.Admin && req.user.id !== userIdToFetch) {
      console.error('findOne: THROWING FORBIDDEN (cannot view other user profile).'); // ⭐ NEW LOG ⭐
      throw new ForbiddenException('You can only view your own profile');
    }

    const user = await this.userService.findOne(userIdToFetch);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userService.toUserResponseDto(user);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Customer, UserRole.Driver)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req): Promise<UserResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Customer, UserRole.Driver]);
    
    let userIdToUpdate = id;
    if (id === 'me') {
      if (!req.user || !req.user.id) {
        console.error('update: THROWING FORBIDDEN (no req.user.id for "me").'); // ⭐ NEW LOG ⭐
        throw new ForbiddenException('Authentication required to update "me" profile.');
      }
      userIdToUpdate = req.user.id;
    }

    if (req.user.role !== UserRole.Admin && req.user.id !== userIdToUpdate) {
      console.error('update: THROWING FORBIDDEN (cannot update other user profile).'); // ⭐ NEW LOG ⭐
      throw new ForbiddenException('You can only update your own profile');
    }
    return await this.userService.update(userIdToUpdate, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    this.checkRole(req, [UserRole.Admin]);
    
    let userIdToDelete = id;
    if (id === 'me') {
      if (!req.user || !req.user.id) {
        console.error('remove: THROWING FORBIDDEN (no req.user.id for "me").'); // ⭐ NEW LOG ⭐
        throw new ForbiddenException('Authentication required to delete "me" profile.');
      }
      userIdToDelete = req.user.id;
    }
    
    if (req.user.role !== UserRole.Admin && req.user.id !== userIdToDelete) {
      console.error('remove: THROWING FORBIDDEN (cannot delete other user profile).'); // ⭐ NEW LOG ⭐
      throw new ForbiddenException('You can only delete your own profile if explicitly allowed, or be an admin to delete others.');
    }

    await this.userService.remove(userIdToDelete);
  }

  // --- New / Modified Endpoints for Driver-Specific Actions ---

  @Patch('me/status')
  @Roles(UserRole.Driver)
  @ApiOperation({ summary: 'Update authenticated driver online status' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateDriverStatus(@Request() req, @Body() body: UpdateOnlineStatusDto): Promise<UserResponseDto> {
    this.checkRole(req, [UserRole.Driver]);
    if (req.user.role !== UserRole.Driver) {
      console.error('updateDriverStatus: THROWING FORBIDDEN (not a driver).'); // ⭐ NEW LOG ⭐
      throw new ForbiddenException('Only drivers can update their online status.');
    }
    const updatedUser = await this.userService.updateDriverOnlineStatus(req.user.id, body.isOnline);
    return this.userService.toUserResponseDto(updatedUser);
  }

  @Post('location')
  @Roles(UserRole.Driver)
  @ApiOperation({ summary: 'Update authenticated driver current location' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiBody({ type: UpdateLocationDto })
  async updateDriverLocation(@Request() req, @Body() body: UpdateLocationDto): Promise<UserResponseDto> {
    this.checkRole(req, [UserRole.Driver]);
    if (req.user.role !== UserRole.Driver) {
      console.error('updateDriverLocation: THROWING FORBIDDEN (not a driver).'); // ⭐ NEW LOG ⭐
      throw new ForbiddenException('Only drivers can update their location.');
    }
    const updatedUser = await this.userService.updateDriverLocation(req.user.id, body.latitude, body.longitude);
    return this.userService.toUserResponseDto(updatedUser);
  }

  @Patch(':userId/assign-vehicle')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Assign a vehicle to a driver user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiBody({ type: AssignVehicleDto })
  async assignVehicle(@Param('userId') userId: string, @Body() body: AssignVehicleDto, @Request() req): Promise<UserResponseDto> {
    this.checkRole(req, [UserRole.Admin]);
    const updatedUser = await this.userService.assignVehicleToDriver(userId, body.vehicleId);
    return this.userService.toUserResponseDto(updatedUser);
  }
  @Public()
  @Get('drivers/nearest')

  @ApiOperation({ summary: 'Find nearest online drivers for booking' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async getNearestDrivers(
    @Query('latitude', ParseFloatPipe) latitude: number, // ⭐ ADDED ParseFloatPipe ⭐
    @Query('longitude', ParseFloatPipe) longitude: number, // ⭐ ADDED ParseFloatPipe ⭐
    @Query('maxDistanceKm') maxDistanceKm: number = 5,
    @Query('limit') limit: number = 5,
  ): Promise<(User & { distance?: number })[]> {
    // No role check needed here as Roles decorator handles it
    // ⭐ REMOVED manual typeof check as ParseFloatPipe handles conversion or throws error ⭐
    // if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    //   throw new BadRequestException('Latitude and longitude are required and must be numbers.');
    // }
    // LocationService now queries UserService for drivers
    return this.userService.findNearestOnlineDrivers( // ⭐ Changed to userService ⭐
      latitude,
      longitude,
      maxDistanceKm,
      limit
    );
  }

  @Get('me/vehicle')
  @Roles(UserRole.Driver)
  @ApiOperation({ summary: 'Get authenticated driver\'s assigned vehicle' })
  @ApiResponse({ status: 200, type: Vehicle })
  async getMyVehicle(@Request() req): Promise<Vehicle | null> {
    this.checkRole(req, [UserRole.Driver]);
    return await this.userService.getDriverAssignedVehicle(req.user.id);
  }

  @Get('me/rides')
  @Roles(UserRole.Driver)
  @ApiOperation({ summary: 'Get authenticated driver\'s rides' })
  @ApiResponse({ status: 200, type: [Object] })
  async getMyRides(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ): Promise<{ data: any[], total: number }> {
    this.checkRole(req, [UserRole.Driver]);
    return await this.userService.getDriverRides(req.user.id, page, limit, status);
  }
}
