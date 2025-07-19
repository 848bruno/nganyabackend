import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, IsUUID, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RideStatus, RideType } from '../entities/ride.entity'; // Import enums
import { User } from 'src/users/entities/user.entity'; // Import User for DTO

import { Route } from 'src/routes/entities/route.entity'; // Import Route for DTO
import { Booking } from 'src/bookings/entities/booking.entity'; // Import Booking for DTO
import { Review } from 'src/reviews/entities/review.entity'; // Import Review for DTO
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

// DTO for location points (reused from geo module or defined here if specific to rides)
class LocationPointDto {
  @ApiProperty({ example: 34.0522, description: 'Latitude of the location' })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -118.2437, description: 'Longitude of the location' })
  @IsNumber()
  lng: number;
}

export class CreateRideDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'ID of the driver (User) for the ride' })
  @IsNotEmpty()
  @IsUUID('4')
  driverId: string;

  @ApiProperty({ example: 'b1c2d3e4-f5a6-7890-1234-567890abcdef', description: 'ID of the vehicle for the ride' })
  @IsNotEmpty()
  @IsUUID('4')
  vehicleId: string;

  @ApiProperty({ example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef', description: 'Optional ID of the pre-defined route', required: false })
  @IsOptional()
  @IsUUID('4')
  routeId?: string | null; // Allow null for optional route

  @ApiProperty({ type: LocationPointDto, description: 'Pickup location of the ride' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationPointDto)
  pickUpLocation: LocationPointDto;

  @ApiProperty({ type: LocationPointDto, description: 'Dropoff location of the ride' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationPointDto)
  dropOffLocation: LocationPointDto;

  @ApiProperty({ example: RideType.Private, enum: RideType, description: 'Type of ride (private or carpool)' })
  @IsNotEmpty()
  @IsEnum(RideType)
  type: RideType;

  @ApiProperty({ example: RideStatus.Pending, enum: RideStatus, description: 'Status of the ride' })
  @IsNotEmpty()
  @IsEnum(RideStatus)
  status: RideStatus;

  @ApiProperty({ example: 25.50, description: 'Fare for the ride' })
  @IsNotEmpty()
  @IsNumber()
  fare: number;

  @ApiProperty({ example: '2023-07-20T10:00:00Z', description: 'Scheduled start time of the ride', required: false })
  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @ApiProperty({ example: '2023-07-20T10:30:00Z', description: 'Scheduled end time of the ride', required: false })
  @IsOptional()
  @IsDateString()
  endTime?: Date;
}

export class RideResponseDto {
  @ApiProperty({ example: 'uuid-of-ride', description: 'Unique identifier of the ride' })
  id: string;

  @ApiProperty({ example: 'uuid-of-driver-user', description: 'ID of the driver (User) for the ride' })
  driverId: string;

  @ApiProperty({ type: User, description: 'Driver (User) details' })
  driver: User; // Include the full User object for the driver

  @ApiProperty({ example: 'uuid-of-vehicle', description: 'ID of the vehicle for the ride' })
  vehicleId: string;

  @ApiProperty({ type: Vehicle, description: 'Vehicle details' })
  vehicle: Vehicle; // Include the full Vehicle object

  @ApiProperty({ example: 'uuid-of-route', description: 'Optional ID of the pre-defined route', required: false })
  routeId?: string | null;

  @ApiProperty({ type: Route, description: 'Optional route details', required: false })
  route?: Route | null; // Include the full Route object

  @ApiProperty({ type: LocationPointDto, description: 'Pickup location of the ride' })
  pickUpLocation: LocationPointDto;

  @ApiProperty({ type: LocationPointDto, description: 'Dropoff location of the ride' })
  dropOffLocation: LocationPointDto;

  @ApiProperty({ example: RideType.Private, enum: RideType, description: 'Type of ride' })
  type: RideType;

  @ApiProperty({ example: RideStatus.Pending, enum: RideStatus, description: 'Status of the ride' })
  status: RideStatus;

  @ApiProperty({ example: 25.50, description: 'Fare for the ride' })
  fare: number;

  @ApiProperty({ example: '2023-07-20T10:00:00Z', description: 'Start time of the ride', required: false })
  startTime?: Date;

  @ApiProperty({ example: '2023-07-20T10:30:00Z', description: 'End time of the ride', required: false })
  endTime?: Date;

  @ApiProperty({ example: '2023-07-20T09:45:00Z', description: 'Timestamp of ride creation' })
  createdAt: Date;

  @ApiProperty({ example: '2023-07-20T10:15:00Z', description: 'Timestamp of last ride update' })
  updatedAt: Date;

  @ApiProperty({ type: [Booking], description: 'List of bookings for this ride', required: false })
  bookings?: Booking[]; // Include bookings array

  @ApiProperty({ type: [Review], description: 'List of reviews for this ride', required: false })
  reviews?: Review[]; // Include reviews array
}