import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { ChatMessage } from './entities/in-app-chat.entity';
import { User } from 'src/users/entities/user.entity';

import { ChatServices } from './in-app-chat.service';

import { WsGuard } from 'src/auth/guards/ws.guard';
import { UsersModule } from 'src/users/users.module';
import { ChatGateway } from './chat.gateway';
import { Message } from './entities/message.entity';
import { MessageStatus } from './entities/message-status.entity';


@Module({
  imports: [UsersModule,
    TypeOrmModule.forFeature([Conversation, ChatMessage, User, Message, 
      MessageStatus, ]),
  ],
  providers: [ChatServices, WsGuard, ChatGateway],
  exports: [ChatServices, WsGuard, ChatGateway],
})

export class InAppChatModule {}
