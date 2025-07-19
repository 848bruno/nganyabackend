import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ReviewResponseDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decoretor';
import { UserRole } from 'src/users/entities/user.entity';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewsService) {

  }

    private checkRole(req: any, allowedRoles: UserRole[]) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  @Post()
  @Roles(UserRole.Customer)
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, type: ReviewResponseDto })
  async create(@Body() createReviewDto: CreateReviewDto, @Req() req): Promise<ReviewResponseDto> {
    this.checkRole(req, [UserRole.Customer]);
    if (createReviewDto.userId !== req.user.id) {
      throw new ForbiddenException('You can only create reviews for yourself');
    }
    return this.reviewService.create(createReviewDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Driver, UserRole.Customer)
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiResponse({
    status: 200, schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/ReviewResponseDto' } },
        total: { type: 'number' },
      },
    },
  })
  async findAll(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: ReviewResponseDto[], total: number }> { // Corrected return type
    this.checkRole(req, [UserRole.Admin, UserRole.Driver, UserRole.Customer]);

    if (req.user.role === UserRole.Driver) {
      return await this.reviewService.findByDriver(req.user.id, page, limit);
    }
    if (req.user.role === UserRole.Customer) {
      return await this.reviewService.findByUser(req.user.id, page, limit);
    }
    return await this.reviewService.findAll(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Driver, UserRole.Customer)
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async findOne(@Param('id') id: string, @Req() req): Promise<ReviewResponseDto> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver, UserRole.Customer]);
    const review = await this.reviewService.findOne(id);
    if (req.user.role === UserRole.Customer && review.userId !== req.user.id) {
      throw new ForbiddenException('You can only view your own reviews');
    }
    if (req.user.role === UserRole.Driver && review.driverId !== req.user.id) {
      throw new ForbiddenException('You can only view your own reviews');
    }
    return review;
  }

  @Patch(':id')
  @Roles(UserRole.Customer)
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  async update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto, @Req() req): Promise<ReviewResponseDto> {
    this.checkRole(req, [UserRole.Customer]);
    const review = await this.reviewService.findOne(id);
    if (review.userId !== req.user.id) {
      throw new ForbiddenException('You can only update your own reviews');
    }
    return this.reviewService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @Roles(UserRole.Customer, UserRole.Admin)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    this.checkRole(req, [UserRole.Customer, UserRole.Admin]);
    const review = await this.reviewService.findOne(id);
    if (req.user.role === UserRole.Customer && review.userId !== req.user.id) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    return this.reviewService.remove(id);
  }
}
