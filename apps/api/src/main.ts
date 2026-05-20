import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['log', 'warn', 'error']
        : ['verbose', 'debug', 'log', 'warn', 'error'],
  });

  const port = process.env.PORT ?? 3000;

  // TODO: Implement OnApplicationShutdown hooks on external services like DATABASE, REDIS, JOBS, QUERES, TCP/WEBSOCKETS
  app.enableShutdownHooks();

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Mora - Procurement Platform API')
    .setDescription('Purchase requisition and procurement workflow API')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth(
      'refreshToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
      },
      'refreshToken',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('organizations', 'Organization Management')
    .addTag('requisitions', 'Purchase Requisitions')
    .addTag('orders', 'Purchase Orders')
    .addTag('invoices', 'Invoices')
    .addTag('payments', 'Payments')
    .addTag('receipts', 'Goods Receipts')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);

  await app.listen(port);

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
bootstrap();
