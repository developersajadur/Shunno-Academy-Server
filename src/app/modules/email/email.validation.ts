import { z } from 'zod';

export const broadcastEmailValidationSchema = z.object({
  body: z.object({
    subject: z.string({ required_error: 'ইমেইল বিষয় (Subject) আবশ্যক' }).min(3, 'বিষয় কমপক্ষে ৩ অক্ষরের হতে হবে'),
    preheader: z.string().optional(),
    heading: z.string({ required_error: 'ইমেইল হেডিং (Heading) আবশ্যক' }).min(3, 'হেডিং কমপক্ষে ৩ অক্ষরের হতে হবে'),
    body: z.string({ required_error: 'ইমেইল মূল বার্তা (Body) আবশ্যক' }).min(10, 'বার্তা কমপক্ষে ১০ অক্ষরের হতে হবে'),
    ctaButtonText: z.string().optional(),
    ctaButtonUrl: z.string().url('সঠিক URL প্রদান করুন').optional().or(z.literal('')),
    audienceType: z.enum(['ALL_USERS', 'COURSE_STUDENTS', 'CUSTOM_EMAILS'], {
      required_error: 'টার্গেট প্রাপক নির্বাচন করুন',
    }),
    targetCourseId: z.string().optional(),
    customEmails: z.array(z.string().email()).optional(),
  }),
});

export const sendTestEmailValidationSchema = z.object({
  body: z.object({
    testEmail: z.string().email('সঠিক টেস্ট ইমেইল দিন').optional(),
    subject: z.string({ required_error: 'বিষয় আবশ্যক' }).min(1),
    heading: z.string({ required_error: 'হেডিং আবশ্যক' }).min(1),
    body: z.string({ required_error: 'বার্তা আবশ্যক' }).min(1),
    ctaButtonText: z.string().optional(),
    ctaButtonUrl: z.string().optional(),
  }),
});

