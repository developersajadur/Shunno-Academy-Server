import { Router } from 'express';
import { EnrollmentController } from './enrollment.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createEnrollmentValidationSchema, updateEnrollmentStatusValidationSchema } from './enrollment.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @openapi
 * /enrollments:
 *   post:
 *     summary: Step 1 - Submit student enrollment info & batch schedule
 *     tags: [Enrollments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, studentName, studentPhone, studentEmail, district, occupation, batchSchedule]
 *             properties:
 *               courseId: { type: string }
 *               studentName: { type: string, example: 'মোঃ সাজাদুর রহমান' }
 *               studentPhone: { type: string, example: '01700000000' }
 *               studentEmail: { type: string, example: 'student@example.com' }
 *               district: { type: string, example: 'ঢাকা' }
 *               occupation: { type: string, example: 'শিক্ষার্থী (Student)' }
 *               batchSchedule: { type: string, example: 'ব্যাচ ১: রাত ৯:০০ - ১১:০০ (শনি, সোম, বুধ)' }
 *     responses:
 *       201:
 *         description: Enrollment record created with unique Order ID
 */
router.post(
  '/',
  auth(UserRole.STUDENT, UserRole.ADMIN),
  validateRequest(createEnrollmentValidationSchema),
  EnrollmentController.createEnrollment
);

/**
 * @openapi
 * /enrollments/order/{orderId}:
 *   get:
 *     summary: Get enrollment status & details by Order ID
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, example: 'SA-2026-123456' }
 *     responses:
 *       200:
 *         description: Enrollment order details returned
 */
router.get('/order/:orderId', EnrollmentController.getEnrollmentByOrderId);

/**
 * @openapi
 * /enrollments/my:
 *   get:
 *     summary: Retrieve logged-in student enrollments
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user enrollments
 */
router.get('/my', auth(), EnrollmentController.getMyEnrollments);
router.get('/check/:courseId', auth(), EnrollmentController.checkEnrollmentStatus);

/**
 * @openapi
 * /enrollments/admin/all:
 *   get:
 *     summary: List all enrollments with filter & pagination (Admin only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, REJECTED, CANCELLED] }
 *       - in: query
 *         name: searchTerm
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Admin enrollments list returned
 */
router.get('/admin', auth(UserRole.ADMIN, UserRole.STAFF), EnrollmentController.getAllEnrollmentsAdmin);
router.get('/admin/all', auth(UserRole.ADMIN, UserRole.STAFF), EnrollmentController.getAllEnrollmentsAdmin);
router.get('/', auth(UserRole.ADMIN, UserRole.STAFF), EnrollmentController.getAllEnrollmentsAdmin);

/**
 * @openapi
 * /enrollments/{id}/status:
 *   patch:
 *     summary: Update enrollment status (Admin approve/reject)
 *     tags: [Enrollments]
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
 *               status: { type: string, enum: [PENDING, APPROVED, REJECTED, CANCELLED] }
 *               adminNotes: { type: string }
 *     responses:
 *       200:
 *         description: Enrollment status updated
 */
router.patch(
  '/:id/status',
  auth(UserRole.ADMIN, UserRole.STAFF),
  validateRequest(updateEnrollmentStatusValidationSchema),
  EnrollmentController.updateEnrollmentStatus
);

router.delete('/:id', auth(UserRole.ADMIN, UserRole.STAFF), EnrollmentController.deleteEnrollment);
router.delete('/admin/:id', auth(UserRole.ADMIN, UserRole.STAFF), EnrollmentController.deleteEnrollment);

export const enrollmentRoutes = router;
export default enrollmentRoutes;

