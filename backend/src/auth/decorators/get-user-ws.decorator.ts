// src/auth/decorators/get-user-ws.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { User } from 'src/users/entities/user.entity'; // Import your User entity

export const GetUserWs = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const client = ctx.switchToWs().getClient<Socket>();
    // The WsGuard attaches the user object to the socket
    return (client as any).user;
  },
);
