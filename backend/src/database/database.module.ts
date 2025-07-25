// src/app.module.ts (or your DatabaseModule file)
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        autoLoadEntities: true,
        ssl: {
          rejectUnauthorized: false,
        },
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.getOrThrow<boolean>('DB_SYNC', false), // Keep this as false for production
        // ⭐ TEMPORARILY HARDCODE LOGGING FOR DEBUGGING ⭐
        logging: ['query', 'error', 'schema', 'log'], // Log queries, errors, schema sync, and general logs
        logger: 'advanced-console',  // Use advanced-console for better formatting
        // ⭐ END TEMPORARY HARDCODED CHANGE ⭐
        migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
