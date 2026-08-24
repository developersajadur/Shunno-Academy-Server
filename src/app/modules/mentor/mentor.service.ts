import prisma from '../../helpers/prisma';
import CacheService from '../../redis/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '../../constants';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { Mentor, UserRole, TokenType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { addEmailJob } from '../../queue/email.queue';
import config from '../../config';

export class MentorService {
  static async getAll() {
    return CacheService.getOrSet(
      CACHE_KEYS.MENTORS,
      async () => {
        return prisma.mentor.findMany({
          orderBy: { order: 'asc' },
          include: {
            courses: {
              where: { isPublished: true },
              select: {
                id: true,
                title: true,
                slug: true,
                mode: true,
              },
            },
          },
        });
      },
      CACHE_TTL.LONG
    );
  }

  static async getById(id: string) {
    const mentor = await prisma.mentor.findUnique({
      where: { id },
      include: {
        courses: {
          where: { isPublished: true },
        },
      },
    });

    if (!mentor) {
      throw new AppError(httpStatus.NOT_FOUND, 'Teacher profile not found!');
    }

    return mentor;
  }

  static async create(payload: Omit<Mentor, 'id' | 'createdAt' | 'updatedAt' | 'totalStudents' | 'rating'>) {
    const cleanEmail = payload.email?.toLowerCase().trim();

    // 1. Create or ensure User record with INSTRUCTOR role
    if (cleanEmail) {
      let existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!existingUser) {
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, config.salt_rounds || 12);

        existingUser = await prisma.user.create({
          data: {
            name: payload.name.trim(),
            email: cleanEmail,
            phone: payload.phone?.trim() || null,
            password: hashedPassword,
            role: UserRole.INSTRUCTOR,
            avatar: payload.avatar,
            isEmailVerified: false,
          },
        });
      } else {
        // Upgrade role to INSTRUCTOR if not already
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.INSTRUCTOR,
            avatar: payload.avatar || existingUser.avatar,
          },
        });
      }

      // 2. Generate a secure Password Setup token (valid for 48 hours)
      const setupToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // Clean old tokens for this email
      await prisma.emailToken.deleteMany({
        where: {
          email: cleanEmail,
          type: TokenType.PASSWORD_RESET,
        },
      });

      await prisma.emailToken.create({
        data: {
          email: cleanEmail,
          token: setupToken,
          type: TokenType.PASSWORD_RESET,
          expiresAt,
        },
      });

      const setPasswordUrl = `${config.client_url}/set-password?token=${setupToken}`;

      // 3. Dispatch Invitation & Password Setup Email to Teacher
      addEmailJob({
        to: cleanEmail,
        subject: `[Shunno Academy] শিক্ষক প্যানেলে স্বাগতম - আপনার পাসওয়ার্ড সেট করুন`,
        template: 'PROMOTIONAL_CUSTOM',
        context: {
          heading: `শুন্য একাডেমি শিক্ষক প্যানেলে আপনাকে স্বাগতম!`,
          preheader: `আপনার শিক্ষক অ্যাকাউন্টের পাসওয়ার্ড সেট করুন`,
          body: `প্রিয় ${payload.name},\n\nশুন্য একাডেমিতে শিক্ষক/ইন্সট্রাক্টর হিসেবে আপনার অ্যাকাউন্ট সফলভাবে তৈরি করা হয়েছে।\n\nআপনার শিক্ষক অ্যাকাউন্টের পাসওয়ার্ড সেট করতে নিচের বাটনে ক্লিক করুন। পাসওয়ার্ড সেট সম্পন্ন করার পর আপনি সরাসরি /teacher-login পেজে লগইন করে ক্লাস ও হোমওয়ার্ক পরিচালনা করতে পারবেন।`,
          ctaButtonText: 'পাসওয়ার্ড সেট করুন (Set Password)',
          ctaButtonUrl: setPasswordUrl,
        },
      }).catch(() => {});
    }

    // 4. Create Mentor / Teacher record
    const mentor = await prisma.mentor.create({
      data: {
        ...payload,
        email: cleanEmail || null,
      },
    });

    await CacheService.del(CACHE_KEYS.MENTORS);
    return mentor;
  }

  static async update(id: string, payload: Partial<Mentor>) {
    const existing = await prisma.mentor.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');
    }

    const cleanEmail = payload.email?.toLowerCase().trim() || existing.email;

    if (cleanEmail) {
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name: payload.name || user.name,
            phone: payload.phone || user.phone,
            avatar: payload.avatar || user.avatar,
            role: UserRole.INSTRUCTOR,
          },
        });
      }
    }

    const mentor = await prisma.mentor.update({
      where: { id },
      data: payload,
    });
    await CacheService.del(CACHE_KEYS.MENTORS);
    return mentor;
  }

  static async delete(id: string) {
    const mentor = await prisma.mentor.delete({
      where: { id },
    });
    await CacheService.del(CACHE_KEYS.MENTORS);
    return mentor;
  }
}
