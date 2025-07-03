import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { PaymentMethod, PaymentStatus } from "src/types";

export class CreatePaymentDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  transactionId: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}

export class PaymentResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  userId: string;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsString()
  transactionId: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}