import { Router } from 'express';
import { ReviewController } from './review.controller';
import validateRequest from '../../middlewares/validateRequest';
import { approveReviewValidationSchema, createReviewValidationSchema } from './review.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @openapi
 * /reviews:
 *   get:
 *     summary: Retrieve approved student reviews (Cached)
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reviews list returned
 */
router.get('/', ReviewController.getApprovedReviews);

/**
 * @openapi
 * /reviews/admin/all:
 *   get:
 *     summary: Retrieve all reviews including pending/unapproved (Admin only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All reviews returned
 */
router.get('/admin', auth(UserRole.ADMIN), ReviewController.getAllReviewsAdmin);
router.get('/admin/all', auth(UserRole.ADMIN), ReviewController.getAllReviewsAdmin);

/**
 * @openapi
 * /reviews:
 *   post:
 *     summary: Submit a new student review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentName, comment]
 *             properties:
 *               courseId: { type: string }
 *               studentName: { type: string }
 *               studentTitle: { type: string }
 *               rating: { type: integer, example: 5 }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Review submitted
 */
router.post('/', validateRequest(createReviewValidationSchema), ReviewController.createReview);

/**
 * @openapi
 * /reviews/{id}/approve:
 *   patch:
 *     summary: Approve or reject review (Admin only)
 *     tags: [Reviews]
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
 *             required: [isApproved]
 *             properties:
 *               isApproved: { type: boolean }
 *               isFeatured: { type: boolean }
 *     responses:
 *       200:
 *         description: Review approval updated
 */
router.patch(
  '/:id/approve',
  auth(UserRole.ADMIN),
  validateRequest(approveReviewValidationSchema),
  ReviewController.updateApproval
);

/**
 * @openapi
 * /reviews/{id}:
 *   delete:
 *     summary: Delete review (Admin only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete('/:id', auth(UserRole.ADMIN), ReviewController.deleteReview);

export const reviewRoutes = router;
export default reviewRoutes;

