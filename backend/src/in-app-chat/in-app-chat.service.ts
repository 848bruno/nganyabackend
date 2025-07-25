// src/chat/chat.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // Import 'In' for array queries

import { User } from 'src/users/entities/user.entity';
import { ChatMessage } from './entities/in-app-chat.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';

@Injectable()
export class ChatServices {
  constructor(
    @InjectRepository(Conversation)
    public conversationRepository: Repository<Conversation>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    });

    const savedConversation = await this.conversationRepository.save(newConversation);

    // 2. Now, add the participants to the ManyToMany relationship using the relation API.
    // This explicitly handles the insertion into the 'conversation_participants' join table.
    try {
      await this.conversationRepository
        .createQueryBuilder()
        .relation(Conversation, 'participants')
        .of(savedConversation) // Reference the newly saved conversation
        .add(participants.map(p => p.id)); // Add participants by their IDs
      
      // If adding by IDs works, it's often more efficient and less prone to circular dependency issues.

    } catch (relationError) {
      // If adding participants fails, consider rolling back the conversation creation
      // or logging a more specific error.
      console.error(`Error adding participants to conversation ${savedConversation.id}:`, relationError);
      // Optionally delete the partially created conversation if this is a critical failure
      // await this.conversationRepository.delete(savedConversation.id);
      throw new BadRequestException('Failed to establish conversation participants relationship.');
    }

    // 3. Fetch the conversation again with participants to ensure the returned object is complete
    const conversationWithParticipants = await this.conversationRepository.findOne({
      where: { id: savedConversation.id },
      relations: ['participants'],
    });

    if (!conversationWithParticipants) {
        throw new NotFoundException('Failed to retrieve conversation after creation and participant assignment.');
    }

    return conversationWithParticipants;
  }

  /**
   * Finds a conversation that includes exactly the given set of participants.
   * This is useful for preventing duplicate 1-on-1 or specific group chats.
   * @param participantIds An array of user IDs to match.
   * @returns The found Conversation entity or undefined if not found.
   */
  async findConversationByParticipants(participantIds: string[]): Promise<Conversation | undefined> {
    // Sort participant IDs to ensure consistent matching regardless of order
    const sortedParticipantIds = [...participantIds].sort();

    // Find conversations that have the same number of participants
    const possibleConversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .where((qb) => {
        // Subquery to count participants for each conversation
        const subQuery = qb
          .subQuery()
          .select('COUNT(cp.userId)')
          .from('conversation_participants_user', 'cp')
          .where('cp.conversationId = conversation.id')
          .getQuery();
        return `(${subQuery}) = :count`;
      })
      .andWhere('participant.id IN (:...ids)', { ids: sortedParticipantIds })
      .getMany();

    // Filter to find the exact match
    for (const conv of possibleConversations) {
      const convParticipantIds = conv.participants.map(p => p.id).sort();
      if (convParticipantIds.length === sortedParticipantIds.length &&
          convParticipantIds.every((id, index) => id === sortedParticipantIds[index])) {
        return conv;
      }
    }

    return undefined;
  }

  /**
   * Retrieves all conversations for a specific user, ordered by the last message time.
   * Includes participant details.
   * @param userId The ID of the user.
   * @returns An array of Conversation entities.
   */
  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: {
        participants: {
          id: userId,
        },
      },
      relations: ['participants'], // Load participants for display
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' }, // Order by last message for chat list, fallback to creation date
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
   * @returns An array of ChatMessage entities.
   */
  async getMessagesForConversation(conversationId: string): Promise<ChatMessage[]> {
    return this.messageRepository.find({
      where: { conversationId },
      relations: ['sender'], // Load sender details
      order: { createdAt: 'ASC' }, // Order messages chronologically
    });
  }

  /**
   * Creates a new chat message within a conversation.
   * Throws BadRequestException if sender is not a participant.
   * Throws NotFoundException if conversation is not found.
   * @param conversationId The ID of the conversation.
   * @param senderId The ID of the user sending the message.
   * @param content The message content.
   * @returns The newly created ChatMessage entity.
   */
  async createMessage(conversationId: string, senderId: string, content: string): Promise<ChatMessage> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'], // Load participants to verify sender
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    const isParticipant = conversation.participants.some(p => p.id === senderId);
    if (!isParticipant) {
      throw new BadRequestException('Sender is not a participant of this conversation.');
    }

    const sender = conversation.participants.find(p => p.id === senderId);
    if (!sender) {
      throw new NotFoundException('Sender not found in conversation participants.');
    }

    const message = this.messageRepository.create({
      conversation,
      sender,
      content,
      createdAt: new Date(),
    });

    const savedMessage = await this.messageRepository.save(message);

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
  }

  /**
   * Marks messages in a conversation as read for a specific user.
   * Note: This implementation is a placeholder. A robust read receipt system
   * would typically involve a separate entity (e.g., UserConversationStatus)
   * to track the last read message/timestamp per user per conversation.
   * For now, it primarily serves as a backend check and a trigger for frontend updates.
   * @param conversationId The ID of the conversation.
   * @param userId The ID of the user marking messages as read.
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    // First, ensure the user is a participant of the conversation
    const isParticipant = await this.isUserInConversation(conversationId, userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation.');
    }

    // ⭐ Placeholder for actual database update for read receipts ⭐
    // In a real application, you would update a 'lastReadMessageId' or 'lastReadAt'
    // for this specific user within this conversation.
    // Example (conceptual, requires schema modification):
    /*
    await this.conversationRepository.createQueryBuilder()
      .relation(Conversation, 'participants')
      .of(conversationId)
      .set({ lastReadMessageId: latestMessageId, lastReadAt: new Date() }, { userId: userId });
    */

    // For now, this method primarily acts as a validation and a signal to the gateway
    // that messages should be considered read for this user.
    // The frontend handles the unreadCount update locally based on this trigger.
    console.log(`[ChatServices] User ${userId} marked messages in conversation ${conversationId} as read (backend logic placeholder).`);
  }
}
