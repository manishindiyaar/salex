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
import { isDevelopment } from './config';

export function createApp(): Express {
  const app = express();

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
      
      // Allow localhost for simulator
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('file://')) {
        callback(null, true);
        return;
      }
      
      // Check allowed origins
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow anyway for now, tighten in production
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
  app.use(express.json({ limit: '10mb' }));
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
