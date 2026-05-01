export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
  pagination?: PaginationInfo;
}

/** Aligné avec PaginationResult de server/src/utils/pagination.ts */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;  // anciennement "pages" — renommé pour cohérence avec l'API
  hasNext: boolean;
  hasPrev: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
