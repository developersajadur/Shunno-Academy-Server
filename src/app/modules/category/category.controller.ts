import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { CategoryService } from './category.service';

export class CategoryController {
  static getAll = catchAsync(async (_req: Request, res: Response) => {
    const result = await CategoryService.getAll();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Categories fetched successfully',
      data: result,
    });
  });

  static getBySlug = catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const result = await CategoryService.getBySlug(slug);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Category fetched successfully',
      data: result,
    });
  });

  static create = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.create(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Category created successfully',
      data: result,
    });
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CategoryService.update(id, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Category updated successfully',
      data: result,
    });
  });

  static delete = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CategoryService.delete(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Category deleted successfully',
      data: result,
    });
  });
}

