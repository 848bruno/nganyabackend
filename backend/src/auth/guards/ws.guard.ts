// src/auth/guards/ws.guard.ts (MODIFIED getRequest method)
import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class WsGuard extends AuthGuard('jwt-at') implements CanActivate {
  private readonly logger = new Logger(WsGuard.name);

  constructor() {
    super();
  }

  // ⭐ MODIFIED getRequest method ⭐
  getRequest(context: ExecutionContext) {
    const client: Socket = context.switchToWs().getClient<Socket>();
    // Manually attach the token from handshake.auth to a place Passport can find it,
    // e.g., in a custom header-like property for the 'request' object.
    // Passport-JWT's ExtractJwt.fromAuthHeaderAsBearerToken() will look for 'authorization' header.
    // Let's mimic that or use a custom extractor that explicitly looks at client.handshake.auth.
    // For now, let's ensure the `AtStrategy`'s custom extractor is correctly typed and positioned.
    // The issue is more likely that ExtractJwt.fromExtractors needs an array of functions that
    // EACH know how to get the 'request' object (which is the Socket in this context).
    return client; // Keep this as Socket; the issue is in the AtStrategy's extractor.
  }

  // ... (rest of WsGuard remains the same)

  // If the issue persists, you might need to manually set `client.request.headers.authorization`
  // before calling `super.canActivate(context)` in `WsGuard`.
  // For example:
  /*
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const authToken = client.handshake.auth.token;

    if (authToken) {
      // Create a dummy 'request' object structure that Passport expects
      // and attach the token. This might be an alternative if direct socket access
      // in the strategy's extractor doesn't work reliably with ExtractJwt.fromExtractors.
      // However, the current AtStrategy extractor *should* work if the context is passed as Socket.
      (client as any).request = { headers: { authorization: `Bearer ${authToken}` } };
    }
    return (await super.canActivate(context)) as boolean;
  }
  */
}