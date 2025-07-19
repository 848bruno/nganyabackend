import { IsNumber } from "class-validator";
import { User } from "../../users/entities/user.entity"; // ⭐ Updated: Import User entity instead of Driver ⭐
import { Ride } from "../../rides/entities/ride.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  driverId: string;

  @ManyToOne(() => User, user => user.routesAsDriver) // ⭐ Updated: Reference User entity and its inverse relation ⭐
  @JoinColumn({ name: 'driverId' })
  driver: User; // ⭐ Updated: Type is now User ⭐

  @Column('jsonb')
  startPoint: { lat: number; lng: number };

  @Column('jsonb')
  endPoint: { lat: number; lng: number };

  @Column('jsonb', { nullable: true })
  stops: { lat: number; lng: number }[];

  @Column()
  startTime: Date;

  @Column()
  availableSeats: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Ride, ride => ride.route)
  rides: Ride[];
}
