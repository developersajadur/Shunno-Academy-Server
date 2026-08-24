import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import config from '../config';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: config.database_url,
      },
    },
    // log: config.node_env === 'development' ? ['query', 'error', 'warn'] : ['error'],
    log: ['error', 'warn'],
  });

if (config.node_env !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
