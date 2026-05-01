import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { sendEmail } from '../utils/sendEmail';
import { env } from '../config/env';
import logger from '../utils/logger';

export const contactValidator = [
  body('name').trim().notEmpty().withMessage('Le nom est requis').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
  body('subject').trim().notEmpty().withMessage('Le sujet est requis').isLength({ max: 200 }),
  body('message').trim().notEmpty().withMessage('Le message est requis').isLength({ min: 10, max: 2000 }),
];

export const sendContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw ApiError.badRequest('Données invalides', errors.array().map(e => ({
      field: (e as { path?: string }).path,
      message: e.msg,
    })));
  }

  const { name, email, subject, message } = req.body as {
    name: string; email: string; subject: string; message: string;
  };

  const adminEmail = env.SMTP_USER || env.EMAIL_FROM;
  if (!adminEmail) {
    logger.warn('Contact form: SMTP_USER non configuré — email non envoyé');
    // Répond quand même 200 pour ne pas exposer la configuration
    return ApiResponse.success(res, null, 'Message reçu. Nous vous répondrons sous 24h.');
  }

  await sendEmail({
    to:      adminEmail,
    subject: `[Contact Sunu Shop] ${subject}`,
    html: `
      <h2>Nouveau message de contact</h2>
      <p><strong>De :</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Sujet :</strong> ${subject}</p>
      <hr/>
      <p>${message.replace(/\n/g, '<br/>')}</p>
    `,
    text: `De : ${name} <${email}>\nSujet : ${subject}\n\n${message}`,
    replyTo: email,
  });

  logger.info('Message de contact envoyé', { from: email, subject });
  ApiResponse.success(res, null, 'Message envoyé. Nous vous répondrons sous 24h.');
});
