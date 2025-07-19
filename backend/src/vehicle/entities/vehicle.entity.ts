import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne, // Change to OneToOne as a vehicle has one current driver (User)
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Import User

export enum VehicleType {
  Sedan = 'sedan',
  SUV = 'suv',
  Luxury = 'luxury',
  Van = 'van',
  Bike = 'bike',
}

export enum VehicleStatus {
  Available = 'available',
  InUse = 'in_use', // Renamed from 'on_trip' for consistency
  Maintenance = 'maintenance',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  licensePlate: string;

  @Column({ type: 'enum', enum: VehicleType })
  type: VehicleType;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.Available })
  status: VehicleStatus;

  @Column()
  model: string;

  @Column()
  year: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


  @OneToOne(() => User, (user) => user.assignedVehicle, {
    nullable: true,
  })
  currentDriver?: User | null;
}