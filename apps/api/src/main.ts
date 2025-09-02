import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
  });
  
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.clerk.dev", "https://graph.facebook.com"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for WhatsApp webhook
  }));
  
  // Enable CORS with proper configuration
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.EXPO_PUBLIC_API_URL] 
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-hub-signature-256', 'x-simulator-mode'],
  });
  
  // Serve WhatsApp Simulator static files
  const simulatorPath = path.join(__dirname, '../../../WhatsappMockUI');
  app.use('/simulator', express.static(simulatorPath));
  
  // Global validation pipe with enhanced security
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true, // Strip unknown properties
    forbidNonWhitelisted: true, // Throw error for unknown properties
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  const port = process.env.API_PORT || 3000;
  const host = process.env.API_HOST || 'localhost';
  
  await app.listen(port, host);
  
  logger.log(`🚀 API Server running on http://${host}:${port}`);
  logger.log(`📱 WhatsApp webhook: http://${host}:${port}/webhooks/whatsapp`);
  logger.log(`🔐 Auth endpoints: http://${host}:${port}/api/v1/auth/*`);
  logger.log(`🏢 Business endpoints: http://${host}:${port}/api/v1/businesses/*`);
  logger.log(`📲 WhatsApp Simulator: http://${host}:${port}/simulator/whatsapp-simulator.html`);
  logger.log(`🛡️  Security features enabled: Rate limiting, CORS, Helmet, Input validation`);
  logger.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});