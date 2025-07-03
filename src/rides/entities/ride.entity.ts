import { Booking } from "../../bookings/entities/booking.entity";
import { Driver } from "../../drivers/entities/driver.entity";
import { Route } from "../../routes/entities/route.entity";
import { Vehicle } from "../../vehicle/entities/vehicle.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  driverId: string;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column()
  vehicleId: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ nullable: true })
  routeId: string;

  @ManyToOne(() => Route, { nullable: true })
  @JoinColumn({ name: 'routeId' })
  route: Route;

  @Column('jsonb')
  pickUpLocation: { lat: number; lng: number };

  @Column('jsonb')
  dropOffLocation: { lat: number; lng: number };

  @Column({ type: 'enum', enum: ['private', 'carpool'], default: 'private' })
  type: string;

  @Column({ type: 'enum', enum: ['pending', 'active', 'completed', 'cancelled'], default: 'pending' })
  status: string;

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
}