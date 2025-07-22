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

  async createConversation(participantIds: string[], title?: string): Promise<Conversation> {
    if (participantIds.length < 2) {
      throw new BadRequestException('A conversation must have at least two participants.');
    }

    const participants = await this.userRepository.findBy({ id: In(participantIds) });
    if (participants.length !== participantIds.length) {
      throw new NotFoundException('One or more participants not found.');
    }

    const conversation = this.conversationRepository.create({
      participants,
      title: title || null,
    });

    return this.conversationRepository.save(conversation);
  }

  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: {
        participants: {
          id: userId,
        },
      },
      relations: ['participants', 'messages'], // Load participants and messages
      order: { lastMessageAt: 'DESC' }, // Order by last message for chat list
    });
  }

  // ⭐ NEW PUBLIC METHOD: Get a conversation by ID, ensuring the user is a participant ⭐
  async getConversationByIdAndUser(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: {
        id: conversationId,
        participants: {
          id: userId,
        },
      },
      relations: ['participants'], // Load participants to check if user is part of it
    });

    if (!conversation) {
      // Differentiate between not found and not authorized for better error messages
      const exists = await this.conversationRepository.count({ where: { id: conversationId } });
      if (exists) {
        throw new ForbiddenException('You are not a participant of this conversation.');
      }
      throw new NotFoundException('Conversation not found.');
    }
    return conversation;
  }

  // ⭐ NEW PUBLIC METHOD: Check if a user is a participant in a given conversation ⭐
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

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.messageRepository.find({
      where: { conversationId },
      relations: ['sender'], // Load sender details
      order: { createdAt: 'ASC' }, // Order messages chronologically
    });
  }

  async addMessage(conversationId: string, senderId: string, content: string): Promise<ChatMessage> {
    // Re-use isUserInConversation to confirm sender is a participant
    const isParticipant = await this.isUserInConversation(conversationId, senderId);
    if (!isParticipant) {
      throw new BadRequestException('Sender is not a participant of this conversation.');
    }

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      // You might not need to load participants again if isUserInConversation confirms existence
      // but if you need the full conversation object, keep this.
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.'); // Should ideally be caught by isUserInConversation too
    }

    const sender = conversation.participants.find(p => p.id === senderId);
    // This check is now redundant if isUserInConversation passes, but harmless
    if (!sender) {
        throw new BadRequestException('Sender is not a participant of this conversation.');
    }

    const message = this.messageRepository.create({
      conversationId,
      senderId,
      content,
      sender, // Assign the sender object
      conversation, // Assign the conversation object
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update last message in conversation
    conversation.lastMessageText = content;
    conversation.lastMessageAt = savedMessage.createdAt;
    await this.conversationRepository.save(conversation);

    return savedMessage;
  }
}
