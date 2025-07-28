// src/rides/rides.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsGuard } from 'src/auth/guards/ws.guard';
import { GetUserWs } from 'src/auth/decorators/get-user-ws.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';

import { IncomingRideRequestDto, DriverRideResponseDto, RideStatusUpdateDto } from './dto/ride-websocket.dto';
import { RideStatus } from './entities/ride.entity';
import { RideService } from './rides.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Match your CORS settings
    credentials: true,
  },
  namespace: '/rides', // Optional: Use a namespace for ride-related events
})
@UseGuards(WsGuard) // Apply the WebSocket guard to the entire gateway
export class RidesGateway {
  @WebSocketServer()
  server: Server; // Socket.IO server instance

  private readonly logger = new Logger(RidesGateway.name);

  constructor(private readonly rideService: RideService) {}

  // This method will be called when a client connects and is authenticated by the adapter
  handleConnection(@ConnectedSocket() client: Socket, @GetUserWs() user: User) {
    this.logger.log(`Client connected: ${client.id}, User ID: ${user.id}, Role: ${user.role}`);

    // Join a room based on user ID for direct messages (e.g., driver updates, customer status)
    client.join(user.id);

    // If the connected user is a driver, they should also join a 'drivers' room or their own driver ID room
    if (user.role === UserRole.Driver) {
      client.join(`driver_${user.id}`); // Specific room for this driver
      this.logger.log(`Driver ${user.id} joined room 'driver_${user.id}'.`);
    } else if (user.role === UserRole.Customer) {
      client.join(`customer_${user.id}`); // Specific room for this customer
      this.logger.log(`Customer ${user.id} joined room 'customer_${user.id}'.`);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // No need to explicitly leave rooms; Socket.IO handles this on disconnect
  }

  /**
   * Emits a ride request to a specific driver.
   * This method will be called by the HTTP controller after a customer books a ride.
   * @param driverId The ID of the driver to notify.
   * @param payload The ride request details.
   */
  async emitIncomingRideRequest(driverId: string, payload: IncomingRideRequestDto) {
    this.logger.log(`Emitting 'incoming-ride-request' to driver_${driverId} for ride ${payload.rideId}`);
    // Emit to a specific driver's room
    this.server.to(`driver_${driverId}`).emit('incoming-ride-request', payload);
  }

  /**
   * Listens for a driver's response to a ride request.
   * This message comes from the driver's dashboard via WebSocket.
   * Only drivers can accept/decline.
   */
  @SubscribeMessage('driver-ride-response')
  async handleDriverRideResponse(
    @MessageBody() data: DriverRideResponseDto,
    @GetUserWs() driver: User, // Ensure only authenticated drivers can send this
  ) {
    if (driver.role !== UserRole.Driver) {
      this.logger.warn(`Non-driver user ${driver.id} attempted to send 'driver-ride-response'.`);
      // Optionally emit an error back to the client or throw an exception
      throw new Error('Only drivers can respond to ride requests.');
    }

    this.logger.log(`Driver ${driver.id} responded to ride ${data.rideId}: ${data.accepted ? 'Accepted' : 'Declined'}.`);

    try {
      let updatedRide;
      if (data.accepted) {
        updatedRide = await this.rideService.acceptRide(data.rideId, driver.id);
        this.logger.log(`Ride ${data.rideId} accepted by driver ${driver.id}.`);
      } else {
        updatedRide = await this.rideService.declineRide(data.rideId, driver.id);
        this.logger.log(`Ride ${data.rideId} declined by driver ${driver.id}.`);
      }

      // Notify the customer about the ride status update
      const customerBooking = updatedRide.bookings.find(b => b.rideId === updatedRide.id); // Assuming one booking per ride
      if (customerBooking && customerBooking.userId) {
        const customerId = customerBooking.userId;
        const customerUpdatePayload: RideStatusUpdateDto = {
          rideId: updatedRide.id,
          newStatus: updatedRide.status,
          driverName: updatedRide.driver.name || updatedRide.driver.email, // Include driver name if accepted
        };
        this.server.to(`customer_${customerId}`).emit('ride-status-update', customerUpdatePayload);
        this.logger.log(`Emitted 'ride-status-update' to customer ${customerId} for ride ${updatedRide.id} with status ${updatedRide.status}.`);
      } else {
          this.logger.warn(`Could not find customer booking for ride ${updatedRide.id} to send status update.`);
      }

      // Optionally, send a confirmation back to the driver or update their local state
      return { event: 'ride-response-acknowledged', data: updatedRide.id, status: updatedRide.status };

    } catch (error) {
      this.logger.error(`Error processing driver response for ride ${data.rideId}: ${error.message}`);
      // Emit an error back to the driver
      return { event: 'error', data: error.message };
    }
  }
}