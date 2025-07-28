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
  // FIX: Renamed 'seatNumber' to 'numberOfSeats'
  numberOfSeats?: number; // Changed from seatNumber
}

export class UpdateBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsInt()
  // FIX: Renamed 'seatNumber' to 'numberOfSeats'
  numberOfSeats?: number; // Changed from seatNumber
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
  // FIX: Renamed 'seatNumber' to 'numberOfSeats'
  numberOfSeats?: number; // Changed from seatNumber

  // FIX: Added fareAtBooking to BookingResponseDto
  // This was missing and caused a previous error in BookingService's toBookingResponseDto
  // if you were trying to assign it.
  // Add this property if it's part of your desired response.
  fareAtBooking?: number;


  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}