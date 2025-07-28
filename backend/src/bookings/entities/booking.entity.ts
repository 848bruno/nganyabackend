// src/bookings/entities/booking.entity.ts
import { Delivery } from "../../deliveries/entities/delivery.entity"; // Ensure this path is correct
import { Ride } from "../../rides/entities/ride.entity"; // Ensure this path is correct
import { User } from "../../users/entities/user.entity"; // Ensure this path is correct
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// Ensure these enums are correctly defined and exported
export enum BookingType {
  Ride = 'ride',
  Delivery = 'delivery',
}

export enum BookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Completed = 'completed',
  Rejected = 'rejected', // Added this for consistency with ride status flow
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' }) // Explicitly define UUID type
  userId: string;

  @ManyToOne(() => User, user => user.bookings) // Assuming User entity has a 'bookings' relation
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' }) // Explicitly define UUID type
  rideId: string;

  @ManyToOne(() => Ride, ride => ride.bookings) // Assuming Ride entity has a 'bookings' relation
  @JoinColumn({ name: 'rideId' })
  ride: Ride;

  @Column({ type: 'uuid', nullable: true }) // Explicitly define UUID type and nullable
  deliveryId: string;

  @ManyToOne(() => Delivery, delivery => delivery.bookings, { nullable: true }) // Assuming Delivery entity has a 'bookings' relation
  @JoinColumn({ name: 'deliveryId' })
  delivery: Delivery;

  // Use the enum BookingType for the type column
  @Column({ type: 'enum', enum: BookingType, default: BookingType.Ride })
  type: BookingType; // Changed to BookingType enum

  // Use the enum BookingStatus for the status column
  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.Pending })
  status: BookingStatus; // Changed to BookingStatus enum

  // Renamed from seatNumber to numberOfSeats for consistency with the service
  @Column({ type: 'int', nullable: true }) // Changed type to int
  numberOfSeats: number;

  // Added this column as it was being assigned in ride.service.ts
  @Column({ type: 'float', nullable: true }) // Assuming fare can be a float
  fareAtBooking: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}