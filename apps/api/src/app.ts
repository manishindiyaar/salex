/**
 * Express Application Setup
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

import routes from './routes';
import { errorMiddleware } from './middlewares';
import { getConfig, isDevelopment } from './config';

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export function createApp(): Express {
  const app = express();
  const config = getConfig();

  // Security middleware
  app.use(helmet());

  // CORS - Allow all origins in development and simulator mode
  // For production, restrict to ALLOWED_ORIGINS
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or file://)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // In development, allow all
      if (isDevelopment()) {
        callback(null, true);
        return;
      }
      
      if (config.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

  // Compression
  app.use(compression());

  // Request logging
  app.use(morgan(isDevelopment() ? 'dev' : 'combined'));

  // Add correlation ID to all requests
  app.use((req, _res, next) => {
    req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || uuidv4();
    next();
  });

  // Body parsing
  app.use(express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      const request = req as any;
      if (request.originalUrl.includes('/webhooks/whatsapp')) {
        request.rawBody = Buffer.from(buf);
      }
    },
  }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use(routes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    });
  });

  // Global error handler (must be last)
  app.use(errorMiddleware);

  return app;
}
