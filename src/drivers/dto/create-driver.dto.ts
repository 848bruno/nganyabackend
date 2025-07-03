import { IsDate, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateDriverDto {
  @IsUUID()
  userId: string;

  @IsString()
  licenseNumber: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;
}

export class DriverResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  userId: string;

  @IsString()
  licenseNumber: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}
