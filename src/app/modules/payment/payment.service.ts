import prisma from '../../helpers/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { EnrollmentStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { addEmailJob } from '../../queue/email.queue';
import { addEnrollmentJob } from '../../queue/enrollment.queue';
import { calculatePagination, IPaginationOptions } from '../../helpers/prismaQueryHelper';

interface SubmitTrxPayload {
  enrollmentId: string;
  method: PaymentMethod;
  senderNumber: string;
  transactionId: string;
  amount: number;
  bankName?: string;
  accountNumber?: string;
  paymentRemarks?: string;
  receiptUrl?: string;
}

export class PaymentService {
  static async submitTrx(payload: SubmitTrxPayload) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: payload.enrollmentId },
      include: { course: true },
    });

    if (!enrollment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Enrollment order record not found!');
    }

    // Check if duplicate TrxID
    const existingTrx = await prisma.payment.findUnique({
      where: { transactionId: payload.transactionId },
    });

    if (existingTrx) {
      throw new AppError(
        httpStatus.CONFLICT,
        'This Transaction ID (TrxID) has already been submitted! If this is an error, please contact helpline.'
      );
    }

    const payment = await prisma.payment.create({
      data: {
        enrollmentId: enrollment.id,
        method: payload.method,
        senderNumber: payload.senderNumber,
        transactionId: payload.transactionId,
        amount: payload.amount,
        status: PaymentStatus.PENDING,
        bankName: payload.bankName,
        accountNumber: payload.accountNumber,
        paymentRemarks: payload.paymentRemarks,
        receiptUrl: payload.receiptUrl,
      },
      include: {
        enrollment: {
          include: { course: true },
        },
      },
    });

    // Notify student via BullMQ email
    addEmailJob({
      to: enrollment.studentEmail,
      subject: `Payment Submitted for Order ${enrollment.orderId} - Shunno Academy`,
      template: 'PAYMENT_SUBMITTED',
      context: {
        name: enrollment.studentName,
        orderId: enrollment.orderId,
        trxId: payload.transactionId,
        amount: payload.amount,
      },
    }).catch(() => {});

    return payment;
  }

  static async getAllPaymentsAdmin(
    filters: IPaginationOptions & { status?: PaymentStatus; method?: PaymentMethod; searchTerm?: string }
  ) {
    const { status, method, searchTerm, ...paginationOptions } = filters;
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const andConditions: Prisma.PaymentWhereInput[] = [];

    if (status) {
      andConditions.push({ status });
    }

    if (method) {
      andConditions.push({ method });
    }

    if (searchTerm) {
      andConditions.push({
        OR: [
          { transactionId: { contains: searchTerm, mode: 'insensitive' } },
          { senderNumber: { contains: searchTerm, mode: 'insensitive' } },
          { enrollment: { orderId: { contains: searchTerm, mode: 'insensitive' } } },
          { enrollment: { studentName: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      });
    }

    const where: Prisma.PaymentWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          enrollment: {
            include: {
              course: { select: { id: true, title: true, slug: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: payments,
    };
  }

  static async verifyPaymentAdmin(
    id: string,
    adminUserId: string,
    payload: { status: PaymentStatus; paymentRemarks?: string }
  ) {
    const existing = await prisma.payment.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: { course: true },
        },
      },
    });

    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payment record not found!');
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: payload.status,
        paymentRemarks: payload.paymentRemarks,
        verifiedAt: payload.status === PaymentStatus.VERIFIED ? new Date() : undefined,
        verifiedById: payload.status === PaymentStatus.VERIFIED ? adminUserId : undefined,
      },
      include: {
        enrollment: {
          include: { course: true },
        },
      },
    });

    // If verified, automatically approve the enrollment as well
    if (payload.status === PaymentStatus.VERIFIED) {
      await prisma.enrollment.update({
        where: { id: existing.enrollmentId },
        data: {
          status: EnrollmentStatus.APPROVED,
          approvedAt: new Date(),
          approvedById: adminUserId,
        },
      });

      addEnrollmentJob({
        enrollmentId: existing.enrollmentId,
        courseId: existing.enrollment.courseId,
        action: 'APPROVED',
      }).catch(() => {});

      addEmailJob({
        to: existing.enrollment.studentEmail,
        subject: `ভর্তি অনুমোদন ও পেমেন্ট নিশ্চিতকরণ - ${existing.enrollment.course.title}`,
        template: 'ENROLLMENT_APPROVED',
        context: {
          name: existing.enrollment.studentName,
          orderId: existing.enrollment.orderId,
          courseTitle: existing.enrollment.course.title,
          batchSchedule: existing.enrollment.batchSchedule,
        },
      }).catch(() => {});
    }

    return updatedPayment;
  }
}

