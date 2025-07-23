// src/chat/chat.gateway.ts (MODIFIED)
import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, ForbiddenException } from '@nestjs/common'; // Removed UseGuards from import
import { User } from 'src/users/entities/user.entity';
import { ChatServices } from './in-app-chat.service';
// import { WsGuard } from 'src/auth/guards/ws.guard'; // REMOVE THIS IMPORT if not used on @SubscribeMessage
import { GetUserWs } from 'src/auth/decorators/get-user-ws.decorator';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
// @UseGuards(WsGuard) // ⭐ REMOVE THIS LINE ⭐
export class ChatGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private userSocketMap = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatServices,
    private readonly configService: ConfigService,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.logger.log(`ChatGateway initialized with CORS origin: ${frontendUrl}`);
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    // User is guaranteed to be present here because WsAuthAdapter verified it
    const user = (client as any).user as User;

    // ⭐ REMOVE THIS BLOCK: The WsAuthAdapter already handles unauthorized disconnects ⭐
    // if (!user) {
    //   this.logger.warn(`Unauthorized client connected: ${client.id}. Disconnecting.`);
    //   client.disconnect(true);
    //   return;
    // }

    this.logger.log(`Client connected: ${client.id} (User: ${user.email}, ID: ${user.id})`);

    // ... rest of handleConnection (add to map, join rooms etc.) ...
    if (!this.userSocketMap.has(user.id)) {
      this.userSocketMap.set(user.id, new Set());
    }
    this.userSocketMap.get(user.id)?.add(client.id);

    client.join(user.id);
    this.logger.log(`User ${user.email} joined personal room: ${user.id}`);

    try {
      const conversations = await this.chatService.getConversationsForUser(user.id);
      conversations.forEach(conv => {
        client.join(conv.id);
        this.logger.log(`User ${user.email} joined conversation room: ${conv.id}`);
      });
    } catch (error) {
      this.logger.error(`Failed to join user ${user.email} to conversations on connect: ${error.message}`);
      client.emit('error', { message: 'Failed to load conversations on connect.' });
    }
  }

  // ... handleDisconnect and @SubscribeMessage methods remain the same ...
}