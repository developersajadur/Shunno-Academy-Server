import { Router } from 'express';
import { InquiryController } from './inquiry.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createInquiryValidationSchema, updateInquiryStatusValidationSchema } from './inquiry.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { inquiryLimiter } from '../../middlewares/rateLimiter';

const router = Router();

/**
 * @openapi
 * /inquiries:
 *   post:
 *     summary: Submit public contact form / course counseling inquiry
 *     tags: [Inquiries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phone, email, subject, message]
 *             properties:
 *               fullName: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               subject: { type: string }
 *               message: { type: string }
 *               interestedCourseId: { type: string }
 *     responses:
 *       201:
 *         description: Inquiry received
 */
router.post(
  '/',
  inquiryLimiter,
  validateRequest(createInquiryValidationSchema),
  InquiryController.createInquiry
);

/**
 * @openapi
 * /inquiries/admin/all:
 *   get:
 *     summary: Get all contact inquiries with status filter (Admin only)
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [UNREAD, READ, CONTACTED, RESOLVED] }
 *     responses:
 *       200:
 *         description: Inquiries list returned
 */
router.get('/admin', auth(UserRole.ADMIN, UserRole.STAFF), InquiryController.getAllInquiriesAdmin);
router.get('/admin/all', auth(UserRole.ADMIN, UserRole.STAFF), InquiryController.getAllInquiriesAdmin);

/**
 * @openapi
 * /inquiries/{id}/status:
 *   patch:
 *     summary: Update inquiry status (Admin only)
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [UNREAD, READ, CONTACTED, RESOLVED] }
 *     responses:
 *       200:
 *         description: Inquiry status updated
 */
router.patch(
  '/:id/status',
  auth(UserRole.ADMIN, UserRole.STAFF),
  validateRequest(updateInquiryStatusValidationSchema),
  InquiryController.updateInquiryStatus
);

/**
 * @openapi
 * /inquiries/{id}:
 *   delete:
 *     summary: Delete inquiry (Admin only)
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Inquiry deleted
 */
router.delete('/:id', auth(UserRole.ADMIN), InquiryController.deleteInquiry);

export const inquiryRoutes = router;
export default inquiryRoutes;

