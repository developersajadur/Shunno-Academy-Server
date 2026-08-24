import { Router } from 'express';
import { AuthController } from './auth.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  googleLoginValidationSchema,
  loginValidationSchema,
  refreshTokenValidationSchema,
  registerValidationSchema,
  resetPasswordValidationSchema,
  sendRegistrationOtpValidationSchema,
  sendVerificationEmailValidationSchema,
  updateProfileValidationSchema,
  verifyEmailValidationSchema,
  verifyRegistrationOtpValidationSchema,
} from './auth.validation';
import auth from '../../middlewares/auth';
import { authLimiter, otpAndResetPasswordLimiter } from '../../middlewares/rateLimiter';

const router = Router();

/**
 * @openapi
 * /auth/google:
 *   post:
 *     summary: Google OAuth Login & Registration
 *     tags: [Auth]
 */
router.post(
  '/google',
  authLimiter,
  validateRequest(googleLoginValidationSchema),
  AuthController.googleLogin
);

/**
 * @openapi
 * /auth/send-registration-otp:
 *   post:
 *     summary: Send 6-Digit Email Verification OTP for Student Registration
 *     tags: [Auth]
 */
router.post(
  '/send-registration-otp',
  otpAndResetPasswordLimiter,
  validateRequest(sendRegistrationOtpValidationSchema),
  AuthController.sendRegistrationOtp
);

/**
 * @openapi
 * /auth/verify-registration-otp:
 *   post:
 *     summary: Verify 6-Digit Email OTP for Student Registration
 *     tags: [Auth]
 */
router.post(
  '/verify-registration-otp',
  otpAndResetPasswordLimiter,
  validateRequest(verifyRegistrationOtpValidationSchema),
  AuthController.verifyRegistrationOtp
);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new student after email OTP verification
 *     tags: [Auth]
 */
router.post('/register', authLimiter, validateRequest(registerValidationSchema), AuthController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user & obtain JWT tokens
 *     tags: [Auth]
 */
router.post('/login', authLimiter, validateRequest(loginValidationSchema), AuthController.login);

/**
 * @openapi
 * /auth/teacher-login:
 *   post:
 *     summary: Dedicated secure portal login for Teachers & Instructors
 *     tags: [Auth]
 */
router.post(
  '/teacher-login',
  authLimiter,
  validateRequest(loginValidationSchema),
  AuthController.teacherLogin
);

/**
 * @openapi
 * /auth/admin-login:
 *   post:
 *     summary: Dedicated secure portal login for Admins & Staff
 *     tags: [Auth]
 */
router.post(
  '/admin-login',
  authLimiter,
  validateRequest(loginValidationSchema),
  AuthController.adminLogin
);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 */
router.post(
  '/forgot-password',
  otpAndResetPasswordLimiter,
  validateRequest(forgotPasswordValidationSchema),
  AuthController.forgotPassword
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 */
router.post(
  '/reset-password',
  otpAndResetPasswordLimiter,
  validateRequest(resetPasswordValidationSchema),
  AuthController.resetPassword
);

/**
 * @openapi
 * /auth/send-verification-email:
 *   post:
 *     summary: Send email verification link & OTP
 *     tags: [Auth]
 */
router.post(
  '/send-verification-email',
  otpAndResetPasswordLimiter,
  validateRequest(sendVerificationEmailValidationSchema),
  AuthController.sendVerificationEmail
);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address with token or OTP
 *     tags: [Auth]
 */
router.post(
  '/verify-email',
  otpAndResetPasswordLimiter,
  validateRequest(verifyEmailValidationSchema),
  AuthController.verifyEmail
);

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Obtain new access token via refresh token
 *     tags: [Auth]
 */
router.post(
  '/refresh-token',
  authLimiter,
  validateRequest(refreshTokenValidationSchema),
  AuthController.refreshToken
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Retrieve currently authenticated user profile
 *     tags: [Auth]
 */
router.get('/me', auth(), AuthController.getMe);

/**
 * @openapi
 * /auth/update-profile:
 *   patch:
 *     summary: Update profile info
 *     tags: [Auth]
 */
router.patch('/update-profile', auth(), validateRequest(updateProfileValidationSchema), AuthController.updateProfile);

/**
 * @openapi
 * /auth/change-password:
 *   patch:
 *     summary: Change user password
 *     tags: [Auth]
 */
router.patch('/change-password', auth(), validateRequest(changePasswordValidationSchema), AuthController.changePassword);

export const authRoutes = router;
export default authRoutes;
