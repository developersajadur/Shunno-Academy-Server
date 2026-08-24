import { z } from 'zod';
import { EnrollmentStatus } from '@prisma/client';

export const createEnrollmentValidationSchema = z.object({
  body: z.object({
    courseId: z.string({ required_error: 'Course ID is required' }),
    studentName: z.string({ required_error: 'Student full name is required' }).min(3),
    studentPhone: z
      .string({ required_error: 'Student phone number is required' })
      .regex(/^01[3-9]\d{8}$/, 'Must be a valid 11-digit Bangladeshi mobile number'),
    studentEmail: z.string({ required_error: 'Student email is required' }).email(),
    district: z.string({ required_error: 'District is required' }),
    occupation: z.string({ required_error: 'Occupation is required' }),
    batchSchedule: z.string({ required_error: 'Batch schedule is required' }),
    paymentMethod: z.enum(['BKASH', 'NAGAD', 'ROCKET', 'UPAY', 'CARD', 'BANK_TRANSFER']).optional(),
    senderNumber: z.string().optional(),
    transactionId: z.string().optional(),
    paymentRemarks: z.string().optional(),
  }),
});

export const updateEnrollmentStatusValidationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(EnrollmentStatus),
    adminNotes: z.string().optional(),
  }),
});

