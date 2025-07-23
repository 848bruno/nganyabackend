// src/ws-auth.adapter.ts
import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server as SocketIoServer, Socket } from 'socket.io';
import { AuthService } from './auth/auth.service'; // Assuming you have an AuthService to verify JWT
import { Logger } from '@nestjs/common';

export class WsAuthAdapter extends IoAdapter {
  private readonly logger = new Logger(WsAuthAdapter.name);

  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: any): SocketIoServer {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Ensure CORS is set here too
        credentials: true,
      },
    });

    // Get AuthService instance from NestJS DI container
    const authService = this.app.get(AuthService); // Make sure AuthService is a provider in your AppModule

    server.use(async (socket: Socket, next) => {
      this.logger.log(`WsAuthAdapter: Incoming socket connection for ID: ${socket.id}`);
      const token = socket.handshake.auth.token;

      if (!token) {
        this.logger.warn(`WsAuthAdapter: No token provided for client ${socket.id}. Disconnecting.`);
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        // Use your AuthService or JwtService to verify the token
        // This is where the actual JWT verification happens before anything else
        // Ensure this verification method returns a user or throws an error
        const user = await authService.verifyWsToken(token); // ⭐ You'll need to add this method to AuthService ⭐

        // Attach the user to the socket for later access in your gateway
        (socket as any).user = user;
        this.logger.log(`WsAuthAdapter: User ${user.email} (ID: ${user.id}) authenticated successfully.`);
        next(); // Allow connection to proceed to gateway
      } catch (error) {
        this.logger.error(`WsAuthAdapter: Token verification failed for client ${socket.id}: ${error.message}`);
        // Forcefully disconnect for unauthorized access
        next(new Error(`Authentication error: ${error.message}`));
      }
    });

    return server;
  }
}