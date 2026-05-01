export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Record<string, unknown> est assignable depuis ParsedQs (Express) tout en restant plus strict que any
export const getPagination = (query: Record<string, unknown>): PaginationOptions => {
  const page  = Math.max(1, parseInt(String(query.page  ?? '')) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '')) || 20));
  return { page, limit };
};

export const getPaginationResult = (total: number, options: PaginationOptions): PaginationResult => {
  const totalPages = Math.ceil(total / options.limit);
  return {
    page: options.page,
    limit: options.limit,
    total,
    totalPages,
    hasNext: options.page < totalPages,
    hasPrev: options.page > 1,
  };
};
