import { Type } from "class-transformer";
import { IsArray, IsDate, IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { LocationDto } from "../entities/route.entity";

export class CreateRouteDto {
  @IsUUID()
  driverId: string;

  @Type(() => LocationDto)
  startPoint: LocationDto;

  @Type(() => LocationDto)
  endPoint: LocationDto;

  @IsOptional()
  @IsArray()
  @Type(() => LocationDto)
  stops?: LocationDto[];

  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @IsInt()
  @Min(1)
  availableSeats: number;
}

export class UpdateRouteDto {
  @IsOptional()
  @Type(() => LocationDto)
  startPoint?: LocationDto;

  @IsOptional()
  @Type(() => LocationDto)
  endPoint?: LocationDto;

  @IsOptional()
  @IsArray()
  @Type(() => LocationDto)
  stops?: LocationDto[];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startTime?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  availableSeats?: number;
}

export class RouteResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  driverId: string;

  @Type(() => LocationDto)
  startPoint: LocationDto;

  @Type(() => LocationDto)
  endPoint: LocationDto;

  @IsArray()
  @Type(() => LocationDto)
  stops: LocationDto[];

  @IsDate()
  startTime: Date;

  @IsInt()
  availableSeats: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}