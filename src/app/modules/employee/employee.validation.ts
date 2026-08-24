import { z } from 'zod';

export const createEmployeeValidationSchema = z.object({
  body: z.object({
    employeeId: z.string({ required_error: 'Employee ID is required' }).min(2, 'Employee ID must be at least 2 characters'),
    name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    designation: z.string().optional(),
    department: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    notes: z.string().optional(),
  }),
});

export const updateEmployeeValidationSchema = z.object({
  body: z.object({
    employeeId: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    designation: z.string().optional(),
    department: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    notes: z.string().optional(),
  }),
});

