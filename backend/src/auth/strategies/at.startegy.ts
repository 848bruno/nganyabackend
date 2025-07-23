// src/auth/strategy/at.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { Socket } from 'socket.io';
import { UserService } from 'src/users/users.service';

type JWTPayload = {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
};

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt-at') {
  private readonly logger = new Logger(AtStrategy.name);

  constructor(
    private readonly configServices: ConfigService,
    private readonly usersService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
          if (token) {
            this.logger.log(`AtStrategy Extractor (HTTP): Found Bearer token. Presence: ${token ? 'PRESENT' : 'MISSING'}`);
          }
          return token;
        },
        (client: any) => {
          this.logger.log(`AtStrategy Extractor (WS): Called. Type of client object: ${typeof client}`);
          if (client && typeof client === 'object' && 'handshake' in client && 'auth' in (client as Socket).handshake) {
            const token = (client as Socket).handshake.auth.token;
            this.logger.log(`AtStrategy Extractor (WS): Found handshake.auth.token. Presence: ${token ? 'PRESENT' : 'MISSING'}`);
            return token as string;
          }
          this.logger.warn('AtStrategy Extractor (WS): Token not found in WebSocket handshake.auth.');
          return null;
        },
      ]),
      secretOrKey: configServices.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
      ignoreExpiration: false, // Keep this as false for production
    });
    this.logger.log(`AtStrategy initialized. JWT_ACCESS_TOKEN_SECRET loaded.`);
  }

  async validate(payload: JWTPayload) {
    this.logger.log('AtStrategy: Validating JWT payload:', payload);
    // ⭐ REMOVED: Manual expiration check using this.options.ignoreExpiration ⭐
    // Passport-JWT handles ignoreExpiration based on the option passed to super()

    try {
      const user = await this.usersService.findOne(payload.sub); 

      if (!user) {
        this.logger.warn(`AtStrategy: User with ID ${payload.sub} not found in database.`);
        throw new UnauthorizedException('User not found or token invalid.');
      }
      this.logger.log(`AtStrategy: User ${user.email} (ID: ${user.id}) validated successfully.`);
      return user;
    } catch (error) {
      this.logger.error(`AtStrategy: Error during validation for payload ${payload.sub}: ${error.message}`, error.stack);
      throw error;
    }
  }}