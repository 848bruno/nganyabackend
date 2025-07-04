import { Booking } from "../../bookings/entities/booking.entity";
import { Driver } from "../../drivers/entities/driver.entity";
import { User } from "../../users/entities/user.entity";
import { Vehicle } from "../../vehicle/entities/vehicle.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


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
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  driverId: string;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column({ nullable: true })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column('jsonb')
  pickUpLocation: { lat: number; lng: number };

  @Column('jsonb')
  dropOffLocation: { lat: number; lng: number };

  @Column()
  itemType: string;

  @Column({ type: 'enum', enum: ['pending', 'picked_up', 'in_transit', 'delivered', 'cancelled'], default: 'pending' })
  status: string;

  @Column({ nullable: true })
  proofOfDelivery: string;

  @Column({ type: 'float' })
  cost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Booking, booking => booking.delivery)
  bookings: Booking[];
}
