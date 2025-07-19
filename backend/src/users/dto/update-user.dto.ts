import { IsOptional, IsString, IsEmail, MinLength, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'Jane Doe', description: 'Updated full name of the user', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'jane.doe@example.com', description: 'Updated email address of the user', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'NewStrongPassword123!', description: 'New password for the user account', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @ApiProperty({ example: '0798765432', description: 'Updated phone number of the user', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: UserRole.Driver, enum: UserRole, description: 'Updated role of the user', required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // Driver-specific fields for update
  @ApiProperty({ example: true, description: 'Update driver online status', required: false })
  @IsOptional()
  isOnline?: boolean;

  @ApiProperty({ example: 34.0522, description: 'Update current latitude of the driver', required: false })
  @IsOptional()
  @IsNumber()
  currentLatitude?: number | null;

  @ApiProperty({ example: -118.2437, description: 'Update current longitude of the driver', required: false })
  @IsOptional()
  @IsNumber()
  currentLongitude?: number | null;

  @ApiProperty({ example: 'DL7654321', description: 'Update driver license number', required: false })
  @IsOptional()
  @IsString()
  driverLicenseNumber?: string | null;

  @ApiProperty({ example: 'approved', description: 'Update driver status (pending, approved, rejected)', required: false })
  @IsOptional()
  @IsString() // Use string as per enum in entity, or define a specific enum for this DTO
  driverStatus?: 'pending' | 'approved' | 'rejected' | null;

  @ApiProperty({ example: 200, description: 'Update total rides completed by the driver', required: false })
  @IsOptional()
  @IsNumber()
  totalRidesCompleted?: number;

  @ApiProperty({ example: 4.9, description: 'Update average rating of the driver', required: false })
  @IsOptional()
  @IsNumber()
  averageRating?: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'ID of the assigned vehicle, or null to unassign', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'assignedVehicleId must be a valid UUID' })
  assignedVehicleId?: string | null;
}