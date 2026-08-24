import prisma from '../../helpers/prisma';
import CacheService from '../../redis/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '../../constants';
import { calculatePagination, IPaginationOptions } from '../../helpers/prismaQueryHelper';
import { Prisma } from '@prisma/client';

interface ReviewFilterOptions extends IPaginationOptions {
  searchTerm?: string;
  isApproved?: boolean;
  isFeatured?: boolean;
  rating?: number;
  courseId?: string;
}

export class ReviewService {
  static async getApprovedReviews(courseId?: string) {
    const where = {
      isApproved: true,
      courseId: courseId || undefined,
    };

    const cacheKey = courseId ? `reviews:course:${courseId}` : CACHE_KEYS.REVIEWS;

    return CacheService.getOrSet(
      cacheKey,
      async () => {
        return prisma.review.findMany({
          where,
          include: {
            course: {
              select: { id: true, title: true, slug: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      },
      CACHE_TTL.MEDIUM
    );
  }

  static async getAllReviewsAdmin(filters: ReviewFilterOptions = {}) {
    const { searchTerm, isApproved, isFeatured, rating, courseId, ...paginationOptions } = filters;
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const andConditions: Prisma.ReviewWhereInput[] = [];

    if (typeof isApproved === 'boolean') {
      andConditions.push({ isApproved });
    }

    if (typeof isFeatured === 'boolean') {
      andConditions.push({ isFeatured });
    }

    if (rating !== undefined) {
      andConditions.push({ rating: Number(rating) });
    }

    if (courseId) {
      andConditions.push({ courseId });
    }

    if (searchTerm) {
      andConditions.push({
        OR: [
          { studentName: { contains: searchTerm, mode: 'insensitive' } },
          { comment: { contains: searchTerm, mode: 'insensitive' } },
          { studentTitle: { contains: searchTerm, mode: 'insensitive' } },
          { course: { title: { contains: searchTerm, mode: 'insensitive' } } },
          { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      });
    }

    const where: Prisma.ReviewWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          course: { select: { id: true, title: true, slug: true } },
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.review.count({ where }),
    ]);

    const totalPage = Math.ceil(total / limit);

    return {
      meta: { page, limit, total, totalPage },
      data: reviews,
    };
  }

  static async createReview(userId: string | undefined, payload: any) {
    const review = await prisma.review.create({
      data: {
        ...payload,
        userId: userId || undefined,
        date: payload.date || new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
    });

    await CacheService.delByPattern('reviews:*');
    return review;
  }

  static async updateApproval(id: string, payload: { isApproved: boolean; isFeatured?: boolean }) {
    const review = await prisma.review.update({
      where: { id },
      data: payload,
    });

    await CacheService.delByPattern('reviews:*');
    return review;
  }

  static async deleteReview(id: string) {
    const review = await prisma.review.delete({
      where: { id },
    });

    await CacheService.delByPattern('reviews:*');
    return review;
  }
}
