// src/rides/entities/ride.entity.ts
import { Booking } from "../../bookings/entities/booking.entity";
import { Route } from "../../routes/entities/route.entity";
import { User } from "../../users/entities/user.entity";
import { Review } from "../../reviews/entities/review.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Vehicle } from "src/vehicle/entities/vehicle.entity";


export enum RideType {
  Private = 'private',
  Carpool = 'carpool',
}

export enum RideStatus {
  Pending = 'pending',
  Accepted = 'accepted', // Add this
  Rejected = 'rejected', // Add this
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  driverId: string;

  @ManyToOne(() => User, (user) => user.ridesAsDriver)
  @JoinColumn({ name: 'driverId' })
  driver: User;

  @Column()
  vehicleId: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ nullable: true })
  routeId: string | null;

  @ManyToOne(() => Route, { nullable: true })
  @JoinColumn({ name: 'routeId' })
  route: Route | null;

  @Column('jsonb')
  pickUpLocation: { lat: number; lng: number };

  @Column('jsonb')
  dropOffLocation: { lat: number; lng: number };

  @Column({ type: 'enum', enum: RideType, default: RideType.Private })
  type: RideType;

  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.Pending })
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
  reviews: Review[];
}