/**
 * Redis Connection for BullMQ
 *
 * Parses REDIS_URL and creates IORedis connection options compatible with
 * Railway private networking (family: 0) and BullMQ (maxRetriesPerRequest: null).
 *
 * Does NOT log the Redis URL or password.
 */

import IORedis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { getConfig } from '../config';
import { logger } from '../utils/logger';

let _connection: IORedis | null = null;

/**
 * Get shared Redis connection options for BullMQ queues/workers.
 * Uses REDIS_URL from config, parsed for Railway compatibility.
 */
export function getRedisConnectionOptions(): RedisOptions {
  const config = getConfig();
  const redisUrl = config.redisUrl;

  if (!redisUrl) {
    throw new Error('REDIS_URL is required when WHATSAPP_QUEUE_BACKEND=redis');
  }

  const parsed = new URL(redisUrl);

  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
    // Railway private networking compatibility
    family: 0,
    // Required for BullMQ workers
    maxRetriesPerRequest: null,
    // Connection resilience
    retryStrategy: (times: number) => Math.min(times * 200, 5000),
    enableReadyCheck: false,
    lazyConnect: true,
  };
}

/**
 * Get or create a shared Redis connection instance.
 * Used for non-BullMQ Redis operations (locks, payload cache).
 */
export function getRedisConnection(): IORedis {
  if (!_connection) {
    const opts = getRedisConnectionOptions();
    _connection = new IORedis(opts);

    _connection.on('connect', () => {
      logger.info('Redis connected');
    });

    _connection.on('error', (err) => {
      logger.error({ err: err.message }, 'Redis connection error');
    });

    _connection.connect().catch(() => {
      // Error handled by 'error' event
    });
  }

  return _connection;
}

/**
 * Gracefully close the Redis connection.
 */
export async function closeRedisConnection(): Promise<void> {
  if (_connection) {
    await _connection.quit().catch(() => {});
    _connection = null;
  }
}
