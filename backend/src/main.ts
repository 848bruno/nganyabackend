// src/main.ts
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './http-exception.filter';
import { ValidationPipe, Logger } from '@nestjs/common'; // Import Logger
import helmet from 'helmet';
import { WsAuthAdapter } from './ws-auth.adapter'; // ⭐ IMPORT YOUR CUSTOM WS AUTH ADAPTER ⭐

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  
  Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']);

  // Get ConfigService to access environment variables
  const configService = app.get(ConfigService);
  const FRONTEND_URL = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'; // Get frontend URL from config

  // Enable CORS for HTTP routes (for REST API endpoints)
  app.enableCors({
    origin: FRONTEND_URL, // Use the specific frontend URL for better security
    methods: 'GET,HEAD,PUT,PATCH,POST',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());

  // ⭐ CRITICAL: Apply the custom WebSocket Adapter for global authentication ⭐
  app.useWebSocketAdapter(new WsAuthAdapter(app));

  const { httpAdapter } = app.get(HttpAdapterHost);
  // Register the global exception filter
  app.useGlobalFilters(new AllExceptionsFilter()); 

  const config = new DocumentBuilder()
    .setTitle('Taxi API')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('vehicles', 'Vehicle management')
    .addTag('drivers', 'Driver management')
    .addTag('routes', 'Route management for carpooling')
    .addTag('rides', 'Ride management for private and carpooling rides')
    .addTag('bookings', 'Booking management for rides')
    .addTag('deliveries', 'Delivery management')
    .addTag('payments', 'Payment management')
    .addTag('reviews', 'Review management for drivers and rides')
    .addTag('notifications', 'Notification management')
    .addBearerAuth()
    .addServer('http://localhost:3001', 'Local Development Server')
    .addServer('https://ridesharingbackend-x2gi.onrender.com', 'Production Server')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
    },
    customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin-bottom: 20px; }
  `,
    customSiteTitle: 'Hostel API Documentation',
  });

  const PORT = configService.getOrThrow<number>('PORT');

  await app.listen(PORT);
  Logger.log(`Server running on port ${PORT}`);
  Logger.log(`Socket.IO is listening on port ${PORT} (same as HTTP)`); // Indicate Socket.IO status
}
bootstrap();
