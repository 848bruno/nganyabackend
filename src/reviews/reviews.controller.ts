import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Req } from '@nestjs/common';
import { ReviewService } from './reviews.service';
import { CreateReviewDto, ReviewResponseDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UserRole } from 'src/types';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decoretor';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {
   
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
  @ApiResponse({ status: 200, type: [ReviewResponseDto] })
  async findAll(@Req() req): Promise<ReviewResponseDto[]> {
    this.checkRole(req, [UserRole.Admin, UserRole.Driver, UserRole.Customer]);
    if (req.user.role === UserRole.Driver) {
      return this.reviewService.findByDriver(req.user.id);
    }
    if (req.user.role === UserRole.Customer) {
      return this.reviewService.findByUser(req.user.id);
    }
    return this.reviewService.findAll();
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