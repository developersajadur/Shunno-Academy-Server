import { Router } from 'express';
import { CategoryController } from './category.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createCategoryValidationSchema, updateCategoryValidationSchema } from './category.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', CategoryController.getAll);
router.get('/:slug', CategoryController.getBySlug);
router.post(
  '/',
  auth(UserRole.ADMIN),
  validateRequest(createCategoryValidationSchema),
  CategoryController.create
);
router.patch(
  '/:id',
  auth(UserRole.ADMIN),
  validateRequest(updateCategoryValidationSchema),
  CategoryController.update
);
router.delete('/:id', auth(UserRole.ADMIN), CategoryController.delete);

export const categoryRoutes = router;
export default categoryRoutes;

