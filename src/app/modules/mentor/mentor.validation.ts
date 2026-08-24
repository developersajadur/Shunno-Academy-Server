import { z } from 'zod';

export const createMentorValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Mentor name is required' }),
    englishName: z.string({ required_error: 'English name is required' }),
    designation: z.string({ required_error: 'Designation is required' }),
    specialization: z.string({ required_error: 'Specialization is required' }),
    avatar: z.string({ required_error: 'Avatar image URL is required' }),
    accentGradient: z.string().optional(),
    bio: z.string().optional(),
    experience: z.string().optional(),
    category: z.string().optional(),
    facebookUrl: z.string().url().optional().or(z.literal('')),
    linkedinUrl: z.string().url().optional().or(z.literal('')),
    githubUrl: z.string().url().optional().or(z.literal('')),
    websiteUrl: z.string().url().optional().or(z.literal('')),
    isFeatured: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

export const updateMentorValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    englishName: z.string().optional(),
    designation: z.string().optional(),
    specialization: z.string().optional(),
    avatar: z.string().optional(),
    accentGradient: z.string().optional(),
    bio: z.string().optional(),
    experience: z.string().optional(),
    category: z.string().optional(),
    facebookUrl: z.string().url().optional().or(z.literal('')),
    linkedinUrl: z.string().url().optional().or(z.literal('')),
    githubUrl: z.string().url().optional().or(z.literal('')),
    websiteUrl: z.string().url().optional().or(z.literal('')),
    isFeatured: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

