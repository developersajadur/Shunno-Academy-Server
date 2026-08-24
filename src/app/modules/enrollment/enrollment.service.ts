import prisma from '../../helpers/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { EnrollmentStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { addEmailJob } from '../../queue/email.queue';
import { addEnrollmentJob } from '../../queue/enrollment.queue';
import { calculatePagination, IPaginationOptions } from '../../helpers/prismaQueryHelper';

interface CreateEnrollmentPayload {
  courseId: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  district: string;
  occupation: string;
  batchSchedule: string;
  paymentMethod?: PaymentMethod;
  senderNumber?: string;
  transactionId?: string;
  paymentRemarks?: string;
}

export class EnrollmentService {
  static async createEnrollment(userId: string | undefined, payload: CreateEnrollmentPayload) {
    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'কোর্সে ভর্তি হতে অনুগ্রহ করে আগে আপনার অ্যাকাউন্টে লগইন করুন।');
    }

    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { id: payload.courseId },
          { slug: payload.courseId },
        ],
      },
    });

    if (!course) {
      throw new AppError(httpStatus.NOT_FOUND, 'কোর্সটি খুঁজে পাওয়া যায়নি (Course not found)!');
    }

    if (course.isEnrollmentClosed) {
      throw new AppError(httpStatus.BAD_REQUEST, 'এই কোর্সে ভর্তি বর্তমানে বন্ধ রয়েছে (Admission Closed)!');
    }

    if (course.enrollmentDeadline && new Date(course.enrollmentDeadline).getTime() < Date.now()) {
      throw new AppError(httpStatus.BAD_REQUEST, 'এই ব্যাচে ভর্তির সময়সীমা সমাপ্ত হয়ে গেছে!');
    }

    // Check if user is already enrolled or has pending enrollment in this course
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: userId,
        courseId: course.id,
        status: {
          in: [EnrollmentStatus.APPROVED, EnrollmentStatus.PENDING],
        },
      },
      include: {
        payment: true,
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === EnrollmentStatus.APPROVED) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'আপনি ইতিমধ্যে এই কোর্সে ভর্তি হয়েছেন (Already Enrolled)! ড্যাশবোর্ডে গিয়ে ক্লাস অ্যাক্সেস করুন।'
        );
      }
      if (existingEnrollment.status === EnrollmentStatus.PENDING && existingEnrollment.payment) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'এই কোর্সে আপনার একটি এনরোলমেন্ট আবেদন ইতিমধ্যে প্রক্রিয়াধীন রয়েছে (Payment Verification Pending)।'
        );
      }
      // If pending without payment, clean it up
      if (!existingEnrollment.payment) {
        await prisma.enrollment.delete({
          where: { id: existingEnrollment.id },
        });
      }
    }

    // Check duplicate TrxID if provided
    if (payload.transactionId) {
      const existingTrx = await prisma.payment.findUnique({
        where: { transactionId: payload.transactionId },
      });
      if (existingTrx) {
        throw new AppError(
          httpStatus.CONFLICT,
          'এই Transaction ID (TrxID) টি ইতিমধ্যে ব্যবহার করা হয়েছে! অনুগ্রহ করে আপনার সঠিক TrxID দিন।'
        );
      }
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderId = `SA-2026-${randomSuffix}`;

    const enrollment = await prisma.$transaction(async (tx) => {
      const enr = await tx.enrollment.create({
        data: {
          orderId,
          studentId: userId,
          studentName: payload.studentName,
          studentPhone: payload.studentPhone,
          studentEmail: payload.studentEmail,
          district: payload.district,
          occupation: payload.occupation,
          batchSchedule: payload.batchSchedule,
          courseId: course.id,
          totalAmount: course.priceBDT,
          status: EnrollmentStatus.PENDING,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              priceBDT: true,
              mode: true,
            },
          },
        },
      });

      if (payload.paymentMethod && payload.senderNumber && payload.transactionId) {
        await tx.payment.create({
          data: {
            enrollmentId: enr.id,
            method: payload.paymentMethod,
            senderNumber: payload.senderNumber,
            transactionId: payload.transactionId,
            amount: course.priceBDT,
            status: PaymentStatus.PENDING,
            paymentRemarks: payload.paymentRemarks,
          },
        });
      }

      return enr;
    });

    if (payload.transactionId) {
      addEmailJob({
        to: enrollment.studentEmail,
        subject: `Payment Submitted for Order ${enrollment.orderId} - Shunno Academy`,
        template: 'PAYMENT_SUBMITTED',
        context: {
          name: enrollment.studentName,
          orderId: enrollment.orderId,
          trxId: payload.transactionId,
          amount: course.priceBDT,
        },
      }).catch(() => {});
    }

    return enrollment;
  }

  static async getEnrollmentByOrderId(orderId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { orderId },
      include: {
        course: true,
        payment: true,
      },
    });

    if (!enrollment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Enrollment order not found!');
    }

    return enrollment;
  }

  static async getMyEnrollments(userId: string) {
    return prisma.enrollment.findMany({
      where: {
        studentId: userId,
        // Only active/approved or pending verification enrollments
        // CANCELLED, SUSPENDED, REJECTED are strictly excluded from user view
        status: {
          in: [EnrollmentStatus.APPROVED, EnrollmentStatus.PENDING],
        },
        // Must have an associated payment record
        payment: {
          isNot: null,
        },
        course: {
          isPublished: true,
        },
      },
      include: {
        course: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async checkEnrollmentStatus(userId: string, courseId: string) {
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { slug: courseId }],
      },
    });

    if (!course) {
      return { isEnrolled: false, isPending: false, status: null, enrollment: null };
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: userId,
        courseId: course.id,
        status: {
          in: [EnrollmentStatus.APPROVED, EnrollmentStatus.PENDING],
        },
        payment: {
          isNot: null,
        },
      },
      include: {
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!enrollment) {
      return { isEnrolled: false, isPending: false, status: null, enrollment: null };
    }

    return {
      isEnrolled: enrollment.status === EnrollmentStatus.APPROVED,
      isPending: enrollment.status === EnrollmentStatus.PENDING,
      status: enrollment.status,
      enrollment: {
        id: enrollment.id,
        orderId: enrollment.orderId,
        status: enrollment.status,
        createdAt: enrollment.createdAt,
      },
    };
  }

  static async getAllEnrollmentsAdmin(
    filters: IPaginationOptions & { status?: EnrollmentStatus; searchTerm?: string }
  ) {
    const { status, searchTerm, ...paginationOptions } = filters;
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const andConditions: Prisma.EnrollmentWhereInput[] = [];

    if (status) {
      andConditions.push({ status });
    }

    if (searchTerm) {
      andConditions.push({
        OR: [
          { orderId: { contains: searchTerm, mode: 'insensitive' } },
          { studentName: { contains: searchTerm, mode: 'insensitive' } },
          { studentPhone: { contains: searchTerm, mode: 'insensitive' } },
          { studentEmail: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.EnrollmentWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          course: { select: { id: true, title: true, slug: true, priceBDT: true } },
          payment: true,
          student: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: enrollments,
    };
  }

  static async updateEnrollmentStatus(
    id: string,
    adminUserId: string,
    payload: { status: EnrollmentStatus; adminNotes?: string }
  ) {
    const existing = await prisma.enrollment.findUnique({
      where: { id },
      include: { course: true, payment: true },
    });

    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Enrollment record not found!');
    }

    const updated = await prisma.enrollment.update({
      where: { id },
      data: {
        status: payload.status,
        adminNotes: payload.adminNotes,
        approvedAt: payload.status === EnrollmentStatus.APPROVED ? new Date() : undefined,
        approvedById: payload.status === EnrollmentStatus.APPROVED ? adminUserId : undefined,
      },
      include: { course: true, payment: true },
    });

    // If approved, trigger background BullMQ worker
    if (payload.status === EnrollmentStatus.APPROVED) {
      addEnrollmentJob({
        enrollmentId: updated.id,
        courseId: updated.courseId,
        action: 'APPROVED',
      }).catch(() => {});

      addEmailJob({
        to: updated.studentEmail,
        subject: `ভর্তি অনুমোদন ও পেমেন্ট নিশ্চিতকরণ - ${updated.course.title}`,
        template: 'ENROLLMENT_APPROVED',
        context: {
          name: updated.studentName,
          orderId: updated.orderId,
          courseTitle: updated.course.title,
          batchSchedule: updated.batchSchedule,
        },
      }).catch(() => {});
    }

    return updated;
  }

  static async deleteEnrollment(id: string) {
    const existing = await prisma.enrollment.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Enrollment record not found!');
    }

    return prisma.$transaction(async (tx) => {
      // Delete associated payment if exists
      if (existing.payment) {
        await tx.payment.deleteMany({
          where: { enrollmentId: id },
        });
      }

      return tx.enrollment.delete({
        where: { id },
      });
    });
  }
}

