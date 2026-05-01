import { Schema, model, Document } from 'mongoose';

export interface IPaymentSettings extends Document {
  waveQrCodeUrl: string;
  wavePhoneNumber: string;
  orangeMoneyQrCodeUrl: string;
  orangeMoneyPhoneNumber: string;
}

const paymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    waveQrCodeUrl:          { type: String, default: '' },
    wavePhoneNumber:        { type: String, default: '' },
    orangeMoneyQrCodeUrl:   { type: String, default: '' },
    orangeMoneyPhoneNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

export default model<IPaymentSettings>('PaymentSettings', paymentSettingsSchema);
