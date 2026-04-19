export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const getPagination = (query: any): PaginationOptions => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit };
};

export const getPaginationResult = (total: number, options: PaginationOptions): PaginationResult => {
  const pages = Math.ceil(total / options.limit);
  return {
    page: options.page,
    limit: options.limit,
    total,
    pages,
    hasNext: options.page < pages,
    hasPrev: options.page > 1,
  };
};
