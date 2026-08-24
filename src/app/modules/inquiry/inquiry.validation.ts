import { z } from 'zod';
import { InquiryStatus } from '@prisma/client';

export const createInquiryValidationSchema = z.object({
  body: z.object({
    fullName: z.string({ required_error: 'Full name is required' }).min(2),
    phone: z.string({ required_error: 'Phone number is required' }).regex(/^01[3-9]\d{8}$/),
    email: z.string({ required_error: 'Email is required' }).email(),
    subject: z.string({ required_error: 'Subject is required' }),
    message: z.string({ required_error: 'Message is required' }).min(5),
    interestedCourseId: z.string().optional(),
  }),
});

export const updateInquiryStatusValidationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(InquiryStatus),
  }),
});

