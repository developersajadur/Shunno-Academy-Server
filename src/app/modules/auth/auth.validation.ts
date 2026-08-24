import { z } from 'zod';

export const registerValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
    email: z.string({ required_error: 'Email is required' }).email('Please provide a valid email address'),
    phone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, 'Must be a valid 11-digit Bangladeshi phone number (e.g. 01700000000)')
      .optional(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    district: z.string().optional(),
    occupation: z.string().optional(),
    turnstileToken: z.string().optional(),
  }),
});

export const loginValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Please provide a valid email address'),
    password: z.string({ required_error: 'Password is required' }),
    requiredRole: z.enum(['STUDENT', 'ADMIN', 'INSTRUCTOR']).optional(),
    turnstileToken: z.string().optional(),
  }),
});

export const forgotPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Please provide a valid email address'),
    turnstileToken: z.string().optional(),
  }),
});

export const resetPasswordValidationSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Reset token is required' }),
    newPassword: z.string({ required_error: 'New password is required' }).min(6, 'Password must be at least 6 characters'),
  }),
});

export const sendVerificationEmailValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address').optional(),
  }),
});

export const verifyEmailValidationSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Verification token or OTP code is required' }),
  }),
});

export const refreshTokenValidationSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }),
  }),
});

export const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z.string({ required_error: 'Current password is required' }),
    newPassword: z.string({ required_error: 'New password is required' }).min(6, 'New password must be at least 6 characters'),
  }),
});

export const updateProfileValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().regex(/^01[3-9]\d{8}$/).optional(),
    avatar: z.string().url().optional(),
    district: z.string().optional(),
    occupation: z.string().optional(),
  }),
});

export const googleLoginValidationSchema = z.object({
  body: z.object({
    credential: z.string().optional(),
    accessToken: z.string().optional(),
    userInfo: z
      .object({
        email: z.string().email(),
        name: z.string().optional(),
        avatar: z.string().optional(),
        googleId: z.string().optional(),
      })
      .optional(),
  }),
});
