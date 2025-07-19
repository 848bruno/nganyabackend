import { IsOptional, IsNumber, IsString, IsDateString, IsUUID, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RideStatus, RideType } from '../entities/ride.entity'; // Import enums

// DTO for location points
class LocationPointDto {
  @ApiProperty({ example: 34.0522, description: 'Latitude of the location' })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -118.2437, description: 'Longitude of the location' })
  @IsNumber()
  lng: number;
}

export class UpdateRideDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'Updated ID of the driver (User) for the ride', required: false })
  @IsOptional()
  @IsUUID('4')
  driverId?: string | null;

  @ApiProperty({ example: 'b1c2d3e4-f5a6-7890-1234-567890abcdef', description: 'Updated ID of the vehicle for the ride', required: false })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string | null;

  @ApiProperty({ example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef', description: 'Optional updated ID of the pre-defined route, or null to remove', required: false })
  @IsOptional()
  @IsUUID('4')
  routeId?: string | null;

  @ApiProperty({ type: LocationPointDto, description: 'Updated pickup location of the ride', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  pickUpLocation?: LocationPointDto;

  @ApiProperty({ type: LocationPointDto, description: 'Updated dropoff location of the ride', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  dropOffLocation?: LocationPointDto;

  @ApiProperty({ example: RideType.Carpool, enum: RideType, description: 'Updated type of ride', required: false })
  @IsOptional()
  @IsEnum(RideType)
  type?: RideType;

  @ApiProperty({ example: RideStatus.Active, enum: RideStatus, description: 'Updated status of the ride', required: false })
  @IsOptional()
  @IsEnum(RideStatus)
  status?: RideStatus;

  @ApiProperty({ example: 30.00, description: 'Updated fare for the ride', required: false })
  @IsOptional()
  @IsNumber()
  fare?: number;

  @ApiProperty({ example: '2023-07-20T10:10:00Z', description: 'Updated scheduled start time of the ride', required: false })
  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @ApiProperty({ example: '2023-07-20T10:45:00Z', description: 'Updated scheduled end time of the ride', required: false })
  @IsOptional()
  @IsDateString()
  endTime?: Date;
}