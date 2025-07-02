import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { NotificationType } from "src/types";

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class NotificationResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  userId: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsBoolean()
  isRead: boolean;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

}