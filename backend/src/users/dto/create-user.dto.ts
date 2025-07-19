import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address of the user', uniqueItems: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!', description: 'Password for the user account' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ example: '0712345678', description: 'Phone number of the user', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: UserRole.Customer, enum: UserRole, description: 'Role of the user (customer, driver, or admin)' })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 'DL1234567', description: 'Driver license number (required if role is driver)', required: false })
  @IsOptional()
  @IsString()
  driverLicenseNumber?: string; // Add this for driver creation
}

// This DTO is for the response, typically sanitizing sensitive data
export class UserResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'Unique identifier of the user' })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address of the user' })
  email: string;

  @ApiProperty({ example: UserRole.Customer, enum: UserRole, description: 'Role of the user' })
  role: UserRole;

  @ApiProperty({ example: '0712345678', description: 'Phone number of the user', required: false })
  phone?: string;

  @ApiProperty({ example: '2023-01-01T12:00:00.000Z', description: 'Timestamp of user creation' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T12:00:00.000Z', description: 'Timestamp of last user update' })
  updatedAt: Date;

  // Include driver-specific fields if they are part of the response you want
  @ApiProperty({ example: true, description: 'Driver online status', required: false })
  @IsOptional()
  isOnline?: boolean;

  @ApiProperty({ example: 34.0522, description: 'Current latitude of the driver', required: false })
  @IsOptional()
  @IsNumber()
  currentLatitude?: number | null;

  @ApiProperty({ example: -118.2437, description: 'Current longitude of the driver', required: false })
  @IsOptional()
  @IsNumber()
  currentLongitude?: number | null;

  @ApiProperty({ example: 'DL1234567', description: 'Driver license number', required: false })
  @IsOptional()
  @IsString()
  driverLicenseNumber?: string | null;

  @ApiProperty({ example: 'approved', description: 'Driver status (pending, approved, rejected)', required: false })
  @IsOptional()
  @IsString()
  driverStatus?: 'pending' | 'approved' | 'rejected' | null;

  @ApiProperty({ example: 150, description: 'Total rides completed by the driver', required: false })
  @IsOptional()
  @IsNumber()
  totalRidesCompleted?: number;

  @ApiProperty({ example: 4.8, description: 'Average rating of the driver', required: false })
  @IsOptional()
  @IsNumber()
  averageRating?: number;

  @ApiProperty({ description: 'Assigned vehicle details (if any)', required: false })
  @IsOptional()
  assignedVehicle?: Vehicle | null;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'ID of the assigned vehicle', required: false })
  @IsOptional()
  @IsUUID('4')
  assignedVehicleId?: string | null;
}