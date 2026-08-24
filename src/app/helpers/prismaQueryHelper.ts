import { DEFAULT_LIMIT, DEFAULT_PAGE, DEFAULT_SORT_BY, DEFAULT_SORT_ORDER } from '../constants';

export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginationResult {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface IPaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface IQueryOptions extends IPaginationOptions {
  searchTerm?: string;
  [key: string]: unknown;
}

export const calculatePagination = (options: IPaginationOptions): IPaginationResult => {
  const page = Number(options.page || DEFAULT_PAGE);
  const limit = Number(options.limit || DEFAULT_LIMIT);
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || DEFAULT_SORT_BY;
  const sortOrder = options.sortOrder || DEFAULT_SORT_ORDER;

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

export const createSearchQuery = (searchTerm: string | undefined, searchableFields: string[]) => {
  if (!searchTerm || !searchableFields.length) return undefined;

  return {
    OR: searchableFields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const,
      },
    })),
  };
};

