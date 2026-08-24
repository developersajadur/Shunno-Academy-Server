import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { ReviewService } from './review.service';

export class ReviewController {
  static getApprovedReviews = catchAsync(async (req: Request, res: Response) => {
    const courseId = req.query.courseId as string | undefined;
    const result = await ReviewService.getApprovedReviews(courseId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Approved reviews fetched successfully',
      data: result,
    });
  });

  static getAllReviewsAdmin = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      ...req.query,
      isApproved:
        req.query.isApproved === 'true' ? true : req.query.isApproved === 'false' ? false : undefined,
      isFeatured:
        req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined,
    };
    const result = await ReviewService.getAllReviewsAdmin(filters as any);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'All reviews fetched successfully',
      meta: result.meta,
      data: result.data,
    });
  });

  static createReview = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await ReviewService.createReview(userId, req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Review submitted successfully',
      data: result,
    });
  });

  static updateApproval = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await ReviewService.updateApproval(id, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Review approval updated successfully',
      data: result,
    });
  });

  static deleteReview = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await ReviewService.deleteReview(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Review deleted successfully',
      data: result,
    });
  });
}

