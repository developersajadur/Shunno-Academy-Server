import prisma from '../../helpers/prisma';
import CacheService from '../../redis/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '../../constants';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { Mentor } from '@prisma/client';

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
      throw new AppError(httpStatus.NOT_FOUND, 'Mentor profile not found!');
    }

    return mentor;
  }

  static async create(payload: Omit<Mentor, 'id' | 'createdAt' | 'updatedAt' | 'totalStudents' | 'rating'>) {
    const mentor = await prisma.mentor.create({
      data: payload,
    });
    await CacheService.del(CACHE_KEYS.MENTORS);
    return mentor;
  }

  static async update(id: string, payload: Partial<Mentor>) {
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

