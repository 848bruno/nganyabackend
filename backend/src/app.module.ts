import { MiddlewareConsumer, Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';


import { DriverModule } from './drivers/drivers.module';
import { RouteModule } from './routes/routes.module';
import { RideModule } from './rides/rides.module';
import { BookingModule } from './bookings/bookings.module';
import { DeliveryModule } from './deliveries/deliveries.module';
import { PaymentModule } from './payments/payments.module';
import { ReviewModule } from './reviews/reviews.module';
import { NotificationModule } from './notification/notification.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { LoggerMiddleware } from './logger.middleware';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AtGuard } from './auth/guards';


import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './seed/seed.module';
import { TypeOrmModule } from '@nestjs/typeorm';



@Module({
  imports: [AuthModule,SeedModule,ConfigModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: Number(config.getOrThrow('THROTTLE_TTL',60)),
            limit: Number(config.getOrThrow('THROTTLE_LIMIT',10)),
            ignoreUserAgents: [/^curl\//, /^PostmanRuntime\//],
          },
        ],
      }),
    }),


    DatabaseModule, // ADD THIS
    UsersModule,
    VehicleModule, 
    DriverModule,
    RouteModule, 
    RideModule,
    BookingModule, 
    DeliveryModule,
    PaymentModule, 
    ReviewModule, 
    NotificationModule, 
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
