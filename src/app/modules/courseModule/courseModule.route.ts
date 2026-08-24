import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { auth, optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { CourseModuleController } from './courseModule.controller';
import {
  createModuleValidationSchema,
  updateModuleValidationSchema,
  createLectureValidationSchema,
  updateLectureValidationSchema,
} from './courseModule.validation';

const router = Router();

// Public / Student curriculum & classes route (with optional auth to check approved enrollment)
router.get('/course/:courseId', optionalAuth(), CourseModuleController.getModulesByCourseId);

// Admin Module routes
router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.STAFF),
  validateRequest(createModuleValidationSchema),
  CourseModuleController.createModule
);

router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.STAFF),
  validateRequest(updateModuleValidationSchema),
  CourseModuleController.updateModule
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.STAFF),
  CourseModuleController.deleteModule
);

// Admin Lecture / Class routes
router.post(
  '/lectures',
  auth(UserRole.ADMIN, UserRole.STAFF),
  validateRequest(createLectureValidationSchema),
  CourseModuleController.createLecture
);

router.patch(
  '/lectures/:id',
  auth(UserRole.ADMIN, UserRole.STAFF),
  validateRequest(updateLectureValidationSchema),
  CourseModuleController.updateLecture
);

router.delete(
  '/lectures/:id',
  auth(UserRole.ADMIN, UserRole.STAFF),
  CourseModuleController.deleteLecture
);

export const courseModuleRoutes = router;
export default courseModuleRoutes;
