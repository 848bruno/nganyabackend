import { Driver } from "../../drivers/entities/driver.entity";
import { Ride } from "../../rides/entities/ride.entity";
import { User } from "../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  driverId: string;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'float' })
  rating: number;

  @Column({ nullable: true })
  comment: string;

  @Column()
  rideId: string;

  @ManyToOne(() => Ride)
  @JoinColumn({ name: 'rideId' })
  ride: Ride;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}