import { Router } from 'express';
import { PaymentController } from './payment.controller';
import validateRequest from '../../middlewares/validateRequest';
import { submitPaymentTrxValidationSchema, verifyPaymentValidationSchema } from './payment.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @openapi
 * /payments/submit-trx:
 *   post:
 *     summary: Step 2 - Submit manual payment Transaction ID (bKash, Nagad, Rocket, Upay, Bank)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enrollmentId, method, senderNumber, transactionId, amount]
 *             properties:
 *               enrollmentId: { type: string }
 *               method: { type: string, enum: [BKASH, NAGAD, ROCKET, UPAY, CARD, BANK_TRANSFER] }
 *               senderNumber: { type: string, example: '01700000000' }
 *               transactionId: { type: string, example: 'BLA849204A' }
 *               amount: { type: number, example: 25000 }
 *               bankName: { type: string }
 *               accountNumber: { type: string }
 *               paymentRemarks: { type: string }
 *     responses:
 *       201:
 *         description: Payment TrxID submitted for admin review
 */
router.post(
  '/submit-trx',
  auth(UserRole.STUDENT, UserRole.ADMIN),
  validateRequest(submitPaymentTrxValidationSchema),
  PaymentController.submitTrx
);

/**
 * @openapi
 * /payments/admin/all:
 *   get:
 *     summary: Get all payments list with filters (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, VERIFIED, FAILED, REFUNDED] }
 *       - in: query
 *         name: method
 *         schema: { type: string, enum: [BKASH, NAGAD, ROCKET, UPAY, CARD, BANK_TRANSFER] }
 *       - in: query
 *         name: searchTerm
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payments list returned
 */
router.get('/admin', auth(UserRole.ADMIN, UserRole.STAFF), PaymentController.getAllPaymentsAdmin);
router.get('/admin/all', auth(UserRole.ADMIN, UserRole.STAFF), PaymentController.getAllPaymentsAdmin);
router.get('/', auth(UserRole.ADMIN, UserRole.STAFF), PaymentController.getAllPaymentsAdmin);

/**
 * @openapi
 * /payments/{id}/verify:
 *   patch:
 *     summary: Verify & approve payment TrxID (Admin only)
 *     tags: [Payments]
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
 *               status: { type: string, enum: [PENDING, VERIFIED, FAILED, REFUNDED] }
 *               paymentRemarks: { type: string }
 *     responses:
 *       200:
 *         description: Payment verified and enrollment approved
 */
router.patch(
  '/:id/verify',
  auth(UserRole.ADMIN, UserRole.STAFF),
  validateRequest(verifyPaymentValidationSchema),
  PaymentController.verifyPaymentAdmin
);

export const paymentRoutes = router;
export default paymentRoutes;

