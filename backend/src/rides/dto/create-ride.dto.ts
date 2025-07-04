import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNumber, IsOptional, IsUUID, Min } from "class-validator";
import { LocationDto } from "src/routes/entities/route.entity";
import { RideStatus, RideType } from "../entities/ride.entity";


export class CreateRideDto {
  @IsUUID()
  driverId: string;

  @IsUUID()
  vehicleId: string;

  @IsOptional()
  @IsUUID()
  routeId?: string;

  @Type(() => LocationDto)
  pickUpLocation: LocationDto;

  @Type(() => LocationDto)
  dropOffLocation: LocationDto;

  @IsEnum(RideType)
  type: RideType;

  @IsNumber()
  @Min(0)
  fare: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startTime?: Date;
}

export class UpdateRideDto {
  @IsOptional()
  @IsEnum(RideStatus)
  status?: RideStatus;

  @IsOptional()
  @Type(() => LocationDto)
  pickUpLocation?: LocationDto;

  @IsOptional()
  @Type(() => LocationDto)
  dropOffLocation?: LocationDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fare?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startTime?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endTime?: Date;
}

export class RideResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  driverId: string;

  @IsUUID()
  vehicleId: string;

  @IsOptional()
  @IsUUID()
  routeId?: string;

  @Type(() => LocationDto)
  pickUpLocation: LocationDto;

  @Type(() => LocationDto)
  dropOffLocation: LocationDto;

  @IsEnum(RideType)
  type: RideType;

  @IsEnum(RideStatus)
  status: RideStatus;

  @IsNumber()
  fare: number;

  @IsOptional()
  @IsDate()
  startTime?: Date;

  @IsOptional()
  @IsDate()
  endTime?: Date;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}