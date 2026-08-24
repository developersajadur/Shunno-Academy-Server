import { Router } from 'express';
import { CourseController } from './course.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createCourseValidationSchema, updateCourseValidationSchema } from './course.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', CourseController.getAllCourses);
router.get('/:slug', CourseController.getCourseBySlug);
router.post(
  '/',
  auth(UserRole.ADMIN),
  validateRequest(createCourseValidationSchema),
  CourseController.createCourse
);
router.patch(
  '/:id',
  auth(UserRole.ADMIN),
  validateRequest(updateCourseValidationSchema),
  CourseController.updateCourse
);
router.delete('/:id', auth(UserRole.ADMIN), CourseController.deleteCourse);

export const courseRoutes = router;
export default courseRoutes;

