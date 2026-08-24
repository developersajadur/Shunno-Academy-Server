import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { EnrollmentService } from './enrollment.service';

export class EnrollmentController {
  static createEnrollment = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await EnrollmentService.createEnrollment(userId, req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Enrollment initiated successfully',
      data: result,
    });
  });

  static getEnrollmentByOrderId = catchAsync(async (req: Request, res: Response) => {
    const orderId = req.params.orderId as string;
    const result = await EnrollmentService.getEnrollmentByOrderId(orderId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Enrollment order details retrieved',
      data: result,
    });
  });

  static getMyEnrollments = catchAsync(async (req: Request, res: Response) => {
    const result = await EnrollmentService.getMyEnrollments(req.user!.userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Your enrollments fetched successfully',
      data: result,
    });
  });

  static checkEnrollmentStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const courseId = req.params.courseId as string;
    const result = await EnrollmentService.checkEnrollmentStatus(userId, courseId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Enrollment status retrieved',
      data: result,
    });
  });

  static getAllEnrollmentsAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await EnrollmentService.getAllEnrollmentsAdmin(req.query as any);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'All enrollments fetched successfully',
      meta: result.meta,
      data: result.data,
    });
  });

  static updateEnrollmentStatus = catchAsync(async (req: Request, res: Response) => {
    const adminUserId = req.user!.userId;
    const id = req.params.id as string;
    const result = await EnrollmentService.updateEnrollmentStatus(id, adminUserId, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Enrollment status updated successfully',
      data: result,
    });
  });

  static deleteEnrollment = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await EnrollmentService.deleteEnrollment(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Enrollment deleted successfully',
      data: result,
    });
  });
}

