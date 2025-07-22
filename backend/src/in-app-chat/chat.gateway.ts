// src/chat/chat.gateway.ts
import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger, ForbiddenException } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity'; // Import User entity
import { ChatServices } from './in-app-chat.service';
import { WsGuard } from 'src/auth/guards/ws.guard';
import { GetUserWs } from 'src/auth/decorators/get-user-ws.decorator';
import { ConfigService } from '@nestjs/config'; // Import ConfigService

// DTOs for WebSocket messages (you might want to create separate files for these)
interface SendMessageDto {
  conversationId: string;
  content: string;
}

interface CreateConversationDto {
  participantIds: string[];
  title?: string;
}

@WebSocketGateway({
  // **IMPORTANT CORS CONFIGURATION:**
  // This CORS configuration here is often overridden by the IoAdapter in main.ts
  // if you're attaching Socket.IO to the main HTTP server.
  // However, it's good practice to keep it consistent.
  // Using process.env.FRONTEND_URL for dynamic origin.
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Use env var, fallback to dev URL
    credentials: true,
  },
})
@UseGuards(WsGuard) // Apply WebSocket guard for authentication
export class ChatGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  // Store a mapping of userId to an array of socket IDs for that user
  // This is crucial for sending messages to all active connections of a user
  private userSocketMap = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatServices,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {
    // Re-read frontend URL from ConfigService for robustness, though decorator uses process.env
    // This is more for internal logic if needed, the decorator config is what matters for Socket.IO server
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.logger.log(`ChatGateway initialized with CORS origin: ${frontendUrl}`);
  }

  // Handle client connection
  async handleConnection(@ConnectedSocket() client: Socket) {
    // The @UseGuards(WsGuard) will have already run and attached the user to the socket
    // if the authentication was successful.
    const user = (client as any).user as User; // Assuming WsGuard attaches user

    if (!user) {
      this.logger.warn(`Unauthorized client connected: ${client.id}. Disconnecting.`);
      client.disconnect(true); // Disconnect unauthorized clients immediately
      return;
    }

    this.logger.log(`Client connected: ${client.id} (User: ${user.email}, ID: ${user.id})`);

    // Add socket to the user's set of active sockets
    if (!this.userSocketMap.has(user.id)) {
      this.userSocketMap.set(user.id, new Set());
    }
    this.userSocketMap.get(user.id)?.add(client.id);

    // Join a room for the user's ID to send personal notifications (e.g., new conversation alerts)
    client.join(user.id);
    this.logger.log(`User ${user.email} joined personal room: ${user.id}`);

    // Fetch and join all conversations the user is a part of
    try {
      const conversations = await this.chatService.getConversationsForUser(user.id);
      conversations.forEach(conv => {
        client.join(conv.id);
        this.logger.log(`User ${user.email} joined conversation room: ${conv.id}`);
      });
    } catch (error) {
      this.logger.error(`Failed to join user ${user.email} to conversations on connect: ${error.message}`);
      // Optionally, send an error back to the client or disconnect
      client.emit('error', { message: 'Failed to load conversations on connect.' });
    }
  }

  // Handle client disconnection
  handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = (client as any).user as User; // Attempt to get user if still attached
    this.logger.log(`Client disconnected: ${client.id}`);

    if (user && this.userSocketMap.has(user.id)) {
      this.userSocketMap.get(user.id)?.delete(client.id);
      if (this.userSocketMap.get(user.id)?.size === 0) {
        this.userSocketMap.delete(user.id);
        this.logger.log(`User ${user.email} has no active sockets left.`);
      }
    }
  }

  @SubscribeMessage('createConversation')
  async handleCreateConversation(
    @MessageBody() data: CreateConversationDto,
    @GetUserWs() user: User,
  ) {
    this.logger.log(`User ${user.email} attempting to create conversation with participants: ${data.participantIds}`);
    try {
      // Ensure the creating user is part of the participants
      const allParticipantIds = Array.from(new Set([...data.participantIds, user.id]));
      const conversation = await this.chatService.createConversation(allParticipantIds, data.title);

      // Emit 'newConversation' to all participants' *personal rooms*
      // And make all their *currently connected sockets* join the new conversation room
      conversation.participants.forEach(participant => {
        // Emit to the participant's personal room (user.id room)
        this.server.to(participant.id).emit('newConversation', conversation);
        this.logger.log(`Emitted 'newConversation' to personal room ${participant.id}`);

        // Find all active sockets for this participant and make them join the conversation room
        const participantSocketIds = this.userSocketMap.get(participant.id);
        if (participantSocketIds) {
          participantSocketIds.forEach(socketId => {
            const participantSocket = this.server.sockets.sockets.get(socketId);
            if (participantSocket) {
              participantSocket.join(conversation.id);
              this.logger.log(`Socket ${socketId} for user ${participant.id} joined conversation room: ${conversation.id}`);
            }
          });
        }
      });

      this.logger.log(`Conversation created: ${conversation.id}`);
      return { event: 'conversationCreated', data: conversation };
    } catch (error) {
      this.logger.error(`Failed to create conversation: ${error.message}`, error.stack);
      // Return a structured error response
      return { event: 'error', data: { message: error.message, type: 'createConversationError' } };
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @GetUserWs() user: User,
  ) {
    this.logger.log(`User ${user.email} sending message to conversation ${data.conversationId}`);
    try {
      // First, verify the user is a participant of the conversation
      const isParticipant = await this.chatService.isUserInConversation(data.conversationId, user.id);
      if (!isParticipant) {
        throw new ForbiddenException('You are not a participant of this conversation.');
      }

      const message = await this.chatService.addMessage(data.conversationId, user.id, data.content);

      // Emit the message to all clients in the conversation room
      this.server.to(data.conversationId).emit('message', message);
      this.logger.log(`Message sent in conversation ${data.conversationId}`);
      return { event: 'messageSent', data: message };
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`, error.stack);
      return { event: 'error', data: { message: error.message, type: 'sendMessageError' } };
    }
  }

  @SubscribeMessage('getConversationMessages')
  async handleGetConversationMessages(
    @MessageBody('conversationId') conversationId: string,
    @GetUserWs() user: User,
  ) {
    this.logger.log(`User ${user.email} requesting messages for conversation ${conversationId}`);
    try {
      const conversation = await this.chatService.conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['participants'],
      });

      if (!conversation || !conversation.participants.some(p => p.id === user.id)) {
        throw new ForbiddenException('You are not a participant of this conversation.');
      }

      const messages = await this.chatService.getConversationMessages(conversationId);
      return { event: 'conversationMessages', data: messages };
    } catch (error) {
      this.logger.error(`Failed to get conversation messages: ${error.message}`, error.stack);
      return { event: 'error', data: { message: error.message, type: 'getMessagesError' } };
    }
  }

  @SubscribeMessage('getConversations')
  async handleGetConversations(@GetUserWs() user: User) {
    this.logger.log(`User ${user.email} requesting conversations`);
    try {
      const conversations = await this.chatService.getConversationsForUser(user.id);
      return { event: 'conversations', data: conversations };
    } catch (error) {
      this.logger.error(`Failed to get conversations: ${error.message}`, error.stack);
      return { event: 'error', data: { message: error.message, type: 'getConversationsError' } };
    }
  }
}
