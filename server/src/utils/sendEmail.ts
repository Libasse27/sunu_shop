import { transporter, emailDefaults } from '../config/email';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: emailDefaults.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY   = '#0EA5E9';
const DARK      = '#1E293B';
const BG        = '#F8FAFC';
const MUTED     = '#64748B';
const BORDER    = '#E2E8F0';
const SUCCESS   = '#22C55E';
const WARNING   = '#F97316';
const DANGER    = '#EF4444';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatFcfa = (amount: number): string =>
  `${amount.toLocaleString('fr-FR')} FCFA`;

const divider = (): string =>
  `<hr style="border:none;border-top:1px solid ${BORDER};margin:24px 0;" />`;

const badge = (text: string, color: string = PRIMARY): string =>
  `<span style="display:inline-block;background:${color};color:white;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;">${text}</span>`;

const btn = (text: string, href: string, color: string = PRIMARY): string =>
  `<a href="${href}" style="display:inline-block;background:${color};color:white;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin-top:8px;">${text}</a>`;

const layout = (content: string, previewText: string = ''): string => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TechAfrique</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${DARK};">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}&nbsp;&#8203;&nbsp;&#8203;</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${PRIMARY} 0%,#0284C7 100%);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:white;border-radius:10px;padding:6px 10px;display:inline-block;">
                    <span style="font-size:22px;font-weight:800;color:${PRIMARY};letter-spacing:-0.5px;">T</span><span style="font-size:22px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">A</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:20px;font-weight:700;color:white;letter-spacing:-0.3px;">TechAfrique</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:white;padding:36px 40px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${DARK};border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;">
              <p style="color:#94A3B8;font-size:12px;margin:0 0 8px;">
                © ${new Date().getFullYear()} TechAfrique · Dakar, Sénégal
              </p>
              <p style="color:#64748B;font-size:11px;margin:0;">
                Vous recevez cet email car vous avez un compte TechAfrique.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── Templates ────────────────────────────────────────────────────────────────
export const emailTemplates = {

  welcome: (name: string, shopUrl: string = 'https://techafrique.sn/boutique') => ({
    subject: '🎉 Bienvenue sur TechAfrique !',
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:${DARK};">
        Bienvenue, ${name} ! 👋
      </h2>
      <p style="margin:0 0 16px;color:${MUTED};line-height:1.6;">
        Merci de nous avoir rejoint. Votre compte TechAfrique est maintenant actif et prêt à l'emploi.
      </p>
      <div style="background:${BG};border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-weight:600;color:${DARK};">Ce que vous pouvez faire :</p>
        <ul style="margin:0;padding-left:20px;color:${MUTED};line-height:2;">
          <li>Parcourir notre catalogue tech (informatique, téléphones, électronique)</li>
          <li>Bénéficier de la livraison gratuite dès 25 000 FCFA</li>
          <li>Payer en toute sécurité par Orange Money, Wave ou carte bancaire</li>
          <li>Contacter nos techniciens pour une réparation ou installation</li>
        </ul>
      </div>
      <p style="margin:0 0 20px;color:${MUTED};">
        Des questions ? Notre équipe est disponible sur WhatsApp pour vous aider.
      </p>
      ${btn('Découvrir la boutique', shopUrl)}
    `, `Bienvenue sur TechAfrique, ${name} !`),
  }),

  orderConfirmation: (
    orderNumber: string,
    total: number,
    items: { name: string; quantity: number; subtotal: number; image?: string }[],
    shippingAddress?: { fullName: string; street: string; city: string; country: string },
    paymentMethod?: string,
    trackUrl?: string,
  ) => {
    const methodLabels: Record<string, string> = {
      stripe: 'Carte bancaire',
      orange_money: 'Orange Money',
      wave: 'Wave',
      cash_on_delivery: 'Paiement à la livraison',
    };
    return {
      subject: `✅ Commande ${orderNumber} confirmée — TechAfrique`,
      html: layout(`
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:#DCFCE7;border-radius:50%;margin-bottom:12px;">
            <span style="font-size:24px;">✓</span>
          </div>
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${DARK};">Commande confirmée !</h2>
          <p style="margin:0;color:${MUTED};">Votre commande a été reçue et est en cours de traitement.</p>
        </div>

        <div style="background:${BG};border-radius:8px;padding:16px 20px;margin-bottom:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;">Numéro de commande</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:${PRIMARY};font-family:monospace;">${orderNumber}</p>
        </div>

        <p style="margin:0 0 16px;font-weight:600;color:${DARK};">Articles commandés</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          ${items.map(item => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
              <span style="font-size:14px;color:${DARK};">${item.name}</span>
              <span style="font-size:12px;color:${MUTED};"> × ${item.quantity}</span>
            </td>
            <td style="padding:10px 0;border-bottom:1px solid ${BORDER};text-align:right;font-weight:600;font-size:14px;white-space:nowrap;">
              ${formatFcfa(item.subtotal)}
            </td>
          </tr>`).join('')}
          <tr>
            <td style="padding:14px 0 0;font-weight:700;font-size:16px;color:${DARK};">Total</td>
            <td style="padding:14px 0 0;text-align:right;font-weight:700;font-size:16px;color:${PRIMARY};">${formatFcfa(total)}</td>
          </tr>
        </table>

        ${shippingAddress ? `
        ${divider()}
        <p style="margin:0 0 10px;font-weight:600;color:${DARK};">Adresse de livraison</p>
        <p style="margin:0;color:${MUTED};line-height:1.7;font-size:14px;">
          ${shippingAddress.fullName}<br />
          ${shippingAddress.street}<br />
          ${shippingAddress.city}, ${shippingAddress.country}
        </p>` : ''}

        ${paymentMethod ? `
        ${divider()}
        <p style="margin:0 0 6px;font-weight:600;color:${DARK};">Mode de paiement</p>
        <p style="margin:0;color:${MUTED};font-size:14px;">${methodLabels[paymentMethod] || paymentMethod}</p>` : ''}

        ${divider()}
        <p style="margin:0 0 16px;color:${MUTED};font-size:14px;line-height:1.6;">
          Vous recevrez une notification dès que votre commande sera expédiée. En cas de question, contactez notre équipe sur WhatsApp.
        </p>
        ${trackUrl ? btn('Suivre ma commande', trackUrl) : ''}
      `, `Votre commande ${orderNumber} est confirmée`),
    };
  },

  resetPassword: (name: string, resetUrl: string) => ({
    subject: '🔒 Réinitialisation de votre mot de passe — TechAfrique',
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${DARK};">Réinitialisation du mot de passe</h2>
      <p style="margin:0 0 16px;color:${MUTED};line-height:1.6;">Bonjour <strong>${name}</strong>,</p>
      <p style="margin:0 0 20px;color:${MUTED};line-height:1.6;">
        Nous avons reçu une demande de réinitialisation du mot de passe pour votre compte TechAfrique.
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
      </p>
      ${btn('Réinitialiser le mot de passe', resetUrl)}
      ${divider()}
      <div style="background:#FEF3C7;border-radius:8px;padding:14px 16px;margin-top:20px;">
        <p style="margin:0;font-size:13px;color:#92400E;">
          ⚠️ Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email — votre mot de passe reste inchangé.
        </p>
      </div>
    `, 'Réinitialisez votre mot de passe TechAfrique'),
  }),

  orderStatusUpdate: (
    orderNumber: string,
    status: string,
    note?: string,
    trackUrl?: string,
    customerName?: string,
  ) => {
    const statusConfig: Record<string, { label: string; color: string; icon: string; message: string }> = {
      confirmed: {
        label: 'Confirmée',
        color: SUCCESS,
        icon: '✅',
        message: 'Votre commande a été confirmée et sera bientôt préparée.',
      },
      processing: {
        label: 'En préparation',
        color: PRIMARY,
        icon: '📦',
        message: 'Nos équipes préparent votre commande avec soin.',
      },
      shipped: {
        label: 'Expédiée',
        color: WARNING,
        icon: '🚚',
        message: 'Votre commande est en route ! Vous la recevrez très prochainement.',
      },
      delivered: {
        label: 'Livrée',
        color: SUCCESS,
        icon: '🎉',
        message: 'Votre commande a été livrée. Merci pour votre achat ! N\'hésitez pas à laisser un avis.',
      },
      cancelled: {
        label: 'Annulée',
        color: DANGER,
        icon: '❌',
        message: 'Votre commande a été annulée. Si vous avez des questions, contactez notre support.',
      },
      refunded: {
        label: 'Remboursée',
        color: MUTED,
        icon: '↩️',
        message: 'Votre remboursement est en cours de traitement (3-10 jours ouvrés selon votre mode de paiement).',
      },
    };
    const cfg = statusConfig[status] || { label: status, color: DARK, icon: '📋', message: '' };
    return {
      subject: `${cfg.icon} Commande ${orderNumber} — ${cfg.label}`,
      html: layout(`
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${DARK};">Mise à jour de votre commande</h2>
        ${customerName ? `<p style="margin:0 0 16px;color:${MUTED};">Bonjour <strong>${customerName}</strong>,</p>` : ''}

        <div style="background:${BG};border-radius:8px;padding:20px 24px;margin-bottom:20px;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;">Commande ${orderNumber}</p>
          ${badge(cfg.label, cfg.color)}
        </div>

        <p style="margin:0 0 16px;color:${MUTED};line-height:1.6;">${cfg.message}</p>
        ${note ? `
        <div style="background:${BG};border-left:3px solid ${PRIMARY};border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px;">
          <p style="margin:0;font-size:14px;color:${DARK};font-style:italic;">${note}</p>
        </div>` : ''}
        ${trackUrl ? btn('Suivre ma commande', trackUrl) : ''}
      `, `Commande ${orderNumber} : ${cfg.label}`),
    };
  },

  paymentConfirmation: (
    orderNumber: string,
    amount: number,
    method: string,
    customerName?: string,
    trackUrl?: string,
  ) => {
    const methodLabels: Record<string, { label: string; icon: string }> = {
      stripe: { label: 'Carte bancaire', icon: '💳' },
      orange_money: { label: 'Orange Money', icon: '🟠' },
      wave: { label: 'Wave', icon: '🌊' },
      cash_on_delivery: { label: 'Paiement à la livraison', icon: '💵' },
    };
    const m = methodLabels[method] || { label: method, icon: '💰' };
    return {
      subject: `✅ Paiement reçu — Commande ${orderNumber}`,
      html: layout(`
        <div style="text-align:center;margin-bottom:28px;">
          <p style="font-size:40px;margin:0 0 8px;">${m.icon}</p>
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${DARK};">Paiement reçu !</h2>
          <p style="margin:0;color:${MUTED};">Votre paiement a été traité avec succès.</p>
        </div>
        ${customerName ? `<p style="margin:0 0 16px;color:${MUTED};">Bonjour <strong>${customerName}</strong>,</p>` : ''}

        <div style="background:${BG};border-radius:8px;padding:20px 24px;margin-bottom:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:${MUTED};font-size:14px;">Commande</td>
              <td style="text-align:right;font-weight:600;font-size:14px;font-family:monospace;">${orderNumber}</td>
            </tr>
            <tr>
              <td style="color:${MUTED};font-size:14px;padding-top:8px;">Montant payé</td>
              <td style="text-align:right;font-weight:700;font-size:16px;color:${SUCCESS};padding-top:8px;">${formatFcfa(amount)}</td>
            </tr>
            <tr>
              <td style="color:${MUTED};font-size:14px;padding-top:8px;">Via</td>
              <td style="text-align:right;font-size:14px;padding-top:8px;">${m.label}</td>
            </tr>
          </table>
        </div>

        <p style="margin:0 0 20px;color:${MUTED};line-height:1.6;font-size:14px;">
          Votre commande va maintenant être traitée et préparée. Vous recevrez une notification dès son expédition.
        </p>
        ${trackUrl ? btn('Suivre ma commande', trackUrl) : ''}
      `, `Paiement confirmé pour la commande ${orderNumber}`),
    };
  },

  refundConfirmation: (
    orderNumber: string,
    amount: number,
    reason?: string,
    customerName?: string,
  ) => ({
    subject: `↩️ Remboursement effectué — Commande ${orderNumber}`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${DARK};">Remboursement effectué</h2>
      ${customerName ? `<p style="margin:0 0 16px;color:${MUTED};">Bonjour <strong>${customerName}</strong>,</p>` : ''}
      <p style="margin:0 0 20px;color:${MUTED};line-height:1.6;">
        Un remboursement de <strong style="color:${DARK};">${formatFcfa(amount)}</strong> a été initié pour votre commande <strong>${orderNumber}</strong>.
      </p>
      ${reason ? `
      <div style="background:${BG};border-left:3px solid ${MUTED};border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;">Motif</p>
        <p style="margin:0;font-size:14px;color:${DARK};">${reason}</p>
      </div>` : ''}
      <div style="background:#FEF3C7;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#92400E;">
          ⏱ Le délai de traitement est de <strong>3 à 10 jours ouvrés</strong> selon votre mode de paiement d'origine.
        </p>
      </div>
      <p style="margin:0;color:${MUTED};font-size:14px;line-height:1.6;">
        Pour toute question, n'hésitez pas à contacter notre support client via WhatsApp.
      </p>
    `, `Remboursement de ${formatFcfa(amount)} pour la commande ${orderNumber}`),
  }),

  passwordChanged: (name: string, supportEmail: string = 'contact@techafrique.sn') => ({
    subject: '🔐 Mot de passe modifié — TechAfrique',
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${DARK};">Mot de passe modifié</h2>
      <p style="margin:0 0 16px;color:${MUTED};line-height:1.6;">Bonjour <strong>${name}</strong>,</p>
      <p style="margin:0 0 20px;color:${MUTED};line-height:1.6;">
        Le mot de passe de votre compte TechAfrique a été modifié avec succès le <strong>${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
      </p>
      <div style="background:#FEE2E2;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#991B1B;">
          🚨 Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement notre support à <a href="mailto:${supportEmail}" style="color:#DC2626;">${supportEmail}</a>
        </p>
      </div>
    `, 'Votre mot de passe TechAfrique a été modifié'),
  }),

  newsletterWelcome: (email: string, shopUrl: string, unsubscribeUrl: string) => ({
    subject: '📬 Bienvenue dans la newsletter TechAfrique !',
    html: layout(`
      <!-- Pan-African strip -->
      <div style="display:flex;height:4px;margin-bottom:24px;border-radius:4px;overflow:hidden;">
        <div style="flex:1;background:#009A44;"></div>
        <div style="flex:1;background:#FCD116;"></div>
        <div style="flex:1;background:#CE1126;"></div>
      </div>

      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${DARK};">
        Merci pour votre inscription ! 🎉
      </h2>
      <p style="margin:0 0 16px;color:${MUTED};line-height:1.6;">
        L'adresse <strong>${email}</strong> est maintenant inscrite à la newsletter TechAfrique.
      </p>
      <div style="background:${BG};border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-weight:600;color:${DARK};">Ce que vous allez recevoir :</p>
        <ul style="margin:0;padding-left:20px;color:${MUTED};line-height:2;">
          <li>Promotions exclusives et ventes flash</li>
          <li>Nouveaux produits tech et électronique</li>
          <li>Conseils d'experts et guides d'achat</li>
          <li>Actualités TechAfrique</li>
        </ul>
      </div>

      <div style="text-align:center;margin-bottom:8px;">
        ${btn('Découvrir la boutique', shopUrl, '#009A44')}
      </div>

      ${divider()}

      <p style="font-size:11px;color:${MUTED};text-align:center;margin:0;">
        Vous recevez cet email car vous venez de vous inscrire à la newsletter TechAfrique.<br/>
        <a href="${unsubscribeUrl}" style="color:${MUTED};text-decoration:underline;">Se désinscrire</a>
      </p>
    `, 'Bienvenue dans la newsletter TechAfrique !'),
  }),

  newsletterBroadcast: (subject: string, body: string, shopUrl: string, unsubscribeUrl: string) => ({
    subject,
    html: layout(`
      <!-- Pan-African strip -->
      <div style="display:flex;height:4px;margin-bottom:24px;border-radius:4px;overflow:hidden;">
        <div style="flex:1;background:#009A44;"></div>
        <div style="flex:1;background:#FCD116;"></div>
        <div style="flex:1;background:#CE1126;"></div>
      </div>

      <div style="white-space:pre-wrap;font-size:15px;color:${DARK};line-height:1.8;margin-bottom:28px;">${body}</div>

      ${divider()}

      <div style="text-align:center;margin-bottom:8px;">
        ${btn('Voir la boutique', shopUrl, '#009A44')}
      </div>

      ${divider()}

      <p style="font-size:11px;color:${MUTED};text-align:center;margin:0;">
        Vous recevez cet email car vous êtes abonné(e) à la newsletter TechAfrique.<br/>
        <a href="${unsubscribeUrl}" style="color:${MUTED};text-decoration:underline;">Se désinscrire</a>
      </p>
    `, subject),
  }),

  reviewReply: (
    customerName: string,
    productName: string,
    replyText: string,
    productUrl?: string,
  ) => ({
    subject: `💬 Réponse à votre avis — ${productName}`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${DARK};">Réponse à votre avis</h2>
      <p style="margin:0 0 16px;color:${MUTED};line-height:1.6;">Bonjour <strong>${customerName}</strong>,</p>
      <p style="margin:0 0 16px;color:${MUTED};line-height:1.6;">
        L'équipe TechAfrique a répondu à votre avis sur <strong style="color:${DARK};">${productName}</strong> :
      </p>
      <div style="background:${BG};border-left:4px solid ${PRIMARY};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;">Réponse de TechAfrique</p>
        <p style="margin:0;font-size:14px;color:${DARK};line-height:1.7;">${replyText}</p>
      </div>
      <p style="margin:0 0 20px;color:${MUTED};font-size:14px;">
        Merci pour votre retour, il nous aide à améliorer nos services !
      </p>
      ${productUrl ? btn('Voir le produit', productUrl) : ''}
    `, `TechAfrique a répondu à votre avis sur ${productName}`),
  }),
};
