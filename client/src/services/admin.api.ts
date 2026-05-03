import api from './api';

// ─── Analytics ────────────────────────────────────────────────────────────────

// Convertit un nombre de jours vers l'enum period attendu par le serveur.
// getSalesData accepte aussi 'quarter' (90 jours), getRevenueByCategory non.
function daysToPeriod(days: number, allowQuarter = true): string {
  if (days <= 7)  return 'week';
  if (days <= 31) return 'month';
  if (allowQuarter && days <= 92) return 'quarter';
  return 'year';
}

export const analyticsApi = {
  getDashboardStats: () =>
    api.get('/analytics/dashboard'),

  // days : 7 | 30 | 90 — converti en period enum (week/month/quarter/year)
  getSalesData: (days = 30) =>
    api.get('/analytics/sales', { params: { period: daysToPeriod(days), groupBy: 'day' } }),

  getTopProducts: (limit = 10, sortBy = 'revenue', period = 'month') =>
    api.get('/analytics/products/top', { params: { limit, sortBy, period } }),

  getLowStockProducts: (limit = 20) =>
    api.get('/analytics/products/low-stock', { params: { limit } }),

  getOrderStatusDistribution: (period = 'month') =>
    api.get('/analytics/orders/status', { params: { period } }),

  getPaymentMethodDistribution: (period = 'month') =>
    api.get('/analytics/payments/methods', { params: { period } }),

  getRecentActivity: (limit = 10) =>
    api.get('/analytics/recent-activity', { params: { limit } }),

  getRevenueSummary: () =>
    api.get('/analytics/revenue-summary'),

  // days : 7 | 30 | 90 — converti en period enum (week/month/year, pas de quarter)
  getRevenueByCategory: (days = 30) =>
    api.get('/analytics/revenue-by-category', { params: { period: daysToPeriod(days, false) } }),

  getTopCustomers: (limit = 10, period = 'year') =>
    api.get('/analytics/customers/top', { params: { limit, period } }),

  getRevenueBreakdown: () =>
    api.get('/analytics/revenue-breakdown'),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export interface AdminProductsParams {
  search?: string;
  category?: string;
  supplier?: string;
  page?: number;
  limit?: number;
}

export const adminProductsApi = {
  getList: (params?: AdminProductsParams) =>
    api.get('/products/admin/list', { params }),
  create: (data: FormData | Record<string, unknown>) =>
    api.post('/products', data),
  update: (id: string, data: FormData | Record<string, unknown>) =>
    api.put(`/products/${id}`, data),
  delete: (id: string) =>
    api.delete(`/products/${id}`),
  updateStock: (id: string, stock: number) =>
    api.patch(`/products/${id}/stock`, { stock }),
  bulkUpdate: (ids: string[], data: Record<string, unknown>) =>
    api.put('/products/admin/bulk-update', { ids, ...data }),
  bulkDelete: (ids: string[]) =>
    api.post('/products/admin/bulk-delete', { ids }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export interface AdminOrdersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const adminOrdersApi = {
  getList: (params?: AdminOrdersParams) =>
    api.get('/orders', { params }),
  updateStatus: (id: string, status: string, note?: string) =>
    api.put(`/orders/${id}/status`, { status, note }),
  updateTracking: (id: string, trackingNumber: string) =>
    api.put(`/orders/${id}/tracking`, { trackingNumber }),
  updateNotes: (id: string, adminNote: string) =>
    api.put(`/orders/${id}/notes`, { adminNote }),
  exportCSV: (params?: { startDate?: string; endDate?: string; status?: string }) =>
    api.get('/orders/export', { params, responseType: 'blob' }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export interface AdminUsersParams {
  search?: string;
  role?: string;
  page?: number;
}

export const adminUsersApi = {
  getList: (params?: AdminUsersParams) =>
    api.get('/users', { params }),
  updateRole: (id: string, role: string) =>
    api.put(`/users/${id}/role`, { role }),
  updateStatus: (id: string, isActive: boolean) =>
    api.put(`/users/${id}/status`, { isActive }),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const adminCategoriesApi = {
  getList: () => api.get('/categories/admin/list'),
  create: (data: Record<string, unknown>) =>
    api.post('/categories', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/categories/${id}`, data),
  delete: (id: string) =>
    api.delete(`/categories/${id}`),
};

// ─── Coupons ──────────────────────────────────────────────────────────────────
export interface AdminCouponsParams {
  search?: string;
  page?: number;
}

export const adminCouponsApi = {
  getList: (params?: AdminCouponsParams) =>
    api.get('/coupons', { params }),
  create: (data: Record<string, unknown>) =>
    api.post('/coupons', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/coupons/${id}`, data),
  delete: (id: string) =>
    api.delete(`/coupons/${id}`),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export interface AdminReviewsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const adminReviewsApi = {
  getList: (params?: AdminReviewsParams) =>
    api.get('/reviews', { params }),
  approve: (id: string) =>
    api.patch(`/reviews/${id}/approve`),
  reject: (id: string) =>
    api.patch(`/reviews/${id}/reject`),
  reply: (id: string, reply: string) =>
    api.post(`/reviews/${id}/reply`, { reply }),
  delete: (id: string) =>
    api.delete(`/reviews/${id}`),
};

// ─── Services ─────────────────────────────────────────────────────────────────
export const adminServicesApi = {
  getList: () => api.get('/services/admin/all'),
  create: (data: Record<string, unknown>) =>
    api.post('/services', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/services/${id}`, data),
  delete: (id: string) =>
    api.delete(`/services/${id}`),
};

// ─── Banners ──────────────────────────────────────────────────────────────────
export interface ReorderItem {
  id: string;
  order: number;
}

export const adminBannersApi = {
  getList: () => api.get('/banners/admin/all'),
  create: (data: FormData | Record<string, unknown>) =>
    api.post('/banners', data),
  update: (id: string, data: FormData | Record<string, unknown>) =>
    api.put(`/banners/${id}`, data),
  reorder: (items: ReorderItem[]) =>
    api.put('/banners/reorder', { items }),
  delete: (id: string) =>
    api.delete(`/banners/${id}`),
};

// ─── Announcements ────────────────────────────────────────────────────────────
export const adminAnnouncementsApi = {
  getList: () => api.get('/announcements/admin/all'),
  create: (data: Record<string, unknown>) =>
    api.post('/announcements', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/announcements/${id}`, data),
  reorder: (items: ReorderItem[]) =>
    api.put('/announcements/reorder', { items }),
  delete: (id: string) =>
    api.delete(`/announcements/${id}`),
};

// ─── Newsletter ───────────────────────────────────────────────────────────────
export interface NewsletterCampaignData {
  subject: string;
  body: string;
}

export interface AdminNewsletterParams {
  page?: number;
  limit?: number;
}

export const adminNewsletterApi = {
  getStats: () =>
    api.get('/newsletter/stats'),
  getSubscribers: (params?: AdminNewsletterParams) =>
    api.get('/newsletter', { params }),
  sendCampaign: (data: NewsletterCampaignData) =>
    api.post('/newsletter/send', data),
  getCampaigns: (params?: { page?: number }) =>
    api.get('/newsletter/campaigns', { params }),
  unsubscribe: (email: string) =>
    api.post('/newsletter/unsubscribe', { email }),
};

// ─── Promo Banners — unified avec Banner (type=promo) ────────────────────────
export const adminPromoBannersApi = {
  getList: () => api.get('/banners/admin/all?type=promo'),
  create: (data: FormData | Record<string, unknown>) =>
    api.post('/banners', { ...data, type: 'promo' }),
  update: (id: string, data: FormData | Record<string, unknown>) =>
    api.put(`/banners/${id}`, data),
  delete: (id: string) =>
    api.delete(`/banners/${id}`),
};

// ─── Payment Settings ─────────────────────────────────────────────────────────

export interface PaymentSettingsData {
  waveQrCodeUrl?: string;
  wavePhoneNumber?: string;
  orangeMoneyQrCodeUrl?: string;
  orangeMoneyPhoneNumber?: string;
}

export const adminPaymentSettingsApi = {
  get: () => api.get('/payment-settings'),
  update: (data: PaymentSettingsData) => api.put('/payment-settings', data),
};

// ─── Upload ───────────────────────────────────────────────────────────────────
export const adminUploadApi = {
  uploadImage: (formData: FormData) =>
    api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
