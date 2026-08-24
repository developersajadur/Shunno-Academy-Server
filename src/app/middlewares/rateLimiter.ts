import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 3, // limit each IP to 3 requests per window
  message: 'Too many requests from this IP, please try again after 30 seconds',
});

export const appLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 15, // max 15 requests per window per IP
  message: 'Too many requests from this IP, please try again after 30 seconds',
});
