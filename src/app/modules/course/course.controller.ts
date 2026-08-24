import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { CourseService } from './course.service';

export class CourseController {
  static getAllCourses = catchAsync(async (req: Request, res: Response) => {
    const result = await CourseService.getAllCourses(req.query as any);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Courses fetched successfully',
      meta: result.meta,
      data: result.data,
    });
  });

  static getCourseBySlug = catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const result = await CourseService.getCourseBySlug(slug);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Course details fetched successfully',
      data: result,
    });
  });

  static createCourse = catchAsync(async (req: Request, res: Response) => {
    const result = await CourseService.createCourse(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Course created successfully',
      data: result,
    });
  });

  static updateCourse = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CourseService.updateCourse(id, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Course updated successfully',
      data: result,
    });
  });

  static deleteCourse = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CourseService.deleteCourse(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Course deleted successfully',
      data: result,
    });
  });
}

