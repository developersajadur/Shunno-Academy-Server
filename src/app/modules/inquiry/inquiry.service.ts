import prisma from '../../helpers/prisma';
import { InquiryStatus, Prisma } from '@prisma/client';
import { calculatePagination, IPaginationOptions } from '../../helpers/prismaQueryHelper';
import { addEmailJob } from '../../queue/email.queue';

interface CreateInquiryPayload {
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  interestedCourseId?: string;
}

export class InquiryService {
  static async createInquiry(userId: string | undefined, payload: CreateInquiryPayload) {
    const inquiry = await prisma.inquiry.create({
      data: {
        ...payload,
        userId: userId || undefined,
      },
    });

    addEmailJob({
      to: payload.email,
      subject: 'Thank you for reaching out to Shunno Academy',
      template: 'INQUIRY_RECEIVED',
      context: { name: payload.fullName, subject: payload.subject },
    }).catch(() => {});

    return inquiry;
  }

  static async getAllInquiriesAdmin(
    filters: IPaginationOptions & { status?: InquiryStatus; searchTerm?: string }
  ) {
    const { status, searchTerm, ...paginationOptions } = filters;
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const andConditions: Prisma.InquiryWhereInput[] = [];

    if (status) {
      andConditions.push({ status });
    }

    if (searchTerm) {
      andConditions.push({
        OR: [
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { subject: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.InquiryWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.inquiry.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: inquiries,
    };
  }

  static async updateInquiryStatus(id: string, status: InquiryStatus) {
    return prisma.inquiry.update({
      where: { id },
      data: { status },
    });
  }

  static async deleteInquiry(id: string) {
    return prisma.inquiry.delete({
      where: { id },
    });
  }
}

