import prisma from '../../helpers/prisma';
import CacheService from '../../redis/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '../../constants';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { Category } from '@prisma/client';

export class CategoryService {
  static async getAll() {
    return CacheService.getOrSet(
      CACHE_KEYS.CATEGORIES,
      async () => {
        return prisma.category.findMany({
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { courses: true },
            },
          },
        });
      },
      CACHE_TTL.LONG
    );
  }

  static async getBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        courses: {
          where: { isPublished: true },
          include: { mentor: true },
        },
      },
    });

    if (!category) {
      throw new AppError(httpStatus.NOT_FOUND, 'Category not found!');
    }

    return category;
  }

  static async create(payload: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    const category = await prisma.category.create({
      data: payload,
    });
    await CacheService.del(CACHE_KEYS.CATEGORIES);
    return category;
  }

  static async update(id: string, payload: Partial<Category>) {
    const category = await prisma.category.update({
      where: { id },
      data: payload,
    });
    await CacheService.del(CACHE_KEYS.CATEGORIES);
    return category;
  }

  static async delete(id: string) {
    const category = await prisma.category.delete({
      where: { id },
    });
    await CacheService.del(CACHE_KEYS.CATEGORIES);
    return category;
  }
}

