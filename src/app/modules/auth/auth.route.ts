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
  sendVerificationEmailValidationSchema,
  updateProfileValidationSchema,
  verifyEmailValidationSchema,
} from './auth.validation';
import auth from '../../middlewares/auth';

const router = Router();

/**
 * @openapi
 * /auth/google:
 *   post:
 *     summary: Google OAuth Login & Registration
 *     tags: [Auth]
 */
router.post('/google', validateRequest(googleLoginValidationSchema), AuthController.googleLogin);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new student
 *     tags: [Auth]
 */
router.post('/register', validateRequest(registerValidationSchema), AuthController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user & obtain JWT tokens
 *     tags: [Auth]
 */
router.post('/login', validateRequest(loginValidationSchema), AuthController.login);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 */
router.post('/forgot-password', validateRequest(forgotPasswordValidationSchema), AuthController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 */
router.post('/reset-password', validateRequest(resetPasswordValidationSchema), AuthController.resetPassword);

/**
 * @openapi
 * /auth/send-verification-email:
 *   post:
 *     summary: Send email verification link & OTP
 *     tags: [Auth]
 */
router.post(
  '/send-verification-email',
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
router.post('/verify-email', validateRequest(verifyEmailValidationSchema), AuthController.verifyEmail);

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Obtain new access token via refresh token
 *     tags: [Auth]
 */
router.post('/refresh-token', validateRequest(refreshTokenValidationSchema), AuthController.refreshToken);

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
