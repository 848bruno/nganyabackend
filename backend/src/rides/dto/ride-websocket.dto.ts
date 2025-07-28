// src/rides/dto/ride-websocket.dto.ts
import { IsString, IsUUID, IsNumber, IsEnum, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { RideStatus, RideType } from '../entities/ride.entity';
import { LocationDto } from 'src/routes/entities/route.entity';

// DTO for an incoming ride request to the driver
export class IncomingRideRequestDto {
  @IsUUID()
  rideId: string;

  @IsString()
  customerId: string; // The user who requested the ride

  @IsString()
  customerName: string;

  @ValidateNested()
  @Type(() => LocationDto)
  pickUpLocation: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  dropOffLocation: LocationDto;

  @IsNumber()
  fare: number;

  @IsEnum(RideType)
  rideType: RideType;
}

// DTO for a driver's response (accept/decline)
export class DriverRideResponseDto {
  @IsUUID()
  rideId: string;

  @IsBoolean() // Assuming you import IsBoolean from class-validator
  accepted: boolean; // true for accept, false for decline
}

// DTO for customer notification about ride status update
export class RideStatusUpdateDto {
  @IsUUID()
  rideId: string;

  @IsEnum(RideStatus)
  newStatus: RideStatus;

  @IsOptional()
  @IsString()
  driverName?: string; // Optional: if accepted, who is the driver
}