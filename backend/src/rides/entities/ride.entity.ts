import { Booking } from "../../bookings/entities/booking.entity";
import { Route } from "../../routes/entities/route.entity";
import { User } from "../../users/entities/user.entity"; // Corrected: Import User entity
import { Review } from "../../reviews/entities/review.entity"; // Import Review entity
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Vehicle } from "src/vehicle/entities/vehicle.entity";


export enum RideType {
  Private = 'private',
  Carpool = 'carpool',
}

export enum RideStatus {
  Pending = 'pending',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Driver is now a User with role 'driver'
  @Column()
  driverId: string;

  @ManyToOne(() => User, (user) => user.ridesAsDriver) // Link to User entity and its ridesAsDriver property
  @JoinColumn({ name: 'driverId' })
  driver: User; // This will be the User who is the driver for the ride

  @Column()
  vehicleId: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ nullable: true }) // Made nullable to match update logic
  routeId: string | null; // Made nullable to match update logic

  @ManyToOne(() => Route, { nullable: true }) // Made nullable to match update logic
  @JoinColumn({ name: 'routeId' })
  route: Route | null; // Made nullable to match update logic

  @Column('jsonb')
  pickUpLocation: { lat: number; lng: number };

  @Column('jsonb')
  dropOffLocation: { lat: number; lng: number };

  @Column({ type: 'enum', enum: RideType, default: RideType.Private }) // Use enum directly
  type: RideType;

  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.Pending }) // Use enum directly
  status: RideStatus;

  @Column({ type: 'float' })
  fare: number;

  @Column({ nullable: true })
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Booking, booking => booking.ride)
  bookings: Booking[];

  @OneToMany(() => Review, review => review.ride)
  reviews: Review[]; // Added reviews relation
}