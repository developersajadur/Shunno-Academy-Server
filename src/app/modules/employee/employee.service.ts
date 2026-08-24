import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../helpers/prisma';
import AppError from '../../errors/AppError';
import { calculatePagination, IPaginationOptions } from '../../helpers/prismaQueryHelper';

interface EmployeeFilterOptions extends IPaginationOptions {
  searchTerm?: string;
  status?: string;
  department?: string;
}

export class EmployeeService {
  static async getAllEmployees(filters: EmployeeFilterOptions) {
    const { searchTerm, status, department, ...paginationOptions } = filters;
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const andConditions: Prisma.EmployeeWhereInput[] = [];

    if (searchTerm) {
      andConditions.push({
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { employeeId: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { designation: { contains: searchTerm, mode: 'insensitive' } },
          { department: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    if (status) {
      andConditions.push({ status });
    }

    if (department) {
      andConditions.push({ department });
    }

    const where: Prisma.EmployeeWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const [employees, total, totalActive, totalStudentsReferred] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          _count: {
            select: { students: true },
          },
        },
        skip,
        take: limit,
        orderBy: sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({
        where: {
          employeeId: { not: null },
        },
      }),
    ]);

    const totalPage = Math.ceil(total / limit);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage,
        totalActive,
        totalStudentsReferred,
      },
      data: employees,
    };
  }

  static async getEmployeeById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true },
        },
        students: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
            phone: true,
            district: true,
            isEmailVerified: true,
            createdAt: true,
            enrollments: {
              select: {
                id: true,
                status: true,
                createdAt: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!employee) {
      throw new AppError(httpStatus.NOT_FOUND, 'Employee not found');
    }

    return employee;
  }

  static async createEmployee(payload: {
    employeeId: string;
    name: string;
    email?: string;
    phone?: string;
    designation?: string;
    department?: string;
    status?: string;
    notes?: string;
  }) {
    const cleanEmployeeId = payload.employeeId.trim().toUpperCase();

    const existing = await prisma.employee.findUnique({
      where: { employeeId: cleanEmployeeId },
    });

    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        `এমপ্লয়ি আইডি "${cleanEmployeeId}" ইতোমধ্যে অন্য একজন এমপ্লয়ীর জন্য ব্যবহৃত হচ্ছে!`
      );
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId: cleanEmployeeId,
        name: payload.name.trim(),
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        designation: payload.designation?.trim() || 'Admission Advisor',
        department: payload.department?.trim() || 'Marketing & Admissions',
        status: payload.status || 'ACTIVE',
        notes: payload.notes?.trim() || null,
      },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    return employee;
  }

  static async updateEmployee(
    id: string,
    payload: {
      employeeId?: string;
      name?: string;
      email?: string;
      phone?: string;
      designation?: string;
      department?: string;
      status?: string;
      notes?: string;
    }
  ) {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Employee not found');
    }

    if (payload.employeeId && payload.employeeId.trim().toUpperCase() !== existing.employeeId) {
      const cleanNewId = payload.employeeId.trim().toUpperCase();
      const duplicate = await prisma.employee.findUnique({
        where: { employeeId: cleanNewId },
      });

      if (duplicate) {
        throw new AppError(
          httpStatus.CONFLICT,
          `এমপ্লয়ি আইডি "${cleanNewId}" ইতোমধ্যে ব্যবহৃত হচ্ছে!`
        );
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        employeeId: payload.employeeId ? payload.employeeId.trim().toUpperCase() : undefined,
        name: payload.name ? payload.name.trim() : undefined,
        email: payload.email !== undefined ? payload.email.trim() || null : undefined,
        phone: payload.phone !== undefined ? payload.phone.trim() || null : undefined,
        designation: payload.designation !== undefined ? payload.designation.trim() || null : undefined,
        department: payload.department !== undefined ? payload.department.trim() || null : undefined,
        status: payload.status !== undefined ? payload.status : undefined,
        notes: payload.notes !== undefined ? payload.notes.trim() || null : undefined,
      },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    return updated;
  }

  static async deleteEmployee(id: string) {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Employee not found');
    }

    await prisma.employee.delete({
      where: { id },
    });

    return { success: true, message: 'এমপ্লয়ি সফলভাবে মুছে ফেলা হয়েছে।' };
  }

  static async verifyEmployeeCode(code: string) {
    const cleanCode = code.trim().toUpperCase();
    const employee = await prisma.employee.findUnique({
      where: { employeeId: cleanCode },
      select: {
        id: true,
        employeeId: true,
        name: true,
        designation: true,
        department: true,
        status: true,
      },
    });

    if (!employee || employee.status !== 'ACTIVE') {
      return {
        valid: false,
        message: 'এমপ্লয়ি আইডি খুঁজে পাওয়া যায়নি বা এটি নিষ্ক্রিয় রয়েছে।',
      };
    }

    return {
      valid: true,
      employee,
    };
  }
}
