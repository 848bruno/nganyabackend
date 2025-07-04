import { Ride } from "../../rides/entities/ride.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum VehicleType {
  Sedan = 'sedan',
  SUV = 'suv',
  Luxury = 'luxury',
  Van = 'van',
  Bike = 'bike',
}

export enum VehicleStatus {
  Available = 'available',
  InUse = 'in_use',
  Maintenance = 'maintenance',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  licensePlate: string;

  @Column({ type: 'enum', enum: ['sedan', 'suv', 'luxury', 'van', 'bike'] })
  type: string;

  @Column({ type: 'enum', enum: ['available', 'in_use', 'maintenance'], default: 'available' })
  status: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Ride, ride => ride.vehicle)
  rides: Ride[];
}