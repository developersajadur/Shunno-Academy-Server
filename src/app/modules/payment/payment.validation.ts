import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export const submitPaymentTrxValidationSchema = z.object({
  body: z.object({
    enrollmentId: z.string({ required_error: 'Enrollment ID is required' }),
    method: z.nativeEnum(PaymentMethod, { required_error: 'Payment method is required' }),
    senderNumber: z
      .string({ required_error: 'Sender mobile number or account number is required' })
      .min(4),
    transactionId: z
      .string({ required_error: 'Transaction ID (TrxID) is required' })
      .min(4, 'TrxID must be at least 4 characters')
      .trim(),
    amount: z.number({ required_error: 'Paid amount is required' }).positive(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    paymentRemarks: z.string().optional(),
    receiptUrl: z.string().url().optional().or(z.literal('')),
  }),
});

export const verifyPaymentValidationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(PaymentStatus, { required_error: 'Payment status is required' }),
    paymentRemarks: z.string().optional(),
  }),
});

