import { Ride } from "../../rides/entities/ride.entity";
import { User } from "../../users/entities/user.entity"; // ⭐ Corrected: Import User entity ⭐
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  driverId: string;

  @ManyToOne(() => User, user => user.reviewsReceived) 
  @JoinColumn({ name: 'driverId' })
  driver: User; 

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.reviewsGiven) 
  user: User;

  @Column({ type: 'int' }) 
  rating: number;

  @Column({ nullable: true })
  comment: string;

  @Column()
  rideId: string;

  @ManyToOne(() => Ride, ride => ride.reviews)
  @JoinColumn({ name: 'rideId' })
  ride: Ride;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
