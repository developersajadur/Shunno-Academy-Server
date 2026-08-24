import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { PaymentService } from './payment.service';

export class PaymentController {
  static submitTrx = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentService.submitTrx(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Payment Transaction ID submitted successfully',
      data: result,
    });
  });

  static getAllPaymentsAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentService.getAllPaymentsAdmin(req.query as any);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'All payments retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  });

  static verifyPaymentAdmin = catchAsync(async (req: Request, res: Response) => {
    const adminUserId = req.user!.userId;
    const id = req.params.id as string;
    const result = await PaymentService.verifyPaymentAdmin(id, adminUserId, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Payment verification updated successfully',
      data: result,
    });
  });
}

