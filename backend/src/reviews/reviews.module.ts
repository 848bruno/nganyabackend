import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { Review } from './entities/review.entity';

import { User } from 'src/users/entities/user.entity';
import { Ride } from 'src/rides/entities/ride.entity';
import { ReviewController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Review,  User, Ride])],
  controllers: [ReviewController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewModule {}