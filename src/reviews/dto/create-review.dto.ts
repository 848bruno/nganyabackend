import { IsDate, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateReviewDto {
  @IsUUID()
  driverId: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  rideId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ReviewResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  driverId: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  rideId: string;

  @IsNumber()
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}