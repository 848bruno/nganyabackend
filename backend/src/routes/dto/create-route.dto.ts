import { IsNotEmpty, IsNumber, IsString, IsArray, IsOptional, IsDateString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity'; // Import User for RouteResponseDto

// Define a DTO for location points
class LocationPointDto {
  @ApiProperty({ example: 34.0522, description: 'Latitude of the location' })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -118.2437, description: 'Longitude of the location' })
  @IsNumber()
  lng: number;
}

export class CreateRouteDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'ID of the driver (User) creating the route' })
  @IsNotEmpty()
  @IsUUID('4')
  driverId: string;

  @ApiProperty({ type: LocationPointDto, description: 'Starting point of the route' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationPointDto)
  startPoint: LocationPointDto;

  @ApiProperty({ type: LocationPointDto, description: 'Ending point of the route' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationPointDto)
  endPoint: LocationPointDto;

  @ApiProperty({ type: [LocationPointDto], description: 'Optional intermediate stops', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationPointDto)
  stops?: LocationPointDto[];

  @ApiProperty({ example: '2023-07-20T09:00:00Z', description: 'Scheduled start time of the route' })
  @IsNotEmpty()
  @IsDateString()
  startTime: Date;

  @ApiProperty({ example: 4, description: 'Number of available seats for carpooling' })
  @IsNotEmpty()
  @IsNumber()
  availableSeats: number;
}

export class UpdateRouteDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'ID of the driver (User) for the route', required: false })
  @IsOptional()
  @IsUUID('4')
  driverId?: string;

  @ApiProperty({ type: LocationPointDto, description: 'Updated starting point of the route', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  startPoint?: LocationPointDto;

  @ApiProperty({ type: LocationPointDto, description: 'Updated ending point of the route', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  endPoint?: LocationPointDto;

  @ApiProperty({ type: [LocationPointDto], description: 'Updated intermediate stops', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationPointDto)
  stops?: LocationPointDto[];

  @ApiProperty({ example: '2023-07-20T10:00:00Z', description: 'Updated scheduled start time of the route', required: false })
  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @ApiProperty({ example: 3, description: 'Updated number of available seats', required: false })
  @IsOptional()
  @IsNumber()
  availableSeats?: number;
}

export class RouteResponseDto {
  @ApiProperty({ example: 'uuid-of-route', description: 'Unique identifier of the route' })
  id: string;

  @ApiProperty({ example: 'uuid-of-driver-user', description: 'ID of the driver (User) for the route' })
  driverId: string;

  @ApiProperty({ type: User, description: 'Driver (User) details' })
  driver: User; // Include the full User object for the driver

  @ApiProperty({ type: LocationPointDto, description: 'Starting point of the route' })
  startPoint: LocationPointDto;

  @ApiProperty({ type: LocationPointDto, description: 'Ending point of the route' })
  endPoint: LocationPointDto;

  @ApiProperty({ type: [LocationPointDto], description: 'Optional intermediate stops', required: false })
  stops?: LocationPointDto[];

  @ApiProperty({ example: '2023-07-20T09:00:00Z', description: 'Scheduled start time of the route' })
  startTime: Date;

  @ApiProperty({ example: 4, description: 'Number of available seats' })
  availableSeats: number;

  @ApiProperty({ example: '2023-07-20T08:30:00Z', description: 'Timestamp of route creation' })
  createdAt: Date;

  @ApiProperty({ example: '2023-07-20T09:15:00Z', description: 'Timestamp of last route update' })
  updatedAt: Date;
}
