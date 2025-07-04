import { IsDate, IsEnum, IsInt, IsOptional, IsString, IsUUID } from "class-validator";
import { VehicleStatus, VehicleType } from "../entities/vehicle.entity";

export class CreateVehicleDto {
  @IsString()
  licensePlate: string;

  @IsEnum(VehicleType)
  type: VehicleType;

  @IsEnum(VehicleStatus)
  status: VehicleStatus;

  @IsString()
  model: string;

  @IsInt()
  year: number;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  year?: number;
}

export class VehicleResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  licensePlate: string;

  @IsEnum(VehicleType)
  type: VehicleType;

  @IsEnum(VehicleStatus)
  status: VehicleStatus;

  @IsString()
  model: string;

  @IsInt()
  year: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}