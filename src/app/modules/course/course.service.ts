import { Course, CourseMode, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../helpers/prisma';
import AppError from '../../errors/AppError';
import CacheService from '../../redis/cache.service';
import { CACHE_KEYS, CACHE_TTL } from '../../constants';
import { calculatePagination, IPaginationOptions } from '../../helpers/prismaQueryHelper';

interface CourseFilterOptions extends IPaginationOptions {
  searchTerm?: string;
  category?: string;
  mode?: CourseMode;
  isFeatured?: boolean;
  isPublished?: boolean;
  isAdmin?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export class CourseService {
  static async getAllCourses(filters: CourseFilterOptions) {
    const { searchTerm, category, mode, isFeatured, minPrice, maxPrice, ...paginationOptions } = filters;
    const isPublished = filters.isPublished === true || (filters.isPublished as any) === 'true'
      ? true
      : filters.isPublished === false || (filters.isPublished as any) === 'false'
      ? false
      : undefined;
    const isAdmin = filters.isAdmin === true || (filters.isAdmin as any) === 'true';

    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const andConditions: Prisma.CourseWhereInput[] = [];

    if (isPublished !== undefined) {
      andConditions.push({ isPublished });
    } else if (!isAdmin) {
      andConditions.push({ isPublished: true });
    }

    if (searchTerm) {
      andConditions.push({
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { bengaliTitle: { contains: searchTerm, mode: 'insensitive' } },
          { overview: { contains: searchTerm, mode: 'insensitive' } },
          { slug: { contains: searchTerm, mode: 'insensitive' } },
          { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { category: { bengaliName: { contains: searchTerm, mode: 'insensitive' } } },
          { mentor: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { mentor: { englishName: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      });
    }

    if (category) {
      andConditions.push({
        category: { slug: category },
      });
    }

    if (mode) {
      andConditions.push({ mode });
    }

    if (typeof isFeatured === 'boolean') {
      andConditions.push({ isFeatured });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      andConditions.push({
        priceBDT: {
          gte: minPrice !== undefined ? Number(minPrice) : undefined,
          lte: maxPrice !== undefined ? Number(maxPrice) : undefined,
        },
      });
    }

    const where: Prisma.CourseWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const cacheKey = `courses:list:${JSON.stringify(filters)}`;

    return CacheService.getOrSet(
      cacheKey,
      async () => {
        const [courses, total] = await Promise.all([
          prisma.course.findMany({
            where,
            include: {
              category: { select: { name: true, bengaliName: true, slug: true } },
              mentor: { select: { name: true, englishName: true, designation: true, avatar: true } },
              _count: { select: { modules: true, reviews: true, enrollments: true } },
            },
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
          }),
          prisma.course.count({ where }),
        ]);

        const totalPage = Math.ceil(total / limit);

        return {
          meta: {
            page,
            limit,
            total,
            totalPage,
          },
          data: courses,
        };
      },
      CACHE_TTL.SHORT
    );
  }

  static async getCourseBySlug(slug: string) {
    return CacheService.getOrSet(
      CACHE_KEYS.COURSE_DETAIL(slug),
      async () => {
        const course = await prisma.course.findFirst({
          where: {
            OR: [{ slug }, { id: slug }],
          },
          include: {
            category: true,
            mentor: true,
            modules: {
              orderBy: { moduleNumber: 'asc' },
              include: {
                lectures: {
                  orderBy: { order: 'asc' },
                },
              },
            },
            reviews: {
              where: { isApproved: true },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        });

        if (!course) {
          throw new AppError(httpStatus.NOT_FOUND, `Course '${slug}' was not found!`);
        }

        return course;
      },
      CACHE_TTL.MEDIUM
    );
  }

  static async createCourse(payload: any) {
    const existing = await prisma.course.findUnique({
      where: { slug: payload.slug },
    });
    if (existing) {
      throw new AppError(httpStatus.CONFLICT, `A course with slug '${payload.slug}' already exists!`);
    }

    const { modules, ...courseData } = payload;

    const course = await prisma.course.create({
      data: {
        ...courseData,
        enrollmentDeadline: courseData.enrollmentDeadline ? new Date(courseData.enrollmentDeadline) : null,
        modules: modules && modules.length > 0
          ? {
              create: modules.map((m: any) => ({
                moduleNumber: m.moduleNumber,
                title: m.title,
                description: m.description,
                lecturesCount: m.lectures?.length || 0,
                lectures: m.lectures && m.lectures.length > 0
                  ? {
                      create: m.lectures.map((l: any, idx: number) => ({
                        title: l.title,
                        duration: l.duration,
                        videoUrl: l.videoUrl,
                        isPreview: l.isPreview || false,
                        order: idx + 1,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        mentor: true,
        modules: {
          include: { lectures: true },
        },
      },
    });

    await CacheService.delByPattern('courses:*');
    await CacheService.del(CACHE_KEYS.CATEGORIES);

    return course;
  }

  static async updateCourse(id: string, payload: Partial<Course>) {
    const { id: _, categoryId, mentorId, ...rest } = payload as any;
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...rest,
        categoryId: categoryId || undefined,
        mentorId: mentorId !== undefined ? mentorId : undefined,
        enrollmentDeadline: rest.enrollmentDeadline ? new Date(rest.enrollmentDeadline) : undefined,
      },
    });

    await CacheService.delByPattern('courses:*');
    return course;
  }

  static async deleteCourse(id: string) {
    const course = await prisma.course.delete({
      where: { id },
    });

    await CacheService.delByPattern('courses:*');
    return course;
  }
}

