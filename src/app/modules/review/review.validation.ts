import { z } from 'zod';

export const createReviewValidationSchema = z.object({
  body: z.object({
    courseId: z.string().optional(),
    studentName: z.string({ required_error: 'Student name is required' }),
    studentTitle: z.string().optional(),
    studentAvatar: z.string().optional(),
    rating: z.number().int().min(1).max(5).default(5),
    comment: z.string({ required_error: 'Review comment is required' }),
    date: z.string().optional(),
  }),
});

export const approveReviewValidationSchema = z.object({
  body: z.object({
    isApproved: z.boolean({ required_error: 'isApproved status is required' }),
    isFeatured: z.boolean().optional(),
  }),
});

