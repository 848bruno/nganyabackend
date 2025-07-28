// src/rides/dto/create-ride.dto.ts
import { IsUUID, IsNumber, IsEnum, ValidateNested, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { RideStatus, RideType } from '../entities/ride.entity';
import { LocationDto } from 'src/routes/entities/route.entity';


// Assuming RideResponseDto already exists from your previous share
// If not, please provide it. For now, I'll provide a placeholder based on the service's `toRideResponseDto`
export class RideResponseDto {
    id: string;
    driverId: string;
    driver: any; // Or a specific UserDto
    vehicleId: string;
    vehicle: any; // Or a specific VehicleDto
    routeId: string | null;
    route: any | null; // Or a specific RouteDto
    pickUpLocation: LocationDto;
    dropOffLocation: LocationDto;
    type: RideType;
    status: RideStatus;
    fare: number;
    startTime: Date | null;
    endTime: Date | null;
    createdAt: Date;
    updatedAt: Date;
    bookings: any[]; // Or specific BookingDto[]
    reviews: any[]; // Or specific ReviewDto[]
}

export class CreateRideDto {
  @IsUUID()
  driverId: string; // The ID of the driver assigned to this ride

  @IsUUID()
  vehicleId: string;

  @IsOptional()
  @IsUUID()
  routeId?: string; // Optional, for carpooling or pre-defined routes

  @ValidateNested()
  @Type(() => LocationDto)
  pickUpLocation: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  dropOffLocation: LocationDto;

  @IsEnum(RideType)
  type: RideType;

  @IsNumber()
  fare: number;

  @IsOptional()
  @IsDateString()
  startTime?: Date;
}

export class UpdateRideDto {
    @IsOptional()
    @IsUUID()
    driverId?: string;

    @IsOptional()
    @IsUUID()
    vehicleId?: string;

    @IsOptional()
    @IsUUID()
    routeId?: string | null; // Allow setting to null

    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    pickUpLocation?: LocationDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    dropOffLocation?: LocationDto;

    @IsOptional()
    @IsEnum(RideType)
    type?: RideType;

    @IsOptional()
    @IsEnum(RideStatus)
    status?: RideStatus; // Allow status updates

    @IsOptional()
    @IsNumber()
    fare?: number;

    @IsOptional()
    @IsDateString()
    startTime?: Date;

    @IsOptional()
    @IsDateString()
    endTime?: Date;
}