import { sendEmail } from '../utils/sendEmail';
import { emailTemplates } from '../utils/sendEmail';

// ─── Types internes ───────────────────────────────────────────────────────────

interface OrderItem {
  name:     string;
  quantity: number;
  subtotal: number;
  image?:   string;
}

interface ShippingAddress {
  fullName: string;
  street:   string;
  city:     string;
  country:  string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class EmailService {

  // ── Compte ─────────────────────────────────────────────────────────────────

  async sendWelcome(to: string, name: string): Promise<void> {
    const tpl = emailTemplates.welcome(name);
    await sendEmail({ to, ...tpl });
  }

  async sendResetPassword(to: string, name: string, resetUrl: string): Promise<void> {
    const tpl = emailTemplates.resetPassword(name, resetUrl);
    await sendEmail({ to, ...tpl });
  }

  async sendPasswordChanged(to: string, name: string): Promise<void> {
    const tpl = emailTemplates.passwordChanged(name);
    await sendEmail({ to, ...tpl });
  }

  // ── Commandes ──────────────────────────────────────────────────────────────

  async sendOrderConfirmation(
    to:              string,
    orderNumber:     string,
    total:           number,
    items:           OrderItem[],
    shippingAddress?: ShippingAddress,
    paymentMethod?:  string,
    trackUrl?:       string,
  ): Promise<void> {
    const tpl = emailTemplates.orderConfirmation(
      orderNumber, total, items, shippingAddress, paymentMethod, trackUrl,
    );
    await sendEmail({ to, ...tpl });
  }

  async sendOrderStatusUpdate(
    to:           string,
    orderNumber:  string,
    status:       string,
    note?:        string,
    trackUrl?:    string,
    customerName?: string,
  ): Promise<void> {
    const tpl = emailTemplates.orderStatusUpdate(orderNumber, status, note, trackUrl, customerName);
    await sendEmail({ to, ...tpl });
  }

  async sendPaymentConfirmation(
    to:           string,
    orderNumber:  string,
    amount:       number,
    method:       string,
    customerName?: string,
    trackUrl?:    string,
  ): Promise<void> {
    const tpl = emailTemplates.paymentConfirmation(orderNumber, amount, method, customerName, trackUrl);
    await sendEmail({ to, ...tpl });
  }

  async sendRefundConfirmation(
    to:           string,
    orderNumber:  string,
    amount:       number,
    reason?:      string,
    customerName?: string,
  ): Promise<void> {
    const tpl = emailTemplates.refundConfirmation(orderNumber, amount, reason, customerName);
    await sendEmail({ to, ...tpl });
  }

  // ── Reviews ────────────────────────────────────────────────────────────────

  async sendReviewReply(
    to:          string,
    customerName: string,
    productName: string,
    replyText:   string,
    productUrl?: string,
  ): Promise<void> {
    const tpl = emailTemplates.reviewReply(customerName, productName, replyText, productUrl);
    await sendEmail({ to, ...tpl });
  }

  // ── Newsletter ─────────────────────────────────────────────────────────────

  async sendNewsletterWelcome(
    to:             string,
    shopUrl:        string,
    unsubscribeUrl: string,
  ): Promise<void> {
    const tpl = emailTemplates.newsletterWelcome(to, shopUrl, unsubscribeUrl);
    await sendEmail({ to, ...tpl });
  }

  async sendNewsletterBroadcast(
    to:             string,
    subject:        string,
    body:           string,
    shopUrl:        string,
    unsubscribeUrl: string,
  ): Promise<void> {
    const tpl = emailTemplates.newsletterBroadcast(subject, body, shopUrl, unsubscribeUrl);
    await sendEmail({ to, ...tpl });
  }
}

export const emailService = new EmailService();
