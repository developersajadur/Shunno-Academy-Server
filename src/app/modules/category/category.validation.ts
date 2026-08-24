import { z } from 'zod';

export const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    bengaliName: z.string({ required_error: 'Bengali name is required' }),
    slug: z.string({ required_error: 'Slug is required' }),
    icon: z.string().optional(),
    description: z.string().optional(),
    order: z.number().int().optional(),
  }),
});

export const updateCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    bengaliName: z.string().optional(),
    slug: z.string().optional(),
    icon: z.string().optional(),
    description: z.string().optional(),
    order: z.number().int().optional(),
  }),
});

