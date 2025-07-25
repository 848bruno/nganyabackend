// src/chat/chat.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';


// ⭐ Import the new Message and MessageStatus entities ⭐
import { Message } from './entities/message.entity';
import { MessageStatus } from './entities/message-status.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ChatServices {
  private readonly logger = new Logger(ChatServices.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message) // ⭐ Use Message entity ⭐
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MessageStatus) // ⭐ Inject MessageStatus repository ⭐
    private messageStatusRepository: Repository<MessageStatus>,
  ) {}

  /**
   * Creates a new conversation with the given participants and an optional title.
   * Throws BadRequestException if less than 2 participants.
   * Throws NotFoundException if any participant is not found.
   * @param participantIds An array of user IDs to include in the conversation.
   * @param title An optional title for the conversation (e.g., for group chats).
   * @returns The newly created Conversation entity.
   */
  async createConversation(participantIds: string[], title?: string): Promise<Conversation> {
    if (participantIds.length < 2) {
      throw new BadRequestException('A conversation must have at least two participants.');
    }

    const participants = await this.userRepository.findBy({ id: In(participantIds) });
    if (participants.length !== participantIds.length) {
      throw new NotFoundException('One or more participants not found.');
    }

    // 1. Create and save the conversation entity without directly assigning participants yet.
    // This ensures the conversation record exists in the database first.
    const newConversation = this.conversationRepository.create({
      title: title || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      // participants will be set via the relation API or by assigning the array directly
      // If assigning array directly, TypeORM handles the join table insertion.
      // Let's try assigning directly first, as it's simpler and often works.
      participants: participants,
    });

    const savedConversation = await this.conversationRepository.save(newConversation);
    this.logger.log(`Conversation ${savedConversation.id} created.`);

    // ⭐ Initialize MessageStatus for all participants in this new conversation ⭐
    for (const participant of participants) {
      const messageStatus = this.messageStatusRepository.create({
        user: participant,
        conversation: savedConversation,
        lastReadMessage: null, // No messages yet, so nothing read
        unreadCount: 0,
      });
      await this.messageStatusRepository.save(messageStatus);
      this.logger.log(`MessageStatus created for user ${participant.id} in conversation ${savedConversation.id}`);
    }

    return savedConversation;
  }

  /**
   * Finds a conversation that includes exactly the given set of participants.
   * This is useful for preventing duplicate 1-on-1 or specific group chats.
   * @param participantIds An array of user IDs to match.
   * @returns The found Conversation entity or undefined if not found.
   */
  async findConversationByParticipants(participantIds: string[]): Promise<Conversation | undefined> {
    const sortedParticipantIds = [...participantIds].sort();
    const expectedCount = sortedParticipantIds.length;

    const possibleConversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('COUNT(cp.userId)')
          .from('conversation_participants', 'cp') // Correct join table name
          .where('cp.conversationId = conversation.id')
          .getQuery();

        return `(${subQuery}) = :expectedCount`;
      })
      .andWhere('participant.id IN (:...ids)', { ids: sortedParticipantIds })
      .setParameter('expectedCount', expectedCount) // Explicitly set parameter
      .getMany();

    // Filter in memory to ensure exact match of participants
    for (const conv of possibleConversations) {
      const convParticipantIds = conv.participants.map(p => p.id).sort();
      if (convParticipantIds.length === expectedCount &&
          convParticipantIds.every((id, index) => id === sortedParticipantIds[index])) {
        return conv;
      }
    }

    return undefined;
  }

  /**
   * Retrieves all conversations for a specific user, ordered by the last message time.
   * Includes participant details and message status for the user.
   * @param userId The ID of the user.
   * @returns An array of Conversation entities.
   */
  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      relations: ['participants', 'messageStatuses', 'messageStatuses.user'], // Load participants and message statuses
      where: {
        participants: {
          id: userId,
        },
      },
      order: {
        lastMessageAt: 'DESC', // Order by last message time
        createdAt: 'DESC', // Fallback order
      },
    });
  }

  /**
   * Checks if a user is a participant in a given conversation.
   * @param conversationId The ID of the conversation.
   * @param userId The ID of the user.
   * @returns True if the user is a participant, false otherwise.
   */
  async isUserInConversation(conversationId: string, userId: string): Promise<boolean> {
    const count = await this.conversationRepository.count({
      where: {
        id: conversationId,
        participants: {
          id: userId,
        },
      },
    });
    return count > 0;
  }

  /**
   * Retrieves all messages for a specific conversation, ordered chronologically.
   * Includes sender details.
   * @param conversationId The ID of the conversation.
   * @returns An array of Message entities.
   */
  async getMessagesForConversation(conversationId: string): Promise<Message[]> { // ⭐ Return type changed to Message[] ⭐
    return this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender'],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Creates a new chat message within a conversation.
   * Updates the conversation's last message details and unread counts.
   * Throws BadRequestException if sender is not a participant.
   * Throws NotFoundException if conversation is not found.
   * @param conversationId The ID of the conversation.
   * @param senderId The ID of the user sending the message.
   * @param content The message content.
   * @returns The newly created Message entity.
   */
  async createMessage(conversationId: string, senderId: string, content: string): Promise<Message> { // ⭐ Return type changed to Message ⭐
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    const sender = conversation.participants.find(p => p.id === senderId);
    if (!sender) {
      throw new ForbiddenException('Sender is not a participant of this conversation.');
    }

    const newMessage = this.messageRepository.create({
      conversation,
      sender,
      content,
      createdAt: new Date(),
    });

    const savedMessage = await this.messageRepository.save(newMessage);
    this.logger.log(`Message ${savedMessage.id} created in conversation ${conversationId}.`);

    // Update unread counts for all participants except the sender
    for (const participant of conversation.participants) {
      const messageStatus = await this.messageStatusRepository.findOne({
        where: { user: { id: participant.id }, conversation: { id: conversation.id } },
      });

      if (messageStatus) {
        if (participant.id !== senderId) { // Increment for others
          messageStatus.unreadCount = (messageStatus.unreadCount || 0) + 1;
          await this.messageStatusRepository.save(messageStatus);
          this.logger.log(`Unread count for user ${participant.id} in conversation ${conversation.id} incremented.`);
        }
      } else {
        this.logger.warn(`MessageStatus not found for participant ${participant.id} in conversation ${conversation.id}. Creating one.`);
        // Fallback: Create if not found (should ideally be created with conversation)
        const newStatus = this.messageStatusRepository.create({
          user: participant,
          conversation: conversation,
          lastReadMessage: null,
          unreadCount: (participant.id !== senderId) ? 1 : 0,
        });
        await this.messageStatusRepository.save(newStatus);
      }
    }

    // Update last message in conversation
    await this.updateConversationLastMessage(conversation.id, content, savedMessage.createdAt);

    return savedMessage;
  }

  /**
   * Updates the last message text and timestamp for a given conversation.
   * @param conversationId The ID of the conversation to update.
   * @param lastMessageText The content of the last message.
   * @param lastMessageAt The timestamp of the last message.
   */
  async updateConversationLastMessage(
    conversationId: string,
    lastMessageText: string,
    lastMessageAt: Date,
  ): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      lastMessageText,
      lastMessageAt,
      updatedAt: new Date(),
    });
    this.logger.log(`Conversation ${conversationId} last message updated.`);
  }

  /**
   * Marks messages in a conversation as read for a specific user.
   * Resets unread count and updates last read message.
   * @param conversationId The ID of the conversation.
   * @param userId The ID of the user marking messages as read.
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const messageStatus = await this.messageStatusRepository.findOne({
      where: { user: { id: userId }, conversation: { id: conversationId } },
      relations: ['user', 'conversation'], // Ensure relations are loaded if needed for checks
    });

    if (!messageStatus) {
      throw new NotFoundException(`MessageStatus not found for user ${userId} in conversation ${conversationId}`);
    }

    // Get the latest message in the conversation to set as lastReadMessage
    const latestMessage = await this.messageRepository.findOne({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'DESC' },
    });

    if (latestMessage) {
      messageStatus.lastReadMessage = latestMessage;
      messageStatus.unreadCount = 0; // Reset unread count
      messageStatus.updatedAt = new Date(); // Update timestamp
      await this.messageStatusRepository.save(messageStatus);
      this.logger.log(`Messages marked as read for user ${userId} in conversation ${conversationId}. Unread count reset.`);
    } else {
      // If no messages exist, just reset unread count
      messageStatus.lastReadMessage = null;
      messageStatus.unreadCount = 0;
      messageStatus.updatedAt = new Date();
      await this.messageStatusRepository.save(messageStatus);
      this.logger.log(`No messages found in conversation ${conversationId}. Unread count reset for user ${userId}.`);
    }
  }
}
