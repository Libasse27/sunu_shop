import { Request, Response } from 'express';
import PaymentSettings from '../models/PaymentSettings.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

// GET /payment-settings — public, renvoie les QR codes et numéros configurés
export const getPaymentSettings = asyncHandler(async (_req: Request, res: Response) => {
  let settings = await PaymentSettings.findOne();
  if (!settings) settings = await PaymentSettings.create({});
  ApiResponse.success(res, settings.toObject(), 'Paramètres de paiement récupérés');
});

// PUT /payment-settings — admin uniquement
export const updatePaymentSettings = asyncHandler(async (req: Request, res: Response) => {
  const { waveQrCodeUrl, wavePhoneNumber, orangeMoneyQrCodeUrl, orangeMoneyPhoneNumber } = req.body;

  let settings = await PaymentSettings.findOne();
  if (!settings) settings = await PaymentSettings.create({});

  if (waveQrCodeUrl !== undefined)          settings.waveQrCodeUrl          = waveQrCodeUrl;
  if (wavePhoneNumber !== undefined)        settings.wavePhoneNumber        = wavePhoneNumber;
  if (orangeMoneyQrCodeUrl !== undefined)   settings.orangeMoneyQrCodeUrl   = orangeMoneyQrCodeUrl;
  if (orangeMoneyPhoneNumber !== undefined) settings.orangeMoneyPhoneNumber = orangeMoneyPhoneNumber;

  await settings.save();
  ApiResponse.success(res, settings, 'Paramètres de paiement mis à jour');
});
