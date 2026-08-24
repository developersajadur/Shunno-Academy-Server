import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  createEmployeeValidationSchema,
  updateEmployeeValidationSchema,
} from './employee.validation';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Public route for registration form to verify employee code
router.get('/verify/:code', EmployeeController.verifyEmployeeCode);

// Admin-protected routes
router.get(
  '/',
  auth(UserRole.ADMIN),
  EmployeeController.getAllEmployees
);

router.get(
  '/:id',
  auth(UserRole.ADMIN),
  EmployeeController.getEmployeeById
);

router.post(
  '/',
  auth(UserRole.ADMIN),
  validateRequest(createEmployeeValidationSchema),
  EmployeeController.createEmployee
);

router.patch(
  '/:id',
  auth(UserRole.ADMIN),
  validateRequest(updateEmployeeValidationSchema),
  EmployeeController.updateEmployee
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN),
  EmployeeController.deleteEmployee
);

export const EmployeeRoutes = router;

