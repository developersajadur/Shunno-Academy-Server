import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { CourseModuleService } from './courseModule.service';

export class CourseModuleController {
  // ---------------- MODULES ----------------
  static createModule = catchAsync(async (req: Request, res: Response) => {
    const result = await CourseModuleService.createModule(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Course module created successfully',
      data: result,
    });
  });

  static updateModule = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CourseModuleService.updateModule(id, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Course module updated successfully',
      data: result,
    });
  });

  static deleteModule = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CourseModuleService.deleteModule(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Course module deleted successfully',
      data: result,
    });
  });

  static getModulesByCourseId = catchAsync(async (req: Request, res: Response) => {
    const courseId = req.params.courseId as string;
    const userId = req.user?.userId;
    const userRole = req.user?.role as any;
    const result = await CourseModuleService.getModulesByCourseId(courseId, userId, userRole);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Course curriculum modules fetched successfully',
      data: result,
    });
  });

  // ---------------- LECTURES ----------------
  static createLecture = catchAsync(async (req: Request, res: Response) => {
    const result = await CourseModuleService.createLecture(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Lecture created successfully',
      data: result,
    });
  });

  static updateLecture = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CourseModuleService.updateLecture(id, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Lecture updated successfully',
      data: result,
    });
  });

  static deleteLecture = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CourseModuleService.deleteLecture(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Lecture deleted successfully',
      data: result,
    });
  });
}
