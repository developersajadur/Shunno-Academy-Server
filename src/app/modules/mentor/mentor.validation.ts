import { z } from 'zod';

export const createMentorValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Mentor/Teacher name is required' }),
    englishName: z.string({ required_error: 'English name is required' }),
    email: z.string({ required_error: 'Teacher email is required' }).email('Invalid email address'),
    phone: z.string().optional().nullable(),
    designation: z.string({ required_error: 'Designation is required' }),
    specialization: z.string({ required_error: 'Specialization is required' }),
    avatar: z.string({ required_error: 'Avatar image URL is required' }),
    accentGradient: z.string().optional(),
    bio: z.string().optional().nullable(),
    experience: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    facebookUrl: z.string().url().optional().or(z.literal('')).nullable(),
    linkedinUrl: z.string().url().optional().or(z.literal('')).nullable(),
    githubUrl: z.string().url().optional().or(z.literal('')).nullable(),
    websiteUrl: z.string().url().optional().or(z.literal('')).nullable(),
    isFeatured: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

export const updateMentorValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    englishName: z.string().optional(),
    email: z.string().email('Invalid email address').optional().nullable(),
    phone: z.string().optional().nullable(),
    designation: z.string().optional(),
    specialization: z.string().optional(),
    avatar: z.string().optional(),
    accentGradient: z.string().optional(),
    bio: z.string().optional().nullable(),
    experience: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    facebookUrl: z.string().url().optional().or(z.literal('')).nullable(),
    linkedinUrl: z.string().url().optional().or(z.literal('')).nullable(),
    githubUrl: z.string().url().optional().or(z.literal('')).nullable(),
    websiteUrl: z.string().url().optional().or(z.literal('')).nullable(),
    isFeatured: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

