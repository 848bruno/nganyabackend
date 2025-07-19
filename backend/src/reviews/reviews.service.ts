import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto, ReviewResponseDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Ride } from 'src/rides/entities/ride.entity';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { InjectRepository } from '@nestjs/typeorm';

import { User, UserRole } from 'src/users/entities/user.entity'; // Corrected: Import User and UserRole

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
  ) {}

  private toReviewResponseDto(review: Review): ReviewResponseDto {
    const { id, driverId, driver, userId, user, rating, comment, rideId, ride, createdAt, updatedAt } = review;
    return {
      id,
      driverId,
      driver,
      userId,
      user,
      rating,
      comment,
      rideId,
      ride,
      createdAt,
      updatedAt,
    };
  }

  async create(createReviewDto: CreateReviewDto): Promise<ReviewResponseDto> {
    const driver = await this.userRepository.findOneBy({ id: createReviewDto.driverId, role: UserRole.Driver });
    if (!driver) {
      throw new BadRequestException('Driver (User) not found or is not a driver.');
    }

    const user = await this.userRepository.findOneBy({ id: createReviewDto.userId });
    if (!user) {
      throw new BadRequestException('User (customer) not found');
    }

    const ride = await this.rideRepository.findOneBy({ id: createReviewDto.rideId });
    if (!ride) {
      throw new BadRequestException('Ride not found');
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      driver: driver,
      user: user,
      ride: ride,
    });

    const savedReview = await this.reviewRepository.save(review);
    return this.toReviewResponseDto(savedReview);
  }

  async findAll(page: number = 1, limit: number = 10, driverId?: string, userId?: string): Promise<{ data: ReviewResponseDto[], total: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.driver', 'driver')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.ride', 'ride')
      .skip(skip)
      .take(limit);

    if (driverId) {
      queryBuilder.andWhere('review.driverId = :driverId', { driverId });
    }
    if (userId) {
      queryBuilder.andWhere('review.userId = :userId', { userId });
    }

    const [reviews, total] = await queryBuilder.getManyAndCount();
    return {
      data: reviews.map(review => this.toReviewResponseDto(review)),
      total,
    };
  }

  async findByDriver(driverId: string, page: number = 1, limit: number = 10): Promise<{ data: ReviewResponseDto[], total: number }> { // ⭐ Updated: Added page and limit parameters ⭐
    const skip = (page - 1) * limit;
    // Verify the driver exists and is actually a driver
    const driver = await this.userRepository.findOneBy({ id: driverId, role: UserRole.Driver });
    if (!driver) {
      throw new NotFoundException('Driver (User) not found');
    }

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { driverId },
      relations: ['driver', 'user', 'ride'], // Eager load relations
      skip: skip, // ⭐ Added pagination ⭐
      take: limit, // ⭐ Added pagination ⭐
    });
    return { data: reviews.map(review => this.toReviewResponseDto(review)), total }; // ⭐ Updated: Return { data, total } ⭐
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10): Promise<{ data: ReviewResponseDto[], total: number }> { // ⭐ Updated: Added page and limit parameters ⭐
    const skip = (page - 1) * limit;
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User (customer) not found');
    }

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { userId },
      relations: ['driver', 'user', 'ride'], // Eager load relations
      skip: skip, // ⭐ Added pagination ⭐
      take: limit, // ⭐ Added pagination ⭐
    });
    return { data: reviews.map(review => this.toReviewResponseDto(review)), total }; // ⭐ Updated: Return { data, total } ⭐
  }

  async findOne(id: string): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['driver', 'user', 'ride'], // Eager load relations
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return this.toReviewResponseDto(review);
  }

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<ReviewResponseDto> {
    const reviewEntity = await this.reviewRepository.findOne({
      where: { id },
      relations: ['driver', 'user', 'ride'], // Load relations that might be updated
    });
    if (!reviewEntity) {
      throw new NotFoundException('Review not found');
    }

    if (updateReviewDto.driverId) {
      const newDriver = await this.userRepository.findOneBy({ id: updateReviewDto.driverId, role: UserRole.Driver });
      if (!newDriver) {
        throw new BadRequestException('New driver (User) not found or is not a driver.');
      }
      reviewEntity.driver = newDriver;
      reviewEntity.driverId = newDriver.id;
    }

    if (updateReviewDto.userId) {
      const newUser = await this.userRepository.findOneBy({ id: updateReviewDto.userId });
      if (!newUser) {
        throw new BadRequestException('New user (customer) not found');
      }
      reviewEntity.user = newUser;
      reviewEntity.userId = newUser.id;
    }

    if (updateReviewDto.rideId) {
      const newRide = await this.rideRepository.findOneBy({ id: updateReviewDto.rideId });
      if (!newRide) {
        throw new BadRequestException('New ride not found');
      }
      reviewEntity.ride = newRide;
      reviewEntity.rideId = newRide.id;
    }

    Object.assign(reviewEntity, updateReviewDto);

    const updatedReview = await this.reviewRepository.save(reviewEntity);
    return this.toReviewResponseDto(updatedReview);
  }

  async remove(id: string): Promise<void> {
    const review = await this.reviewRepository.findOneBy({ id });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    await this.reviewRepository.remove(review);
  }
}
