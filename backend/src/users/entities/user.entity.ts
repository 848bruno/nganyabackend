import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Ride } from '../../rides/entities/ride.entity';
import { Route } from '../../routes/entities/route.entity';
import { Delivery } from '../../deliveries/entities/delivery.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';



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
  password: string; // This should store the hashed password

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Customer })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true, default: null })
  hashedRefreshToken: string | null;

  // --- Driver-specific fields (nullable for non-drivers) ---
  @Column({ default: false })
  isOnline: boolean; // For drivers: indicates online status

  @Column({ type: 'double precision', nullable: true }) // Use appropriate numeric type for coordinates
  currentLatitude: number | null; // For drivers: current location

  @Column({ type: 'double precision', nullable: true })
  currentLongitude: number | null; // For drivers: current location

  @Column({ nullable: true, unique: true, type: 'varchar' }) // ⭐ Explicitly set type to 'varchar' for clarity ⭐
  driverLicenseNumber: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    nullable: true, // Only applicable to drivers
  })
  driverStatus: 'pending' | 'approved' | 'rejected' | null;

  @Column({ type: 'int', default: 0 })
  totalRidesCompleted: number; // For drivers

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 }) // e.g., 4.50
  averageRating: number; // For drivers

  @OneToOne(() => Vehicle, (vehicle) => vehicle.currentDriver, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assignedVehicleId' })
  assignedVehicle?: Vehicle | null;

  @Column({ type: 'uuid', nullable: true })
  assignedVehicleId?: string | null;

  // --- Relationships to other entities ---
  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Review, (review) => review.user)
  reviewsGiven: Review[];

  @OneToMany(() => Review, (review) => review.driver) // ⭐ Corrected: Link to review.driver property ⭐
  reviewsReceived: Review[];

  // Rides associated with this user as a driver
  @OneToMany(() => Ride, (ride) => ride.driver)
  ridesAsDriver: Ride[];

  // Routes created by this user as a driver
  @OneToMany(() => Route, (route) => route.driver)
  routesAsDriver: Route[];

  // Deliveries associated with this user as a driver
  @OneToMany(() => Delivery, (delivery) => delivery.driver)
  deliveriesAsDriver: Delivery[];

  // Deliveries associated with this user as a customer
  @OneToMany(() => Delivery, (delivery) => delivery.user)
  deliveriesAsCustomer: Delivery[];
}
