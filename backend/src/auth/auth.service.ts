import { Injectable, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common'; // Import Logger and UnauthorizedException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as Bcrypt from 'bcrypt';

import { CreateAuthDto } from './dto/login.dto';
import { User, UserRole } from 'src/users/entities/user.entity';

import { ConfigService } from '@nestjs/config';

type JWTPayload = {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name); // Add Logger

  constructor(
    @InjectRepository(User)
    private readonly profileRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Hash data using bcrypt
  private async hashData(data: string): Promise<string> {
    const salt = await Bcrypt.genSalt(10);
    return await Bcrypt.hash(data, salt);
  }

  // Save hashed refresh token in DB
  private async saveRefreshToken(id: string, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.profileRepository.update(id, { hashedRefreshToken });
  }

  // Generate access and refresh tokens with role
  private async getTokens(id: string, email: string, role: UserRole) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: id, email, role },
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
          expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
        },
      ),
      this.jwtService.signAsync(
        { sub: id, email, role },
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  // Sign in user
  async signIn(createAuthDto: CreateAuthDto) {
    const foundUser = await this.profileRepository.findOne({
      where: { email: createAuthDto.email },
      select: ['id', 'email', 'password', 'role', 'name', 'phone', 'createdAt', 'updatedAt'],
    });

    if (!foundUser) {
      throw new NotFoundException(`User with email ${createAuthDto.email} not found`);
    }

    const passwordMatches = await Bcrypt.compare(createAuthDto.password, foundUser.password);
    if (!passwordMatches) {
      throw new NotFoundException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.getTokens(
      foundUser.id,
      foundUser.email,
      foundUser.role as UserRole,
    );

    await this.saveRefreshToken(foundUser.id, refreshToken);

    return { accessToken, refreshToken,   user: {
      id: foundUser.id,
      email: foundUser.email,
      role: foundUser.role,
      name: foundUser.name || foundUser.email?.split("@")[0] || "User",
      phone: foundUser.phone || "",
      createdAt: foundUser.createdAt,
      updatedAt: foundUser.updatedAt,
    },
    };
  }

  // Sign out user
  async signOut(id: string) {
    const res = await this.profileRepository.update(id, { hashedRefreshToken: null });

    if (res.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return { message: `User with ID ${id} signed out successfully` };
  }

  // Refresh access and refresh tokens
  async refreshTokens(id: string, refreshToken: string) {
    const foundUser = await this.profileRepository.findOne({ where: { id } });

    if (!foundUser || !foundUser.hashedRefreshToken) {
      throw new NotFoundException('Invalid or expired refresh token');
    }

    const refreshTokenMatches = await Bcrypt.compare(refreshToken, foundUser.hashedRefreshToken);
    if (!refreshTokenMatches) {
      throw new NotFoundException('Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.getTokens(
      foundUser.id,
      foundUser.email,
      foundUser.role as UserRole,
    );

    await this.saveRefreshToken(foundUser.id, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  // ⭐ NEW METHOD: Verify WebSocket Token ⭐
  async verifyWsToken(token: string): Promise<User> {
    this.logger.log(`AuthService: Verifying WebSocket token: ${token ? 'PRESENT' : 'MISSING'}`);
    try {
      // Verify the token using the access token secret
      const payload: JWTPayload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
      });

      this.logger.log(`AuthService: WebSocket token payload verified: ${JSON.stringify(payload)}`);

      // Check if token is expired (jwtService.verify handles this if ignoreExpiration is false)
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp < currentTime) {
        this.logger.warn(`AuthService: WebSocket token for user ${payload.email} is EXPIRED.`);
        throw new UnauthorizedException('Token expired.');
      }

      // Find the user in the database
      const user = await this.profileRepository.findOne({ where: { id: payload.sub } });

      if (!user) {
        this.logger.warn(`AuthService: User with ID ${payload.sub} not found for WebSocket token.`);
        throw new UnauthorizedException('User not found or token invalid.');
      }
      this.logger.log(`AuthService: User ${user.email} (ID: ${user.id}) successfully verified for WebSocket.`);
      return user;
    } catch (error) {
      this.logger.error(`AuthService: WebSocket token verification failed: ${error.message}`, error.stack);
      // Re-throw as UnauthorizedException for consistency
      throw new UnauthorizedException(`WebSocket authentication failed: ${error.message}`);
    }
  }
}
