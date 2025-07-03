import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto, NotificationResponseDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  async create(createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: createNotificationDto.userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      user: user,
    });
    const savedNotification = await this.notificationRepository.save(notification);
    return this.toResponseDto(savedNotification);
  }

  async findAll(): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.find({ relations: ['user'] });
    return notifications.map(this.toResponseDto);
  }

  async findByUser(userId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    return notifications.map(this.toResponseDto);
  }

  async findOne(id: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return this.toResponseDto(notification);
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    Object.assign(notification, updateNotificationDto);
    const updatedNotification = await this.notificationRepository.save(notification);
    return this.toResponseDto(updatedNotification);
  }

  async remove(id: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    await this.notificationRepository.remove(notification);
  }

  private toResponseDto = (notification: Notification): NotificationResponseDto => {
    return {
      id: notification.id,
      userId: notification.user?.id ?? notification.userId,
      message: notification.message,
      type: notification.type as NotificationResponseDto['type'],
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  };
  }
