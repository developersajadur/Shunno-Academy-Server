import { Queue, Worker, Job } from 'bullmq';
import { queueRedisConnection } from './queue.client';
import prisma from '../helpers/prisma';
import CacheService from '../redis/cache.service';
import { CACHE_KEYS } from '../constants';

export interface EnrollmentJobData {
  enrollmentId: string;
  courseId: string;
  action: 'APPROVED' | 'REJECTED' | 'CREATED';
}

export const ENROLLMENT_QUEUE_NAME = 'shunno-enrollment-queue';

export const enrollmentQueue = new Queue<EnrollmentJobData>(ENROLLMENT_QUEUE_NAME, {
  connection: queueRedisConnection,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
  },
});

export const addEnrollmentJob = async (data: EnrollmentJobData) => {
  return await enrollmentQueue.add(`enrollment-${data.action}-${data.enrollmentId}`, data);
};

export const initEnrollmentWorker = () => {
  const worker = new Worker<EnrollmentJobData>(
    ENROLLMENT_QUEUE_NAME,
    async (job: Job<EnrollmentJobData>) => {
      const { courseId, action } = job.data;
      console.log(`🎓 [BullMQ Enrollment Worker] Handling ${action} for course ${courseId}`);

      if (action === 'APPROVED') {
        // Increment course student count
        await prisma.course.update({
          where: { id: courseId },
          data: { totalStudents: { increment: 1 } },
        });

        // Invalidate cached courses and stats
        await CacheService.del(CACHE_KEYS.COURSES);
        await CacheService.del(CACHE_KEYS.STATS);
      }

      return { processed: true };
    },
    { connection: queueRedisConnection }
  );

  worker.on('failed', (job, err) => {
    console.error(`❌ [BullMQ Enrollment Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
};

