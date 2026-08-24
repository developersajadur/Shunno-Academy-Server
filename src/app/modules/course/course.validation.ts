import { z } from 'zod';
import { CourseLevel, CourseMode } from '@prisma/client';

export const createCourseValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Course title is required' }),
    bengaliTitle: z.string().optional(),
    slug: z.string({ required_error: 'Slug is required' }),
    categoryId: z.string({ required_error: 'Category ID is required' }),
    mode: z.nativeEnum(CourseMode).default(CourseMode.Online),
    priceBDT: z.number({ required_error: 'Price in BDT is required' }).nonnegative(),
    originalPriceBDT: z.number().nonnegative().optional(),
    thumbnail: z.string({ required_error: 'Thumbnail image URL is required' }),
    introVideoUrl: z.string().optional().nullable(),
    liveClassUrl: z.string().optional().nullable(),
    liveClassSchedule: z.string().optional().nullable(),
    isLiveClassActive: z.boolean().default(false).optional(),
    accentColor: z.string().optional(),
    mentorId: z.string().optional(),
    duration: z.string({ required_error: 'Duration is required' }),
    totalLectures: z.number().int().optional(),
    badge: z.string().optional(),
    level: z.nativeEnum(CourseLevel).default(CourseLevel.ALL_LEVELS),
    language: z.string().default('বাংলা'),
    enrollmentDeadline: z.string().datetime().optional(),
    isEnrollmentClosed: z.boolean().optional(),
    isPublished: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    overview: z.string({ required_error: 'Overview is required' }),
    learningOutcomes: z.array(z.string()).default([]),
    requirements: z.array(z.string()).default([]),
    targetAudience: z.array(z.string()).default([]),
    faqs: z.any().optional(),
    modules: z
      .array(
        z.object({
          moduleNumber: z.number().int(),
          title: z.string(),
          description: z.string().optional(),
          lectures: z
            .array(
              z.object({
                title: z.string(),
                duration: z.string().optional(),
                videoUrl: z.string().optional(),
                isPreview: z.boolean().default(false),
              })
            )
            .optional(),
        })
      )
      .optional(),
  }),
});

export const updateCourseValidationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    bengaliTitle: z.string().optional(),
    slug: z.string().optional(),
    categoryId: z.string().optional(),
    mode: z.nativeEnum(CourseMode).optional(),
    priceBDT: z.number().nonnegative().optional(),
    originalPriceBDT: z.number().nonnegative().optional(),
    thumbnail: z.string().optional(),
    introVideoUrl: z.string().optional().nullable(),
    liveClassUrl: z.string().optional().nullable(),
    liveClassSchedule: z.string().optional().nullable(),
    isLiveClassActive: z.boolean().optional(),
    accentColor: z.string().optional(),
    mentorId: z.string().optional(),
    duration: z.string().optional(),
    totalLectures: z.number().int().optional(),
    badge: z.string().optional(),
    level: z.nativeEnum(CourseLevel).optional(),
    language: z.string().optional(),
    enrollmentDeadline: z.string().datetime().optional(),
    isEnrollmentClosed: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    overview: z.string().optional(),
    learningOutcomes: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    targetAudience: z.array(z.string()).optional(),
    faqs: z.any().optional(),
  }),
});

