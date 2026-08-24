import { Router } from 'express';
import { MentorController } from './mentor.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createMentorValidationSchema, updateMentorValidationSchema } from './mentor.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * @openapi
 * /mentors:
 *   get:
 *     summary: Get all mentors (Cached)
 *     tags: [Mentors]
 *     responses:
 *       200:
 *         description: Mentors list returned
 */
router.get('/', MentorController.getAll);

/**
 * @openapi
 * /mentors/{id}:
 *   get:
 *     summary: Get mentor profile by ID
 *     tags: [Mentors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mentor details returned
 */
router.get('/:id', MentorController.getById);

/**
 * @openapi
 * /mentors:
 *   post:
 *     summary: Create mentor profile (Admin only)
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, englishName, designation, specialization, avatar]
 *             properties:
 *               name: { type: string }
 *               englishName: { type: string }
 *               designation: { type: string }
 *               specialization: { type: string }
 *               avatar: { type: string }
 *     responses:
 *       201:
 *         description: Mentor created
 */
router.post(
  '/',
  auth(UserRole.ADMIN),
  validateRequest(createMentorValidationSchema),
  MentorController.create
);

/**
 * @openapi
 * /mentors/{id}:
 *   patch:
 *     summary: Update mentor profile (Admin only)
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mentor updated
 */
router.patch(
  '/:id',
  auth(UserRole.ADMIN),
  validateRequest(updateMentorValidationSchema),
  MentorController.update
);

/**
 * @openapi
 * /mentors/{id}:
 *   delete:
 *     summary: Delete mentor profile (Admin only)
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mentor deleted
 */
router.delete('/:id', auth(UserRole.ADMIN), MentorController.delete);

export const mentorRoutes = router;
export default mentorRoutes;

