// src/users/entities/user.entity.ts
import { Booking } from '../../bookings/entities/booking.entity';
import { Notification } from "../../notification/entities/notification.entity";
import { Payment } from "../../payments/entities/payment.entity";
import { Review } from "../../reviews/entities/review.entity";
import { Driver } from '../../drivers/entities/driver.entity'; // ⭐ NEW: Import Driver entity ⭐

import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"; // ⭐ NEW: OneToOne ⭐

export enum UserRole {
  Customer = 'customer',
  Driver = 'driver',
  Admin = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: ['customer', 'driver', 'admin'], default: 'customer' })
  role: UserRole; // ⭐ Best practice to use the enum type directly here ⭐

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Booking, booking => booking.user)
  bookings: Booking[];

  @OneToMany(() => Payment, payment => payment.user)
  payments: Payment[];

  @OneToMany(() => Notification, notification => notification.user)
  notifications: Notification[];

  @OneToMany(() => Review, review => review.driver)
  reviewsGiven: Review[];

  @Column({ type: 'text', nullable: true, default: null })
  hashedRefreshToken: string | null;

  @OneToMany(() => Review, review => review.user)
  reviewsReceived: Review[];
  @OneToOne(() => Driver, driver => driver.user)
  driver: Driver;
}