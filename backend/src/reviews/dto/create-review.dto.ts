import { IsNotEmpty, IsNumber, IsString, IsUUID, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity'; // Import User for DTO
import { Ride } from 'src/rides/entities/ride.entity'; // Import Ride for DTO

export class CreateReviewDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'ID of the driver (User) being reviewed' })
  @IsNotEmpty()
  @IsUUID('4')
  driverId: string;

  @ApiProperty({ example: 'b1c2d3e4-f5a6-7890-1234-567890abcdef', description: 'ID of the user (customer) writing the review' })
  @IsNotEmpty()
  @IsUUID('4')
  userId: string;

  @ApiProperty({ example: 5, description: 'Rating given (1-5 stars)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great ride, very friendly driver!', description: 'Optional comment for the review', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef', description: 'ID of the ride being reviewed' })
  @IsNotEmpty()
  @IsUUID('4')
  rideId: string;
}

export class ReviewResponseDto {
  @ApiProperty({ example: 'uuid-of-review', description: 'Unique identifier of the review' })
  id: string;

  @ApiProperty({ example: 'uuid-of-driver-user', description: 'ID of the driver (User) being reviewed' })
  driverId: string;

  @ApiProperty({ type: User, description: 'Driver (User) details' })
  driver: User; // Full User object for the driver

  @ApiProperty({ example: 'uuid-of-customer-user', description: 'ID of the user (customer) writing the review' })
  userId: string;

  @ApiProperty({ type: User, description: 'User (customer) details' })
  user: User; // Full User object for the customer

  @ApiProperty({ example: 5, description: 'Rating given (1-5 stars)' })
  rating: number;

  @ApiProperty({ example: 'Great ride, very friendly driver!', description: 'Optional comment for the review', required: false })
  comment?: string;

  @ApiProperty({ example: 'uuid-of-ride', description: 'ID of the ride being reviewed' })
  rideId: string;

  @ApiProperty({ type: Ride, description: 'Ride details' })
  ride: Ride; // Full Ride object

  @ApiProperty({ example: '2023-07-20T09:45:00Z', description: 'Timestamp of review creation' })
  createdAt: Date;

  @ApiProperty({ example: '2023-07-20T10:15:00Z', description: 'Timestamp of last review update' })
  updatedAt: Date;
}
