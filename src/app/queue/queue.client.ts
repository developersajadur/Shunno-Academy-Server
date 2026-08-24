import { ConnectionOptions } from 'bullmq';
import config from '../config';

function getQueueConnection(): ConnectionOptions {
  const redisUrl = config.redis.url;

  if (redisUrl && redisUrl.startsWith('redis')) {
    try {
      const parsed = new URL(redisUrl);
      const isTls = parsed.protocol === 'rediss:';
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379', 10),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null,
      };
    } catch {
      // Fallback
    }
  }

  return {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null,
  };
}

export const queueRedisConnection: ConnectionOptions = getQueueConnection();
