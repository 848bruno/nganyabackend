import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/login.dto';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { AtGuard, RtGuard } from './guards';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

export interface RequestWithUser extends Request {
  user: {
    sub: string; // UUID
    email: string;
    refreshToken: string;
  };
}

@ApiBearerAuth()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // /auth/signin
  @Public()
@Post('signin')
@HttpCode(200)
async signIn(@Body() dto: CreateAuthDto) {
  return await this.authService.signIn(dto);
}

  // /auth/signout/:id
  @UseGuards(AtGuard)
  @Get('signout/:id')
  signOut(@Param('id', ParseUUIDPipe) id: string) {
    return this.authService.signOut(id);
  }

  // /auth/refresh?id=<uuid>
  @Public()
  @UseGuards(RtGuard)
  @Get('refresh')
  refreshTokens(
    @Query('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    if (user.sub !== id) {
      throw new UnauthorizedException('Invalid user');
    }
    return this.authService.refreshTokens(id, user.refreshToken);
  }
}
