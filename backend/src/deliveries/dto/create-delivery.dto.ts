import { IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '../entities/delivery.entity';
import { User } from 'src/users/entities/user.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';


// DTO for location points
class LocationPointDto {
  @ApiProperty({ example: 34.0522, description: 'Latitude of the location' })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -118.2437, description: 'Longitude of the location' })
  @IsNumber()
  lng: number;
}

export class CreateDeliveryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'ID of the user (customer) requesting the delivery' })
  @IsNotEmpty()
  @IsUUID('4')
  userId: string;

  @ApiProperty({ example: 'b1c2d3e4-f5a6-7890-1234-567890abcdef', description: 'Optional ID of the driver (User) assigned to the delivery', required: false })
  @IsOptional()
  @IsUUID('4')
  driverId?: string | null;

  @ApiProperty({ example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef', description: 'Optional ID of the vehicle used for the delivery', required: false })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string | null;

  @ApiProperty({ type: LocationPointDto, description: 'Pickup location of the delivery' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationPointDto)
  pickUpLocation: LocationPointDto;

  @ApiProperty({ type: LocationPointDto, description: 'Dropoff location of the delivery' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationPointDto)
  dropOffLocation: LocationPointDto;

  @ApiProperty({ example: 'Electronics', description: 'Type of item being delivered' })
  @IsNotEmpty()
  @IsString()
  itemType: string;

  @ApiProperty({ example: 15.75, description: 'Cost of the delivery' })
  @IsNotEmpty()
  @IsNumber()
  cost: number;
}

export class UpdateDeliveryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'Updated ID of the user (customer) requesting the delivery', required: false })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiProperty({ example: 'b1c2d3e4-f5a6-7890-1234-567890abcdef', description: 'Updated ID of the driver (User) assigned to the delivery, or null to unassign', required: false })
  @IsOptional()
  @IsUUID('4')
  driverId?: string | null;

  @ApiProperty({ example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef', description: 'Updated ID of the vehicle used for the delivery, or null to unassign', required: false })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string | null;

  @ApiProperty({ type: LocationPointDto, description: 'Updated pickup location of the delivery', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  pickUpLocation?: LocationPointDto;

  @ApiProperty({ type: LocationPointDto, description: 'Updated dropoff location of the delivery', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  dropOffLocation?: LocationPointDto;

  @ApiProperty({ example: 'Documents', description: 'Updated type of item being delivered', required: false })
  @IsOptional()
  @IsString()
  itemType?: string;

  @ApiProperty({ example: DeliveryStatus.InTransit, enum: DeliveryStatus, description: 'Updated status of the delivery', required: false })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @ApiProperty({ example: 'https://example.com/proof.jpg', description: 'URL or path to proof of delivery image', required: false })
  @IsOptional()
  @IsString()
  proofOfDelivery?: string;

  @ApiProperty({ example: 20.00, description: 'Updated cost of the delivery', required: false })
  @IsOptional()
  @IsNumber()
  cost?: number;
}

export class DeliveryResponseDto {
  @ApiProperty({ example: 'uuid-of-delivery', description: 'Unique identifier of the delivery' })
  id: string;

  @ApiProperty({ example: 'uuid-of-customer-user', description: 'ID of the user (customer) requesting the delivery' })
  userId: string;

  @ApiProperty({ type: User, description: 'User (customer) details' })
  user: User;

  @ApiProperty({ example: 'uuid-of-driver-user', description: 'Optional ID of the driver (User) assigned to the delivery', required: false })
  driverId?: string | null;

  @ApiProperty({ type: User, description: 'Optional driver (User) details', required: false })
  driver?: User | null;

  @ApiProperty({ example: 'uuid-of-vehicle', description: 'Optional ID of the vehicle used for the delivery', required: false })
  vehicleId?: string | null; // ⭐ Updated to allow null ⭐

  @ApiProperty({ type: Vehicle, description: 'Optional vehicle details', required: false })
  vehicle?: Vehicle | null;

  @ApiProperty({ type: LocationPointDto, description: 'Pickup location of the delivery' })
  pickUpLocation: LocationPointDto;

  @ApiProperty({ type: LocationPointDto, description: 'Dropoff location of the delivery' })
  dropOffLocation: LocationPointDto;

  @ApiProperty({ example: 'Electronics', description: 'Type of item being delivered' })
  itemType: string;

  @ApiProperty({ example: DeliveryStatus.Pending, enum: DeliveryStatus, description: 'Status of the delivery' })
  status: DeliveryStatus;

  @ApiProperty({ example: 'https://example.com/proof.jpg', description: 'URL or path to proof of delivery image', required: false })
  proofOfDelivery?: string;

  @ApiProperty({ example: 15.75, description: 'Cost of the delivery' })
  cost: number;

  @ApiProperty({ example: '2023-07-20T09:45:00Z', description: 'Timestamp of delivery creation' })
  createdAt: Date;

  @ApiProperty({ example: '2023-07-20T10:15:00Z', description: 'Timestamp of last delivery update' })
  updatedAt: Date;
}
