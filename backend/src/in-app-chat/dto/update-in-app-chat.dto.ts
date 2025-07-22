import { PartialType } from '@nestjs/mapped-types';
import { CreateInAppChatDto } from './create-in-app-chat.dto';

export class UpdateInAppChatDto extends PartialType(CreateInAppChatDto) {}
