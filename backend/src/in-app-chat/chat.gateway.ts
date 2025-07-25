// src/chat/chat.gateway.ts
import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, ForbiddenException } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { ChatServices } from './in-app-chat.service';
import { GetUserWs } from 'src/auth/decorators/get-user-ws.decorator';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
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
    const user = (client as any).user as User;
    this.logger.log(`Client connected: ${client.id} (User: ${user.email}, ID: ${user.id})`);

    if (!this.userSocketMap.has(user.id)) {
      this.userSocketMap.set(user.id, new Set());
    }
    this.userSocketMap.get(user.id)?.add(client.id);

    client.join(user.id);
    this.logger.log(`User ${user.email} joined personal room: ${user.id}`);

    try {
      // It's generally better to send initial data via a specific event after connection,
      // rather than relying on an implicit fetch. However, for now, we'll keep the join.
      const conversations = await this.chatService.getConversationsForUser(user.id);
      conversations.forEach(conv => {
        client.join(conv.id);
        this.logger.log(`User ${user.email} joined conversation room: ${conv.id}`);
      });
      // You should emit the conversations back here, or via the @SubscribeMessage('getConversations') handler
      client.emit('conversations', { event: 'conversations', data: conversations });
      this.logger.log(`Emitted 'conversations' to client ${client.id} on connect.`);

    } catch (error) {
      this.logger.error(`Failed to join user ${user.email} to conversations on connect: ${error.message}`);
      client.emit('error', { message: 'Failed to load conversations on connect.' });
    }
  }

  // Add this handler for when the frontend explicitly requests conversations
  @SubscribeMessage('getConversations')
  async handleGetConversations(@ConnectedSocket() client: Socket, @GetUserWs() user: User) {
    this.logger.log(`Received 'getConversations' from client: ${client.id} (User: ${user.id})`);
    try {
      const conversations = await this.chatService.getConversationsForUser(user.id);
      // Emit to the specific client that requested
      client.emit('conversations', { event: 'conversations', data: conversations });
      this.logger.log(`Emitted 'conversations' to client ${client.id} after 'getConversations' request.`);
    } catch (error) {
      this.logger.error(`Failed to get conversations for user ${user.id}: ${error.message}`);
      client.emit('error', { message: 'Failed to load conversations.' });
    }
  }

  // Add this handler for creating new conversations
  @SubscribeMessage('createConversation')
  async handleCreateConversation(
    @ConnectedSocket() client: Socket,
    @GetUserWs() user: User,
    @MessageBody() payload: { participantIds: string[]; title?: string }
  ) {
    this.logger.log(`Received 'createConversation' from client: ${client.id} (User: ${user.id}) with participants: ${payload.participantIds} and title: ${payload.title}`);
    try {
      // Ensure the current user is always a participant
      const allParticipantIds = [...new Set([...payload.participantIds, user.id])];

      // Check if a conversation with these exact participants already exists
      let existingConversation = await this.chatService.findConversationByParticipants(allParticipantIds);

      if (!existingConversation) {
        // If not, create a new one
        existingConversation = await this.chatService.createConversation(allParticipantIds, payload.title);
        this.logger.log(`New conversation created: ${existingConversation.id}`);

        // Join the creator to the new conversation room
        client.join(existingConversation.id);
        this.logger.log(`User ${user.email} joined new conversation room: ${existingConversation.id}`);

        // Emit 'newConversation' to all participants so their UIs update
        for (const participantId of allParticipantIds) {
          this.server.to(participantId).emit('newConversation', existingConversation);
          this.logger.log(`Emitted 'newConversation' to participant room: ${participantId}`);
        }
      } else {
        this.logger.log(`Conversation already exists for participants, returning existing: ${existingConversation.id}`);
        // If conversation already exists, just return it to the creator
        // The frontend expects `newConversation` event to update, so send that.
        // It should also select this conversation.
        client.emit('newConversation', existingConversation);
      }

      // If needed, you can also send a success message or the full conversation details back to the creator
      // client.emit('conversationCreatedSuccess', existingConversation); // Or some other confirmation event
    } catch (error) {
      this.logger.error(`Failed to create conversation for user ${user.id}: ${error.message}`);
      client.emit('error', { message: 'Failed to create conversation.' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @GetUserWs() user: User,
    @MessageBody() payload: { conversationId: string; content: string; tempMessageId?: string }
  ) {
    this.logger.log(`Received 'sendMessage' from client ${client.id} for conversation ${payload.conversationId}. Content: ${payload.content.substring(0, 50)}...`);
    try {
      const message = await this.chatService.createMessage(
        payload.conversationId,
        user.id,
        payload.content,
      );

      // Optionally, you can add the tempMessageId to the message object here
      // if you want the client to use it for matching.
      const messageToSend = { ...message, tempMessageId: payload.tempMessageId };

      // Emit to all participants in the conversation room
      this.server.to(payload.conversationId).emit('message', messageToSend);
      this.logger.log(`Emitted 'message' to conversation room ${payload.conversationId}. Message ID: ${message.id}`);

      // Update last message in conversation
      await this.chatService.updateConversationLastMessage(payload.conversationId, message.content, message.createdAt);
      this.logger.log(`Updated last message for conversation: ${payload.conversationId}`);

    } catch (error) {
      this.logger.error(`Failed to send message for user ${user.id} in conversation ${payload.conversationId}: ${error.message}`);
      client.emit('error', { message: 'Failed to send message.' });
    }
  }

  @SubscribeMessage('getConversationMessages')
  async handleGetConversationMessages(
    @ConnectedSocket() client: Socket,
    @GetUserWs() user: User,
    @MessageBody() payload: { conversationId: string }
  ) {
    this.logger.log(`Received 'getConversationMessages' from client ${client.id} for conversation: ${payload.conversationId}`);
    try {
      // Ensure the user is a participant of this conversation
      const isParticipant = await this.chatService.isUserInConversation(payload.conversationId, user.id);
      if (!isParticipant) {
        throw new ForbiddenException('You are not a participant of this conversation.');
      }

      const messages = await this.chatService.getMessagesForConversation(payload.conversationId);
      // Emit to the specific client that requested
      client.emit('conversationMessages', { event: 'conversationMessages', data: messages });
      this.logger.log(`Emitted 'conversationMessages' to client ${client.id} for conversation ${payload.conversationId}.`);

      // Mark messages as read for the requesting user
      await this.chatService.markMessagesAsRead(payload.conversationId, user.id);
      this.logger.log(`Marked messages as read for user ${user.id} in conversation ${payload.conversationId}`);
      // Notify other participants in the conversation that messages were read by this user
      client.to(payload.conversationId).emit('messagesRead', { conversationId: payload.conversationId, userId: user.id });

    } catch (error) {
      this.logger.error(`Failed to get messages for conversation ${payload.conversationId} for user ${user.id}: ${error.message}`);
      client.emit('error', { message: 'Failed to load messages.' });
    }
  }

  @SubscribeMessage('markMessagesAsRead')
  async handleMarkMessagesAsRead(
    @ConnectedSocket() client: Socket,
    @GetUserWs() user: User,
    @MessageBody() payload: { conversationId: string }
  ) {
    this.logger.log(`Received 'markMessagesAsRead' from client ${client.id} for conversation: ${payload.conversationId} by user: ${user.id}`);
    try {
      const isParticipant = await this.chatService.isUserInConversation(payload.conversationId, user.id);
      if (!isParticipant) {
        throw new ForbiddenException('You are not a participant of this conversation.');
      }

      await this.chatService.markMessagesAsRead(payload.conversationId, user.id);
      this.logger.log(`Successfully marked messages as read for user ${user.id} in conversation ${payload.conversationId}`);

      // Emit to others in the conversation room (excluding sender) that messages were read
      client.to(payload.conversationId).emit('messagesRead', { conversationId: payload.conversationId, userId: user.id });
      this.logger.log(`Emitted 'messagesRead' to conversation room ${payload.conversationId} (excluding sender).`);
    } catch (error) {
      this.logger.error(`Failed to mark messages as read for conversation ${payload.conversationId} for user ${user.id}: ${error.message}`);
      client.emit('error', { message: 'Failed to mark messages as read.' });
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = (client as any).user as User;
    if (user) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${user.email}, ID: ${user.id})`);
      this.userSocketMap.get(user.id)?.delete(client.id);
      if (this.userSocketMap.get(user.id)?.size === 0) {
        this.userSocketMap.delete(user.id);
      }
    } else {
      this.logger.log(`Client disconnected: ${client.id} (Unauthorized or token expired)`);
    }
  }
}