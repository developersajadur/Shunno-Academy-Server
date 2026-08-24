import { z } from 'zod';

export const createModuleValidationSchema = z.object({
  body: z.object({
    courseId: z.string({ required_error: 'Course ID is required' }),
    moduleNumber: z.number({ required_error: 'Module number is required' }).int().positive(),
    title: z.string({ required_error: 'Module title is required' }).min(2),
    description: z.string().optional(),
    order: z.number().int().optional(),
  }),
});

export const updateModuleValidationSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    moduleNumber: z.number().int().positive().optional(),
    description: z.string().optional(),
    order: z.number().int().optional(),
  }),
});

export const createLectureValidationSchema = z.object({
  body: z.object({
    moduleId: z.string({ required_error: 'Module ID is required' }),
    title: z.string({ required_error: 'Lecture title is required' }).min(2),
    duration: z.string().optional(),
    videoUrl: z.string({ required_error: 'Video URL (YouTube) is required' }).min(5),
    notes: z.string().optional().nullable(),
    isPreview: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

export const updateLectureValidationSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    duration: z.string().optional(),
    videoUrl: z.string().min(5).optional(),
    notes: z.string().optional().nullable(),
    isPreview: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});
