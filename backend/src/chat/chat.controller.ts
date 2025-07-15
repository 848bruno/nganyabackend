import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators';

@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Post('message')

   @ApiBody({
      schema: {
        example: {
          message: 'Hello, how can I assist you?'
        }
      }
    })
  async sendMessage(@Body('message') message: string): Promise<{ response: string }> {
    const response = await this.chatService.getBotResponse(message);
    return { response };
  }
}