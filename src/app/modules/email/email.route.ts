import { Router } from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';
import { EmailController } from './email.controller';
import { broadcastEmailValidationSchema, sendTestEmailValidationSchema } from './email.validation';

const router = Router();

/**
 * @openapi
 * /emails/broadcast:
 *   post:
 *     summary: Broadcast custom promotional email to users or course students
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/broadcast',
  auth(UserRole.ADMIN),
  validateRequest(broadcastEmailValidationSchema),
  EmailController.sendBroadcast
);

/**
 * @openapi
 * /emails/test:
 *   post:
 *     summary: Send test promotional email to verify layout
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/test',
  auth(UserRole.ADMIN),
  validateRequest(sendTestEmailValidationSchema),
  EmailController.sendTestEmail
);

/**
 * @openapi
 * /emails/campaigns:
 *   get:
 *     summary: Retrieve history of past email campaigns
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/campaigns',
  auth(UserRole.ADMIN),
  EmailController.getCampaignHistory
);

/**
 * @openapi
 * /emails/stats:
 *   get:
 *     summary: Retrieve email stats and total recipients reached
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/stats',
  auth(UserRole.ADMIN),
  EmailController.getEmailStats
);

export const emailRoutes = router;
export default emailRoutes;

