// src/seed/seed.controller.ts
import { Controller, Post } from '@nestjs/common';
import { UserSeedService } from './seed.service';
import { Public } from 'src/auth/decorators';

@Controller('seed-users')
export class SeedController {
  constructor(private readonly seedService: UserSeedService) {}

 @Public()
  @Post()
  async seedUsers() {
    return await this.seedService.seedUsers();
  }
}
