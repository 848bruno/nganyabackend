import { Delivery } from "../../deliveries/entities/delivery.entity";
import { Ride } from "../../rides/entities/ride.entity";
import { User } from "../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  rideId: string;

  @ManyToOne(() => Ride)
  @JoinColumn({ name: 'rideId' })
  ride: Ride;

  @Column({ nullable: true })
  deliveryId: string;

  @ManyToOne(() => Delivery, { nullable: true })
  @JoinColumn({ name: 'deliveryId' })
  delivery: Delivery;

  @Column({ type: 'enum', enum: ['ride', 'delivery'], default: 'ride' })
  type: string;

  @Column({ type: 'enum', enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' })
  status: string;

  @Column({ nullable: true })
  seatNumber: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}