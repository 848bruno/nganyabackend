// src/chat/entities/message-status.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, UpdateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Adjust path if necessary
import { Conversation } from '../../conversation/entities/conversation.entity'; // Adjust path if necessary
import { Message } from './message.entity'; // Import the new Message entity

@Entity('message_statuses')
@Unique(['user', 'conversation']) // Ensure a user has only one status entry per conversation
export class MessageStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // If user is deleted, their message status entries are deleted
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' }) // If conversation is deleted, its message status entries are deleted
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: 'uuid' })
  conversationId: string;

  // This tracks the last message that this specific user has read in this conversation
  @OneToOne(() => Message, { nullable: true, onDelete: 'SET NULL' }) // If the last read message is deleted, set this to null
  @JoinColumn({ name: 'lastReadMessageId' })
  lastReadMessage: Message | null;

  @Column({ type: 'uuid', nullable: true })
  lastReadMessageId: string | null;

  @Column({ type: 'int', default: 0 })
  unreadCount: number;

  @UpdateDateColumn() // To track when the status was last updated (e.g., when messages were read)
  updatedAt: Date;
}
