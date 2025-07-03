// src/user/user.seed.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seedUsers() {
    const users: User[] = [];

    // Create a fixed test admin user
    const admin = this.userRepository.create({
      name: 'Admin User',
      email: 'admin@taxiapp.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      phone: faker.phone.number(),
    });
    users.push(admin);

    // Create 5 drivers
    for (let i = 0; i < 5; i++) {
      const driver = this.userRepository.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: await bcrypt.hash('driver123', 10),
        role: 'driver',
        phone: faker.phone.number(),
      });
      users.push(driver);
    }

    // Create 5 customers
    for (let i = 0; i < 5; i++) {
      const customer = this.userRepository.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: await bcrypt.hash('customer123', 10),
        role: 'customer',
        phone: faker.phone.number(),
      });
      users.push(customer);
    }

    await this.userRepository.save(users);

    return {
      message: 'Seeded users successfully',
      total: users.length,
      sampleLogin: {
        admin: { email: 'admin@taxiapp.com', password: 'admin123' },
        driver: { email: users.find(u => u.role === 'driver')?.email, password: 'driver123' },
        customer: { email: users.find(u => u.role === 'customer')?.email, password: 'customer123' },
      },
    };
  }
}
