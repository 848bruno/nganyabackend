// src/auth/guards/ws.guard.ts
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/users/users.service'; // Assuming you have a UserService to find users by ID

@Injectable()
export class WsGuard implements CanActivate {
  private readonly logger = new Logger(WsGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService, // Inject UserService
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const authToken = client.handshake.headers.authorization;

    if (!authToken) {
      this.logger.warn('No authorization token provided for WebSocket connection.');
      client.emit('error', { message: 'Unauthorized: No token provided' });
      return false;
    }

    const token = authToken.split(' ')[1]; // Expecting "Bearer <token>"

    if (!token) {
      this.logger.warn('Invalid authorization header format for WebSocket connection.');
      client.emit('error', { message: 'Unauthorized: Invalid token format' });
      return false;
    }

    try {
      const jwtSecret = this.configService.get<string>('AT_SECRET'); // Use your access token secret
      const payload = this.jwtService.verify(token, { secret: jwtSecret });

      // Attach user payload to the socket for later use
      (client as any).user = payload;
      this.logger.debug(`WebSocket client ${client.id} authenticated successfully. User ID: ${payload.sub}`);

      // You might want to fetch the full user object from the database
      // and attach it, especially if the JWT payload is minimal.
      // For this example, we'll fetch the user and attach it.
      return this.validateUser(payload.sub, client);

    } catch (error) {
      this.logger.error(`WebSocket authentication failed: ${error.message}`);
      client.emit('error', { message: 'Unauthorized: Invalid token', details: error.message });
      return false;
    }
  }

  private async validateUser(userId: string, client: Socket): Promise<boolean> {
    try {
      const user = await this.userService.findOne(userId); // Fetch the user from your database
      if (!user) {
        this.logger.warn(`User with ID ${userId} not found in database for WebSocket connection.`);
        client.emit('error', { message: 'Unauthorized: User not found' });
        return false;
      }
      (client as any).user = user; // Attach the full user object to the socket
      return true;
    } catch (error) {
      this.logger.error(`Error validating user from database for WebSocket: ${error.message}`);
      client.emit('error', { message: 'Internal server error during authentication' });
      return false;
    }
  }
}
