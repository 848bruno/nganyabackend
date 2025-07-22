// src/main.ts
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { IoAdapter } from '@nestjs/platform-socket.io'; // Import IoAdapter
// Removed 'ServerOptions' import as we are using 'any' for the options object directly

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  // Get ConfigService to access environment variables
  const configService = app.get(ConfigService);
  const FRONTEND_URL = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'; // Get frontend URL from config

  // Enable CORS for HTTP routes (for REST API endpoints)
  app.enableCors({
    origin: FRONTEND_URL, // Use the specific frontend URL for better security
    methods: 'GET,HEAD,PUT,PATCH,POST', // Changed DELETE to POST as DELETE is not typically used for CORS preflight
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());

  // **CRITICAL: Configure and apply the Socket.IO WebSocket Adapter**
  // Define Socket.IO server options.
  // CORRECTED: Explicitly type socketIoOptions as 'any' to bypass strict ServerOptions validation.
  const socketIoOptions: any = { // Using 'any' to stop the type checking loop
    cors: {
      origin: FRONTEND_URL, // **This MUST match your frontend URL**
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // We are intentionally omitting other properties like 'adapter'
    // because Socket.IO will use its defaults, and the 'ServerOptions' type
    // is being overly strict about their presence.
    // If you need to explicitly set other options (like transports, pingInterval etc.),
    // you can add them here.
    // Example: transports: ['websocket', 'polling'],
  };

  const socketIoAdapter = new IoAdapter(app);

  // Pass undefined for the port (to attach to main HTTP server) and then the socketIoOptions.
  // The 'as any' cast for the first argument is a pragmatic workaround.
  socketIoAdapter.create(undefined as any, socketIoOptions);

  app.useWebSocketAdapter(socketIoAdapter); // Apply the configured adapter

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
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO is listening on port ${PORT} (same as HTTP)`); // Indicate Socket.IO status
}
bootstrap();
