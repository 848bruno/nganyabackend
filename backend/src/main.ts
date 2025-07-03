import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
 app.use(helmet());
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());

  const { httpAdapter } = app.get(HttpAdapterHost);
  // Register the global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

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
    .swagger-ui .topbar { display: none; }    /* Hide Swagger logo */
    .swagger-ui .info { margin-bottom: 20px; }
  `,
    customSiteTitle: 'Hostel API Documentation',
  });
  const configService = app.get(ConfigService);
  const PORT = configService.getOrThrow<number>('PORT');

  await app.listen(PORT);
  console.log(`Server running on port ${PORT} `);
}
bootstrap();
