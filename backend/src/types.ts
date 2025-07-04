// import { Type } from 'class-transformer';
// import { IsNumber } from 'class-validator';

// export enum UserRole {
//   Customer = 'customer',
//   Driver = 'driver',
//   Admin = 'admin',
// }

// export enum VehicleType {
//   Sedan = 'sedan',
//   SUV = 'suv',
//   Luxury = 'luxury',
//   Van = 'van',
//   Bike = 'bike',
// }

// export enum VehicleStatus {
//   Available = 'available',
//   InUse = 'in_use',
//   Maintenance = 'maintenance',
// }

// export enum RideType {
//   Private = 'private',
//   Carpool = 'carpool',
// }

// export enum RideStatus {
//   Pending = 'pending',
//   Active = 'active',
//   Completed = 'completed',
//   Cancelled = 'cancelled',
// }

// export enum BookingType {
//   Ride = 'ride',
//   Delivery = 'delivery',
// }

// export enum BookingStatus {
//   Pending = 'pending',
//   Confirmed = 'confirmed',
//   Cancelled = 'cancelled',
//   Completed = 'completed',
// }

// export enum DeliveryStatus {
//   Pending = 'pending',
//   PickedUp = 'picked_up',
//   InTransit = 'in_transit',
//   Delivered = 'delivered',
//   Cancelled = 'cancelled',
// }

// export enum PaymentMethod {
//   Card = 'card',
//   Wallet = 'wallet',
//   Cash = 'cash',
// }

// export enum PaymentStatus {
//   Pending = 'pending',
//   Completed = 'completed',
//   Failed = 'failed',
// }

// export enum NotificationType {
//   BookingConfirmation = 'booking_confirmation',
//   DriverArrival = 'driver_arrival',
//   DeliveryUpdate = 'delivery_update',
//   General = 'general',
//   User='user'
// }

// export class LocationDto {
//   @IsNumber()
//   lat: number;

//   @IsNumber()
//   lng: number;
// }