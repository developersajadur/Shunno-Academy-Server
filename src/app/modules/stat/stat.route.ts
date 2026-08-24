import { Router } from 'express';
import { StatController } from './stat.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', StatController.getPlatformStats);
router.get('/analytics', auth(UserRole.ADMIN), StatController.getAdminAnalytics);

export const statRoutes = router;
export default statRoutes;
