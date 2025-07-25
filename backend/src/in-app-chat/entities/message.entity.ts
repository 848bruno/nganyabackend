// src/chat/entities/message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Adjust path if necessary
import { Conversation } from '../../conversation/entities/conversation.entity'; // Adjust path if necessary

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' }) // Eager load sender, delete messages if sender is deleted
  @JoinColumn({ name: 'senderId' }) // Specify the foreign key column name
  sender: User;

  @Column({ type: 'uuid' }) // Store the sender's ID directly
  senderId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' }) // Delete messages if conversation is deleted
  @JoinColumn({ name: 'conversationId' }) // Specify the foreign key column name
  conversation: Conversation;

  @Column({ type: 'uuid' }) // Store the conversation's ID directly
  conversationId: string;

  @CreateDateColumn()
  createdAt: Date;

  // You can add a status column if needed (e.g., 'sent', 'delivered', 'read')
  // @Column({ type: 'enum', enum: ['sent', 'delivered', 'read'], default: 'sent' })
  // status: 'sent' | 'delivered' | 'read';
}
