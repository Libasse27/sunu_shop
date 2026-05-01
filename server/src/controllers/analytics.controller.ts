import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { analyticsService } from '../services/analytics.service';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getDashboardKPIs();
  ApiResponse.success(res, data);
});

export const getSalesData = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const data = await analyticsService.getSalesData(days);
  ApiResponse.success(res, data);
});

export const getTopProducts = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getTopProducts();
  ApiResponse.success(res, data);
});

export const getLowStockProducts = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getLowStockProducts();
  ApiResponse.success(res, data);
});

export const getOrderStatusDistribution = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getOrderStatusDistribution();
  ApiResponse.success(res, data);
});

export const getPaymentMethodDistribution = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getPaymentMethodDistribution();
  ApiResponse.success(res, data);
});

export const getRecentActivity = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getRecentActivity();
  ApiResponse.success(res, data);
});

export const getRevenueSummary = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getRevenueSummary();
  ApiResponse.success(res, data);
});

export const getRevenueByCategory = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const data = await analyticsService.getRevenueByCategory(days);
  ApiResponse.success(res, data);
});

export const getTopCustomers = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getTopCustomers();
  ApiResponse.success(res, data);
});

export const getRevenueBreakdown = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getRevenueBreakdown();
  ApiResponse.success(res, data);
});
