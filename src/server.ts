import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

import { Server } from 'http';
import app from './app';
import config from './app/config';
import prisma from './app/helpers/prisma';
import redis from './app/redis/redis.client';
import { seedAdmin } from './app/utils/seedAdmin';
import { initEmailWorker } from './app/queue/email.queue';
import { initEnrollmentWorker } from './app/queue/enrollment.queue';
import { verifySmtpConnection } from './app/services/email/email.transporter';
import { initKeepAlive, stopKeepAlive } from './app/utils/keepAlive';
import { logger, errorLogger } from './app/shared/logger';

let server: Server;

async function bootstrap() {
  try {
    // 1. Connect to Database via Prisma
    await prisma.$connect();
    logger.info('📦 PostgreSQL Database connected via Prisma');

    // 2. Verify Email SMTP Server Connection
    await verifySmtpConnection();

    // 3. Connect & Check Redis
    try {
      await redis.connect();
    } catch {
      // Redis connection in progress or lazy
    }

    // 4. Seed Default Admin Account
    await seedAdmin();

    // 5. Initialize Background BullMQ Queue Workers
    try {
      initEmailWorker();
      initEnrollmentWorker();
      logger.info('⚡ BullMQ Workers initialized for Email and Enrollment');
    } catch (queueErr: any) {
      errorLogger.warn(`⚠️ BullMQ Workers notice: ${queueErr.message}`);
    }

    // 5. Start HTTP Server
    server = app.listen(config.port, () => {
      logger.info(`🚀 Shunno Academy Server is listening on port ${config.port}`);
      if (config.node_env !== 'production') {
        logger.info(`📑 Interactive API Documentation: http://localhost:${config.port}/api/docs`);
      }

      // 6. Initialize Keep-Alive auto-ping cron for Render (runs if HOST_ON === 'render')
      initKeepAlive();
    });
  } catch (error) {
    errorLogger.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

bootstrap();

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  errorLogger.error('💥 Unhandled Rejection detected, shutting down...', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  errorLogger.error('💥 Uncaught Exception detected, shutting down...', err);
  process.exit(1);
});

// Graceful termination
process.on('SIGTERM', async () => {
  logger.info('👋 SIGTERM received. Gracefully closing connections...');
  if (server) {
    server.close(async () => {
      stopKeepAlive();
      await prisma.$disconnect();
      redis.disconnect();
      logger.info('💤 All server connections closed.');
      process.exit(0);
    });
  }
});

export default app;

