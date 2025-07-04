import { IsNumber } from "class-validator";
import { Driver } from "../../drivers/entities/driver.entity";
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

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

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