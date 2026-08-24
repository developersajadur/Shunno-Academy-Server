import { Queue, Worker, Job } from 'bullmq';
import { queueRedisConnection } from './queue.client';
import { EmailTemplateService } from '../services/email/email.template';
import { sendMailDirect } from '../services/email/email.transporter';
import { logger, errorLogger } from '../shared/logger';

export type EmailTemplateType =
  | 'WELCOME'
  | 'EMAIL_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'PAYMENT_SUBMITTED'
  | 'ENROLLMENT_APPROVED'
  | 'INQUIRY_RECEIVED'
  | 'PROMOTIONAL_CUSTOM';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  template: EmailTemplateType;
  context: Record<string, any>;
}

export const EMAIL_QUEUE_NAME = 'shunno-email-queue';

/**
 * Renders HTML for any template type with its context
 */
export function renderEmailHtml(template: EmailTemplateType, context: Record<string, any>, subject: string): string {
  switch (template) {
    case 'EMAIL_VERIFICATION':
      return EmailTemplateService.getEmailVerificationHtml({
        name: context.name || 'শিক্ষার্থী',
        verifyUrl: context.verifyUrl || '#',
        otpCode: context.otpCode,
      });

    case 'PASSWORD_RESET':
      return EmailTemplateService.getPasswordResetHtml({
        name: context.name || 'ব্যবহারকারী',
        resetUrl: context.resetUrl || '#',
      });

    case 'PAYMENT_SUBMITTED':
      return EmailTemplateService.getPaymentSubmittedHtml({
        name: context.name || 'শিক্ষার্থী',
        orderId: context.orderId || 'N/A',
        trxId: context.trxId || 'N/A',
        amount: context.amount || 0,
        method: context.method,
        courseTitle: context.courseTitle,
      });

    case 'ENROLLMENT_APPROVED':
      return EmailTemplateService.getEnrollmentApprovedHtml({
        name: context.name || 'শিক্ষার্থী',
        courseTitle: context.courseTitle || context.course || 'কোর্স',
        orderId: context.orderId || 'N/A',
        batchSchedule: context.batchSchedule,
      });

    case 'INQUIRY_RECEIVED':
      return EmailTemplateService.getPromotionalCustomHtml({
        heading: `আপনার মেসেজটি আমরা পেয়েছি!`,
        body: `প্রিয় ${context.name || 'শিক্ষার্থী'},\n\nশুন্য একাডেমিতে যোগাযোগ করার জন্য ধন্যবাদ। আপনার বার্তা "${context.subject || 'কাউন্সেলিং'}" সফলভাবে আমাদের সিস্টেমে নথিভুক্ত হয়েছে। আমাদের একজন ক্যারিয়ার কাউন্সিলর দ্রুত আপনার সাথে যোগাযোগ করবেন।`,
        ctaButtonText: 'আমাদের কোর্সসমূহ দেখুন',
        ctaButtonUrl: `${context.clientUrl || 'http://localhost:3000'}/courses`,
      });

    case 'PROMOTIONAL_CUSTOM':
      return EmailTemplateService.getPromotionalCustomHtml({
        heading: context.heading || subject,
        body: context.body || '',
        preheader: context.preheader,
        ctaButtonText: context.ctaButtonText,
        ctaButtonUrl: context.ctaButtonUrl,
      });

    case 'WELCOME':
    default:
      return EmailTemplateService.getPromotionalCustomHtml({
        heading: `শুন্য একাডেমিতে আপনাকে স্বাগতম, ${context.name || 'শিক্ষার্থী'}!`,
        body: `আপনার শুন্য একাডেমি অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন থেকে আপনি আমাদের প্রিমিয়াম কোর্সসমূহ ব্রাউজ করতে ও ফ্রিল্যান্সিং ক্যারিয়ার শুরু করতে পারবেন।`,
        ctaButtonText: 'কোর্সসমূহ দেখুন',
        ctaButtonUrl: `${context.clientUrl || 'http://localhost:3000'}/courses`,
      });
  }
}

/**
 * Direct Instant Dispatch Fallback
 */
export async function sendEmailDirectByTemplate(data: EmailJobData) {
  try {
    const html = renderEmailHtml(data.template, data.context, data.subject);
    const result = await sendMailDirect({
      to: data.to,
      subject: data.subject,
      html,
    });
    logger.info(`🚀 [Direct Email Dispatch] Sent "${data.subject}" to: ${Array.isArray(data.to) ? data.to.join(',') : data.to}`);
    return result;
  } catch (err: any) {
    errorLogger.error(`❌ [Direct Email Dispatch Error] Failed to send email to ${data.to}:`, err.message);
    throw err;
  }
}

let emailQueue: Queue<EmailJobData> | null = null;

try {
  emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: queueRedisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 50,
      },
    },
  });
} catch (e: any) {
  errorLogger.warn(`⚠️ BullMQ emailQueue creation notice: ${e.message}`);
}

/**
 * Adds email job to BullMQ queue, or instantly dispatches directly if Queue/Redis is unavailable.
 */
export const addEmailJob = async (data: EmailJobData) => {
  if (emailQueue) {
    try {
      // Try adding to queue with a 2-second timeout
      const job = await Promise.race([
        emailQueue.add(`email-${data.template}-${Date.now()}`, data),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Queue timeout, switching to direct dispatch')), 2000)
        ),
      ]);
      logger.info(`📋 [BullMQ Queue] Enqueued email job "${data.subject}" for ${Array.isArray(data.to) ? data.to.join(',') : data.to}`);
      return job;
    } catch (queueErr: any) {
      logger.info(`⚡ [Queue Fallback] ${queueErr.message}. Dispatching email directly via Nodemailer...`);
      return await sendEmailDirectByTemplate(data);
    }
  }

  // If no queue instance, dispatch directly
  return await sendEmailDirectByTemplate(data);
};

export const addBatchEmailJobs = async (jobs: EmailJobData[]) => {
  if (emailQueue) {
    try {
      const bulkJobs = jobs.map((job) => ({
        name: `email-${job.template}-${Date.now()}`,
        data: job,
      }));
      return await Promise.race([
        emailQueue.addBulk(bulkJobs),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Batch queue timeout')), 3000)
        ),
      ]);
    } catch {
      logger.info('⚡ [Batch Queue Fallback] Dispatching batch emails directly...');
      return await Promise.allSettled(jobs.map((job) => sendEmailDirectByTemplate(job)));
    }
  }

  return await Promise.allSettled(jobs.map((job) => sendEmailDirectByTemplate(job)));
};

export const initEmailWorker = () => {
  try {
    const worker = new Worker<EmailJobData>(
      EMAIL_QUEUE_NAME,
      async (job: Job<EmailJobData>) => {
        const { to, subject, template, context } = job.data;
        logger.info(`📧 [BullMQ Email Worker] Processing job ${job.id} for: ${Array.isArray(to) ? to.join(',') : to} (${template})`);

        const html = renderEmailHtml(template, context, subject);

        const result = await sendMailDirect({
          to,
          subject,
          html,
        });

        logger.info(`✅ [BullMQ Email Worker] Successfully delivered email to: ${Array.isArray(to) ? to.join(',') : to}`);
        return { sent: true, messageId: (result as any)?.messageId };
      },
      {
        connection: queueRedisConnection,
        concurrency: 5,
      }
    );

    worker.on('failed', (job, err) => {
      errorLogger.error(`❌ [BullMQ Email Worker] Job ${job?.id} failed on attempt ${job?.attemptsMade}:`, err.message);
    });

    worker.on('error', (err) => {
      errorLogger.warn(`⚠️ [BullMQ Email Worker Notice]: ${err.message}`);
    });

    return worker;
  } catch (err: any) {
    errorLogger.warn(`⚠️ [BullMQ Email Worker] Could not start worker: ${err.message}`);
    return null;
  }
};
