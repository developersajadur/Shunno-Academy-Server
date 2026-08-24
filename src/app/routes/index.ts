import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.route';
import { categoryRoutes } from '../modules/category/category.route';
import { courseRoutes } from '../modules/course/course.route';
import { mentorRoutes } from '../modules/mentor/mentor.route';
import { reviewRoutes } from '../modules/review/review.route';
import { enrollmentRoutes } from '../modules/enrollment/enrollment.route';
import { paymentRoutes } from '../modules/payment/payment.route';
import { inquiryRoutes } from '../modules/inquiry/inquiry.route';
import { statRoutes } from '../modules/stat/stat.route';
import { uploadRoutes } from '../modules/upload/upload.route';
import { userRoutes } from '../modules/user/user.route';
import { emailRoutes } from '../modules/email/email.route';
import { courseModuleRoutes } from '../modules/courseModule/courseModule.route';

const router = Router();

const moduleRoutes = [
  { path: '/auth', route: authRoutes },
  { path: '/users', route: userRoutes },
  { path: '/categories', route: categoryRoutes },
  { path: '/courses', route: courseRoutes },
  { path: '/course-modules', route: courseModuleRoutes },
  { path: '/mentors', route: mentorRoutes },
  { path: '/reviews', route: reviewRoutes },
  { path: '/enrollments', route: enrollmentRoutes },
  { path: '/payments', route: paymentRoutes },
  { path: '/inquiries', route: inquiryRoutes },
  { path: '/stats', route: statRoutes },
  { path: '/upload', route: uploadRoutes },
  { path: '/emails', route: emailRoutes },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
