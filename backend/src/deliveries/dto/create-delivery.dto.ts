import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { LocationDto } from "src/routes/entities/route.entity";
import { DeliveryStatus } from "../entities/delivery.entity";

export class CreateDeliveryDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @Type(() => LocationDto)
  pickUpLocation: LocationDto;

  @Type(() => LocationDto)
  dropOffLocation: LocationDto;

  @IsString()
  itemType: string;

  @IsNumber()
  @Min(0)
  cost: number;
}

export class UpdateDeliveryDto {
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @Type(() => LocationDto)
  pickUpLocation?: LocationDto;

  @IsOptional()
  @Type(() => LocationDto)
  dropOffLocation?: LocationDto;

  @IsOptional()
  @IsString()
  itemType?: string;

  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @IsOptional()
  @IsString()
  proofOfDelivery?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;
}

export class DeliveryResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @Type(() => LocationDto)
  pickUpLocation: LocationDto;

  @Type(() => LocationDto)
  dropOffLocation: LocationDto;

  @IsString()
  itemType: string;

  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @IsOptional()
  @IsString()
  proofOfDelivery?: string;

  @IsNumber()
  cost: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}