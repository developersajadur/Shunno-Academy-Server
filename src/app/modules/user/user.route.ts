import { Router } from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', auth(UserRole.ADMIN), UserController.getAllUsers);
router.get('/admin', auth(UserRole.ADMIN), UserController.getAllUsers);
router.get('/admin/all', auth(UserRole.ADMIN), UserController.getAllUsers);
router.get('/:id', auth(UserRole.ADMIN), UserController.getUserById);
router.patch('/:id/block-status', auth(UserRole.ADMIN), UserController.toggleBlockStatus);

export const userRoutes = router;
export default userRoutes;

