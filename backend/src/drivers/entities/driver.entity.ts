// src/drivers/entities/driver.entity.ts
import { Review } from "../../reviews/entities/review.entity";
import { Ride } from "../..//rides/entities/ride.entity";
import { User } from "../..//users/entities/user.entity"; // Import User entity
import { Vehicle } from "../..//vehicle/entities/vehicle.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm"; // Note PrimaryColumn and OneToOne

@Entity('drivers')
export class Driver {
  // ⭐ NEW: PrimaryColumn for the ID, and OneToOne relation to User ⭐
  // The driver's ID is now directly linked to the user's ID
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @OneToOne(() => User, user => user.driver, { onDelete: 'CASCADE' }) 
  @JoinColumn({ name: 'id' }) 
  user: User; 

  @Column({ default: false })
  isOnline: boolean;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column()
  licenseNumber: string;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ nullable: true })
  vehicleId: string;

  @OneToOne(() => Vehicle, { nullable: true }) // Assuming a driver has one vehicle
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