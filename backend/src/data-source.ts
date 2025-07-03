import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Vehicle } from './vehicle/entities/vehicle.entity';
import { Driver } from './drivers/entities/driver.entity';
// ...import other entities...

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // ⚠️ Disable in production
  logging: false,
  entities: [
    User,
    Vehicle,
    Driver,
    // ...add all your other entities here
  ],
});
