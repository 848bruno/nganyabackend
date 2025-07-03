// src/seed/seed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';


import { User } from 'src/users/entities/user.entity';
import { SeedController } from './seed.controller';
import { UserSeedService } from './seed.service';

// Import your entities


@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [SeedController],
  providers: [UserSeedService],
})
export class SeedModule {}
