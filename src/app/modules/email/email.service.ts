import { EmailCampaignAudience, EnrollmentStatus } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../helpers/prisma';
import AppError from '../../errors/AppError';
import { addBatchEmailJobs, addEmailJob, EmailJobData } from '../../queue/email.queue';
import config from '../../config';

interface BroadcastPayload {
  subject: string;
  preheader?: string;
  heading: string;
  body: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  audienceType: EmailCampaignAudience;
  targetCourseId?: string;
  customEmails?: string[];
}

interface TestEmailPayload {
  testEmail?: string;
  subject: string;
  heading: string;
  body: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
}

export class EmailBroadcastService {
  static async sendBroadcast(adminUserId: string, payload: BroadcastPayload) {
    let recipientEmails: string[] = [];

    if (payload.audienceType === EmailCampaignAudience.ALL_USERS) {
      const users = await prisma.user.findMany({
        where: { isBlocked: false },
        select: { email: true },
      });
      recipientEmails = users.map((u) => u.email).filter(Boolean);
    } else if (payload.audienceType === EmailCampaignAudience.COURSE_STUDENTS) {
      if (!payload.targetCourseId) {
        throw new AppError(httpStatus.BAD_REQUEST, 'নির্দিষ্ট কোর্স নির্বাচন করতে হবে!');
      }

      const enrollments = await prisma.enrollment.findMany({
        where: {
          courseId: payload.targetCourseId,
          status: EnrollmentStatus.APPROVED,
        },
        select: { studentEmail: true },
      });

      // Deduplicate student emails
      recipientEmails = Array.from(new Set(enrollments.map((e) => e.studentEmail).filter(Boolean)));
    } else if (payload.audienceType === EmailCampaignAudience.CUSTOM_EMAILS) {
      if (!payload.customEmails || payload.customEmails.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'কমপক্ষে একটি বৈধ ইমেইল অ্যাড্রেস দিতে হবে!');
      }
      recipientEmails = Array.from(new Set(payload.customEmails.map((e) => e.trim().toLowerCase())));
    }

    if (recipientEmails.length === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'নির্বাচিত অডিয়েন্সে কোনো প্রাপক পাওয়া যায়নি!');
    }

    // Prepare BullMQ Jobs
    const jobs: EmailJobData[] = recipientEmails.map((toEmail) => ({
      to: toEmail,
      subject: payload.subject,
      template: 'PROMOTIONAL_CUSTOM',
      context: {
        heading: payload.heading,
        body: payload.body,
        preheader: payload.preheader,
        ctaButtonText: payload.ctaButtonText,
        ctaButtonUrl: payload.ctaButtonUrl,
      },
    }));

    // Dispatch in batches of 50 to BullMQ
    const chunkSize = 50;
    for (let i = 0; i < jobs.length; i += chunkSize) {
      const chunk = jobs.slice(i, i + chunkSize);
      await addBatchEmailJobs(chunk);
    }

    // Save to Campaign Log
    const campaign = await prisma.emailCampaignLog.create({
      data: {
        subject: payload.subject,
        preheader: payload.preheader,
        heading: payload.heading,
        body: payload.body,
        ctaButtonText: payload.ctaButtonText,
        ctaButtonUrl: payload.ctaButtonUrl,
        audienceType: payload.audienceType,
        targetCourseId: payload.targetCourseId,
        recipientCount: recipientEmails.length,
        sentById: adminUserId,
      },
    });

    return {
      campaignId: campaign.id,
      recipientCount: recipientEmails.length,
      message: `${recipientEmails.length} জন প্রাপকের কাছে ইমেইল প্রেরণের জন্য BullMQ কিউতে যোগ করা হয়েছে!`,
    };
  }

  static async sendTestEmail(adminEmail: string, payload: TestEmailPayload) {
    const targetEmail = payload.testEmail || adminEmail || config.admin.email;

    await addEmailJob({
      to: targetEmail,
      subject: `[TEST] ${payload.subject}`,
      template: 'PROMOTIONAL_CUSTOM',
      context: {
        heading: payload.heading,
        body: payload.body,
        ctaButtonText: payload.ctaButtonText,
        ctaButtonUrl: payload.ctaButtonUrl,
      },
    });

    return {
      sentTo: targetEmail,
      message: `টেস্ট ইমেইলটি সফলভাবে ${targetEmail} ঠিকানায় কিউতে পাঠানো হয়েছে!`,
    };
  }

  static async getCampaignHistory() {
    const campaigns = await prisma.emailCampaignLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return campaigns;
  }

  static async getEmailStats() {
    const [totalUsers, totalStudents, totalCampaigns, campaigns] = await Promise.all([
      prisma.user.count({ where: { isBlocked: false } }),
      prisma.enrollment.count({ where: { status: EnrollmentStatus.APPROVED } }),
      prisma.emailCampaignLog.count(),
      prisma.emailCampaignLog.findMany({ select: { recipientCount: true } }),
    ]);

    const totalEmailsSent = campaigns.reduce((acc, c) => acc + c.recipientCount, 0);

    return {
      totalUsers,
      totalStudents,
      totalCampaigns,
      totalEmailsSent,
    };
  }
}

