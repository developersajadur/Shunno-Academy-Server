import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { EmployeeService } from './employee.service';

export class EmployeeController {
  static getAllEmployees = catchAsync(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await EmployeeService.getAllEmployees(filters);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Employees retrieved successfully',
      meta: {
        page: result.meta.page,
        limit: result.meta.limit,
        total: result.meta.total,
        totalPage: result.meta.totalPage,
      },
      data: result.data,
    });
  });

  static getEmployeeById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await EmployeeService.getEmployeeById(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Employee details retrieved successfully',
      data: result,
    });
  });

  static createEmployee = catchAsync(async (req: Request, res: Response) => {
    const result = await EmployeeService.createEmployee(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'এমপ্লয়ি সফলভাবে তৈরি করা হয়েছে!',
      data: result,
    });
  });

  static updateEmployee = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await EmployeeService.updateEmployee(id, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'এমপ্লয়ি তথ্য আপডেট করা হয়েছে!',
      data: result,
    });
  });

  static deleteEmployee = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await EmployeeService.deleteEmployee(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result,
    });
  });

  static verifyEmployeeCode = catchAsync(async (req: Request, res: Response) => {
    const code = req.params.code as string;
    const result = await EmployeeService.verifyEmployeeCode(code);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.valid ? 'Employee verified' : 'Invalid employee',
      data: result,
    });
  });
}

