// src/drivers/dto/create-driver.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Assuming you use Swagger

export class CreateDriverDto {
  // ⭐ REMOVED: userId - it's implicitly handled by the OneToOne relationship ⭐
  // The ID of the driver entity will be the ID of the associated user.

  @ApiProperty({ description: 'Driver license number', example: 'XYZ12345' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  // Optional fields for initial creation if they can be set right away
  @ApiProperty({ description: 'Initial driver rating (optional)', example: 4.5, required: false })
  @IsNumber()
  @IsOptional()
  rating?: number;

  @ApiProperty({ description: 'Initial vehicle ID (optional)', example: 'some-uuid-vehicle', required: false })
  @IsString()
  @IsOptional()
  vehicleId?: string;
}

// DriverResponseDto remains largely the same, mirroring the Driver entity structure
export class DriverResponseDto {
  @ApiProperty({ description: 'Unique identifier for the driver', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id: string; // This is now the User ID

  @ApiProperty({ description: 'Whether the driver is currently online', example: true })
  isOnline: boolean;

  @ApiProperty({ description: 'Current latitude of the driver', example: 34.0522, nullable: true })
  latitude: number | null;

  @ApiProperty({ description: 'Current longitude of the driver', example: -118.2437, nullable: true })
  longitude: number | null;

  @ApiProperty({ description: 'Driver license number', example: 'XYZ12345' })
  licenseNumber: string;

  @ApiProperty({ description: 'Average rating of the driver', example: 4.7 })
  rating: number;

  @ApiProperty({ description: 'Associated vehicle ID (optional)', example: 'some-uuid-vehicle', nullable: true })
  vehicleId: string | null;

  @ApiProperty({ description: 'Timestamp when the driver profile was created', example: '2023-10-27T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the driver profile was last updated', example: '2023-10-27T10:30:00Z' })
  updatedAt: Date;

  // You might want to include nested User info here for a complete response
  // @ApiProperty({ type: () => UserResponseDto, description: 'Associated user details' })
  // user: UserResponseDto; // Assuming you have a UserResponseDto
}