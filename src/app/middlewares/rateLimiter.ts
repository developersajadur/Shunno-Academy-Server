import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response } from 'express';

const createCustomRateLimiter = (options: Partial<Options> & { customMessage?: string }) => {
  const { customMessage, ...restOptions } = options;

  return rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const message =
        customMessage || 'Too many requests from this IP. Please try again after a few moments.';
      res.status(429).json({
        success: false,
        statusCode: 429,
        message,
        errorSources: [
          {
            path: req.originalUrl || '',
            message,
          },
        ],
        timestamp: new Date().toISOString(),
      });
    },
    ...restOptions,
  });
};

/**
 * 1. Global Rate Limiter: General API protection
 * Allows 500 requests per 15 minutes per IP
 */
export const globalLimiter = createCustomRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  customMessage: 'Too many requests sent to the server. Please try again in a few minutes.',
  skip: (req: Request) => {
    // Skip health check, swagger docs, and root status
    const path = req.originalUrl || req.path || '';
    return (
      path === '/' ||
      path.startsWith('/api/v1/health') ||
      path.startsWith('/api/docs') ||
      req.method === 'OPTIONS'
    );
  },
});

/**
 * 2. Auth Limiter: Protects login, registration, and Google OAuth endpoints
 * Allows 20 requests per 15 minutes per IP
 */
export const authLimiter = createCustomRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  customMessage: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
});

/**
 * 3. OTP & Password Reset Limiter: Extra strict limiter for OTP requests and password recovery
 * Allows 8 requests per 15 minutes per IP
 */
export const otpAndResetPasswordLimiter = createCustomRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8,
  customMessage:
    'Too many verification or password reset attempts. Please wait 15 minutes before requesting a new OTP/link.',
});

/**
 * 4. Upload Limiter: Protects Cloudinary/storage file uploads
 * Allows 30 uploads per 15 minutes per IP
 */
export const uploadLimiter = createCustomRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  customMessage: 'Upload rate limit exceeded. Please wait a few moments before uploading more files.',
});

/**
 * 5. Inquiry Limiter: Prevents contact form spamming
 * Allows 10 inquiries per 15 minutes per IP
 */
export const inquiryLimiter = createCustomRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  customMessage: 'Too many inquiries submitted. Please wait before submitting another message.',
});

// Backward compatibility aliases
export const loginLimiter = authLimiter;
export const appLimiter = globalLimiter;
