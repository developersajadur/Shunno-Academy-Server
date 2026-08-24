import { Prisma, UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../helpers/prisma';
import AppError from '../../errors/AppError';
import { calculatePagination, IPaginationOptions } from '../../helpers/prismaQueryHelper';

interface UserFilterOptions extends IPaginationOptions {
  searchTerm?: string;
  role?: UserRole;
  isBlocked?: boolean;
}

export class UserService {
  static async getAllUsers(filters: UserFilterOptions) {
    const { searchTerm, role, isBlocked, ...paginationOptions } = filters;
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const andConditions: Prisma.UserWhereInput[] = [];

    if (searchTerm) {
      andConditions.push({
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { district: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    if (role) {
      andConditions.push({ role });
    }

    if (typeof isBlocked === 'boolean') {
      andConditions.push({ isBlocked });
    }

    const where: Prisma.UserWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatar: true,
          district: true,
          occupation: true,
          isBlocked: true,
          createdAt: true,
          _count: {
            select: {
              enrollments: true,
              reviews: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPage = Math.ceil(total / limit);

    return {
      meta: { page, limit, total, totalPage },
      data: users,
    };
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        district: true,
        occupation: true,
        isBlocked: true,
        createdAt: true,
        enrollments: {
          include: {
            course: { select: { title: true, slug: true, thumbnail: true } },
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
    }

    return user;
  }

  static async toggleBlockStatus(id: string, isBlocked: boolean) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
    }

    if (user.role === UserRole.ADMIN) {
      throw new AppError(httpStatus.FORBIDDEN, 'Cannot block an administrator account!');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBlocked },
      select: {
        id: true,
        name: true,
        email: true,
        isBlocked: true,
      },
    });

    return updatedUser;
  }
}

