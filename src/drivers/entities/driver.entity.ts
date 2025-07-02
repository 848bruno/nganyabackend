import { Review } from "../../reviews/entities/review.entity";
import { Ride } from "../..//rides/entities/ride.entity";
import { User } from "../..//users/entities/user.entity";
import { Vehicle } from "../..//vehicle/entities/vehicle.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  licenseNumber: string;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ nullable: true })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Ride, ride => ride.driver)
  rides: Ride[];

  @OneToMany(() => Review, review => review.driver)
  reviews: Review[];
}