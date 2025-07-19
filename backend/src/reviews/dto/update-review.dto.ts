import { IsOptional, IsNumber, IsString, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReviewDto {
  @ApiProperty({ example: 4, description: 'Updated rating (1-5 stars)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: 'Driver was good, but a bit late.', description: 'Updated comment for the review', required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', description: 'Updated ID of the driver (User) being reviewed', required: false })
  @IsOptional()
  @IsUUID('4')
  driverId?: string;

  @ApiProperty({ example: 'b1c2d3e4-f5a6-7890-1234-567890abcdef', description: 'Updated ID of the user (customer) writing the review', required: false })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiProperty({ example: 'c1d2e3f4-a5b6-7890-1234-567890abcdef', description: 'Updated ID of the ride being reviewed', required: false })
  @IsOptional()
  @IsUUID('4')
  rideId?: string;
}
