import { Request, Response } from 'express';
import crypto from 'crypto';
import Newsletter from '../models/Newsletter.model';
import NewsletterCampaign from '../models/NewsletterCampaign.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { sendEmail, emailTemplates } from '../utils/sendEmail';

const generateToken = (): string => crypto.randomBytes(32).toString('hex');

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest('Email requis');

  const clientUrl = process.env.CLIENT_URL || 'https://techafrique.sn';

  const existing = await Newsletter.findOne({ email });
  if (existing) {
    if (existing.isActive) throw ApiError.conflict('Cet email est déjà inscrit');
    existing.isActive = true;
    existing.subscribedAt = new Date();
    existing.unsubscribedAt = undefined;
    existing.unsubscribeToken = generateToken();
    await existing.save();

    const unsubscribeUrl = `${clientUrl}/newsletter/unsubscribe?token=${existing.unsubscribeToken}`;
    const tpl = emailTemplates.newsletterWelcome(email, `${clientUrl}/boutique`, unsubscribeUrl);
    sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch(() => {});

    return ApiResponse.success(res, null, 'Vous êtes à nouveau inscrit à la newsletter');
  }

  const token = generateToken();
  await Newsletter.create({ email, unsubscribeToken: token });

  const unsubscribeUrl = `${clientUrl}/newsletter/unsubscribe?token=${token}`;
  const tpl = emailTemplates.newsletterWelcome(email, `${clientUrl}/boutique`, unsubscribeUrl);
  sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch(() => {});

  ApiResponse.created(res, null, 'Inscription réussie ! Bienvenue dans la communauté TechAfrique.');
});

export const unsubscribeByToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') throw ApiError.badRequest('Token requis');

  const subscriber = await Newsletter.findOne({ unsubscribeToken: token });
  if (!subscriber) throw ApiError.notFound('Lien de désinscription invalide ou déjà utilisé');

  if (!subscriber.isActive) {
    return ApiResponse.success(res, null, 'Vous êtes déjà désinscrit(e)');
  }

  subscriber.isActive = false;
  subscriber.unsubscribedAt = new Date();
  await subscriber.save();
  ApiResponse.success(res, null, 'Désinscription effectuée avec succès');
});

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest('Email requis');

  const subscriber = await Newsletter.findOne({ email });
  if (!subscriber || !subscriber.isActive) throw ApiError.notFound('Email non trouvé');

  subscriber.isActive = false;
  subscriber.unsubscribedAt = new Date();
  await subscriber.save();
  ApiResponse.success(res, null, 'Désinscription effectuée');
});

export const getSubscribers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;
  const skip = (page - 1) * limit;

  const [subscribers, total] = await Promise.all([
    Newsletter.find({ isActive: true }).sort({ subscribedAt: -1 }).skip(skip).limit(limit).lean(),
    Newsletter.countDocuments({ isActive: true }),
  ]);

  ApiResponse.success(res, { subscribers, total, page, pages: Math.ceil(total / limit) });
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const [total, recent] = await Promise.all([
    Newsletter.countDocuments({ isActive: true }),
    Newsletter.find({ isActive: true }).sort({ subscribedAt: -1 }).limit(5).lean(),
  ]);

  ApiResponse.success(res, { total, recent });
});

export const sendNewsletter = asyncHandler(async (req: Request, res: Response) => {
  const { subject, body } = req.body;
  if (!subject || !body) throw ApiError.badRequest('Objet et contenu requis');

  const subscribers = await Newsletter.find({ isActive: true }).select('email unsubscribeToken').lean();
  if (subscribers.length === 0) throw ApiError.badRequest('Aucun abonné actif');

  const user = req.user!;
  let sentCount = 0;
  const errors: string[] = [];

  const clientUrl = process.env.CLIENT_URL || 'https://techafrique.sn';
  const shopUrl = `${clientUrl}/boutique`;

  const batchSize = 20;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(sub => {
        const unsubscribeUrl = `${clientUrl}/newsletter/unsubscribe?token=${sub.unsubscribeToken}`;
        const tpl = emailTemplates.newsletterBroadcast(subject, body, shopUrl, unsubscribeUrl);
        return sendEmail({ to: sub.email, subject: tpl.subject, html: tpl.html })
          .then(() => sentCount++)
          .catch(err => errors.push(`${sub.email}: ${err.message}`));
      })
    );
  }

  const campaign = await NewsletterCampaign.create({
    subject,
    body,
    recipientCount: sentCount,
    status: sentCount > 0 ? 'sent' : 'failed',
    sentBy: user._id,
    sentAt: new Date(),
    errorMessage: errors.length > 0 ? errors.slice(0, 5).join('; ') : undefined,
  });

  ApiResponse.success(res, { sentCount, campaignId: campaign._id }, `Newsletter envoyée à ${sentCount} abonné(s)`);
});

export const getCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [campaigns, total] = await Promise.all([
    NewsletterCampaign.find()
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sentBy', 'firstName lastName')
      .lean(),
    NewsletterCampaign.countDocuments(),
  ]);

  ApiResponse.success(res, { campaigns, total, page, pages: Math.ceil(total / limit) });
});
