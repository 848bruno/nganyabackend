import { User } from "src/users/entities/user.entity";
import { Booking } from "../../bookings/entities/booking.entity";
// Corrected: Import from 'vehicles' folder
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Vehicle } from "src/vehicle/entities/vehicle.entity";

export enum DeliveryStatus {
  Pending = 'pending',
  PickedUp = 'picked_up',
  InTransit = 'in_transit',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // Customer who requested the delivery

  @ManyToOne(() => User, user => user.deliveriesAsCustomer) // ⭐ Updated: Reference User and its inverse relation ⭐
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  driverId: string | null; // ⭐ Updated: Allow null for driverId ⭐

  @ManyToOne(() => User, user => user.deliveriesAsDriver, { nullable: true }) // ⭐ Updated: Reference User and its inverse relation ⭐
  @JoinColumn({ name: 'driverId' })
  driver: User | null; // ⭐ Updated: Type is now User | null ⭐

  @Column({ nullable: true })
  vehicleId: string | null; // ⭐ Updated: Allow null for vehicleId ⭐

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle | null; // ⭐ Updated: Type is now Vehicle | null ⭐

  @Column('jsonb')
  pickUpLocation: { lat: number; lng: number };

  @Column('jsonb')
  dropOffLocation: { lat: number; lng: number };

  @Column()
  itemType: string;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.Pending }) // ⭐ Updated: Use DeliveryStatus enum directly ⭐
  status: DeliveryStatus; // ⭐ Updated: Type is now DeliveryStatus ⭐

  @Column({ nullable: true })
  proofOfDelivery: string; // URL or path to an image

  @Column({ type: 'float' })
  cost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Booking, booking => booking.delivery)
  bookings: Booking[];
}
