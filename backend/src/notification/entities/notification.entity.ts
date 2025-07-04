import { User } from "../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";



export enum NotificationType {
  BookingConfirmation = 'booking_confirmation',
  DriverArrival = 'driver_arrival',
  DeliveryUpdate = 'delivery_update',
  General = 'general',
  User='user'
}
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;



  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'userId' })
  user: User;
  
  

  @Column()
  message: string;

  @Column({ type: 'enum', enum: ['booking_confirmation', 'driver_arrival', 'delivery_update', 'general'], default: 'general' })
  type: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}