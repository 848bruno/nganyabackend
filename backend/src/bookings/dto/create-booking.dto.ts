import { IsDate, IsEnum, IsInt, IsOptional, IsUUID } from "class-validator";
import { BookingStatus, BookingType } from "../entities/booking.entity";


export class CreateBookingDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  rideId: string;

  @IsOptional()
  @IsUUID()
  deliveryId?: string;

  @IsEnum(BookingType)
  type: BookingType;

  @IsOptional()
  @IsInt()
  seatNumber?: number;
}

export class UpdateBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsInt()
  seatNumber?: number;
}

export class BookingResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  rideId: string;

  @IsOptional()
  @IsUUID()
  deliveryId?: string;

  @IsEnum(BookingType)
  type: BookingType;

  @IsEnum(BookingStatus)
  status: BookingStatus;

  @IsOptional()
  @IsInt()
  seatNumber?: number;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}