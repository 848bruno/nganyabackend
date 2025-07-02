import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto, ReviewResponseDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Ride } from 'src/rides/entities/ride.entity';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from 'src/users/entities/user.entity';
import { Driver } from 'src/drivers/entities/driver.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<ReviewResponseDto> {
    const driver = await this.driverRepository.findOneBy({ id: createReviewDto.driverId });
    if (!driver) {
      throw new BadRequestException('Driver not found');
    }
    const user = await this.userRepository.findOneBy({ id: createReviewDto.userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const ride = await this.rideRepository.findOneBy({ id: createReviewDto.rideId });
    if (!ride) {
      throw new BadRequestException('Ride not found');
    }
    const review = this.reviewRepository.create(createReviewDto);
    await this.reviewRepository.save(review);
    return review;
  }

  async findAll(): Promise<ReviewResponseDto[]> {
    return this.reviewRepository.find();
  }

  async findByDriver(driverId: string): Promise<ReviewResponseDto[]> {
    return this.reviewRepository.find({ where: { driverId } });
  }

  async findByUser(userId: string): Promise<ReviewResponseDto[]> {
    return this.reviewRepository.find({ where: { userId } });
  }

  async findOne(id: string): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findOneBy({ id });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<ReviewResponseDto> {
    const review = await this.findOne(id);
    Object.assign(review, updateReviewDto);
    await this.reviewRepository.save(review);
    return review;
  }

  async remove(id: string): Promise<void> {
    const review = await this.reviewRepository.findOneBy({ id });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    await this.reviewRepository.remove(review);
  }
}