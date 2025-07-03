import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, UserResponseDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private toUserResponseDto(user: User): UserResponseDto {
    const { id, name, email, role, createdAt, updatedAt } = user;
    return { id, name, email, role: role as any, createdAt, updatedAt };
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findOneBy({ email: createUserDto.email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
    const user = this.userRepository.create(createUserDto);
    await this.userRepository.save(user);
    return this.toUserResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find();
    return users.map(user => this.toUserResponseDto(user));
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOneDto(id: string): Promise<UserResponseDto> {
    const user = await this.findOne(id);
    return this.toUserResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);
    return this.toUserResponseDto(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
