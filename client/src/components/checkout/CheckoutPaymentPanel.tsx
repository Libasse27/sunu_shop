// ─── Panel de paiement QR + Timer + détail montant ────────────────────────────

import React from 'react';
import { Clock, Lock, QrCode, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import type { PaymentIntent } from '../../hooks/useCheckout';

// ── Timer d'expiration ────────────────────────────────────────────────────────
export function ExpiryTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [remaining, setRemaining] = React.useState(0);

  React.useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff === 0) onExpire();
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  if (remaining === 0) return null;
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');
  const isLow = remaining < 120;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: isLow ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.06)', color: isLow ? '#dc2626' : '#6b7280' }}>
      <Clock size={10} />{mins}:{secs}
    </span>
  );
}

// ── Panel QR Code inline ───────────────────────────────────────────────────────
interface InlineQRPanelProps {
  name: string;
  qrCodeUrl: string;
  phoneNumber: string;
  intent: PaymentIntent | null;
  accentColor: string;
  logo: React.ReactNode;
  onIntentExpire: () => void;
}

export function InlineQRPanel({ name, qrCodeUrl, phoneNumber, intent, accentColor, logo, onIntentExpire }: InlineQRPanelProps) {
  const amount = intent?.amount;
  const loading = intent === null;
  return (
    <div className="rounded-2xl border-2 overflow-hidden mt-4 transition-all" style={{ borderColor: accentColor + '30' }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}06)` }}>
        <div className="flex items-center gap-3">
          {logo}
          <div>
            <p className="font-bold text-gray-900 text-sm mb-0">Payer avec {name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Lock size={10} style={{ color: accentColor }} />
              <p className="text-xs mb-0" style={{ color: accentColor }}>Montant vérifié par le serveur</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-0.5">Montant exact à envoyer</p>
          {loading ? (
            <div className="flex items-center gap-2 justify-end">
              <Loader2 size={14} className="animate-spin text-gray-400" />
              <span className="text-sm text-gray-400">Calcul…</span>
            </div>
          ) : (
            <p className="font-bold text-xl mb-0" style={{ color: accentColor, fontFamily: 'DM Sans, sans-serif' }}>
              {formatPrice(amount!)}
            </p>
          )}
          {intent && <ExpiryTimer expiresAt={intent.expiresAt} onExpire={onIntentExpire} />}
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="flex flex-col items-center shrink-0 mx-auto sm:mx-0">
            {qrCodeUrl ? (
              <div className="p-3 bg-white rounded-2xl shadow border-2" style={{ borderColor: accentColor + '20' }}>
                <img src={qrCodeUrl} alt={`QR code ${name}`} className="rounded-xl block" style={{ width: 176, height: 176, objectFit: 'contain' }} />
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2"
                style={{ width: 176, height: 176, borderColor: accentColor + '35', background: accentColor + '06' }}>
                <QrCode size={36} style={{ color: accentColor + '60' }} />
                <p className="text-xs text-gray-400 text-center px-4 mb-0">QR code non configuré</p>
              </div>
            )}
            <p className="text-xs font-medium mt-2 flex items-center gap-1 mb-0" style={{ color: accentColor }}>
              <QrCode size={10} /> Scanner avec {name}
            </p>
          </div>

          <div className="flex-1">
            {phoneNumber && (
              <div className="flex items-center gap-3 p-3 rounded-xl mb-4 border"
                style={{ background: accentColor + '0C', borderColor: accentColor + '25' }}>
                <Phone size={14} style={{ color: accentColor }} className="shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0">Ou envoyer au numéro</p>
                  <p className="font-bold text-gray-900 mb-0 tracking-wider" style={{ fontFamily: 'monospace', fontSize: 14 }}>{phoneNumber}</p>
                </div>
              </div>
            )}
            <ol className="flex flex-col gap-2">
              {[
                `Ouvrez l'application ${name}`,
                'Appuyez sur "Scanner" ou icône QR',
                'Scannez ce QR code',
                loading ? 'Vérifiez le montant (chargement…)' : `Vérifiez : ${formatPrice(amount!)}`,
                'Confirmez avec votre code PIN',
                'Revenez ici et cliquez "Confirmer le paiement"',
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2.5 list-none">
                  <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0 text-xs"
                    style={{ width: 20, height: 20, minWidth: 20, background: accentColor, marginTop: 1 }}>{i + 1}</div>
                  <span className="text-sm text-gray-600 leading-snug">{text}</span>
                </li>
              ))}
            </ol>
            {!loading && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl border" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                <p className="text-xs mb-0" style={{ color: '#92400e' }}>
                  Envoyez <strong>exactement {formatPrice(amount!)}</strong> — un montant différent bloquera la confirmation.
                </p>
              </div>
            )}
          </div>
        </div>

        {intent?.breakdown && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Détail du montant vérifié</p>
            <div className="flex flex-col gap-1 text-xs text-gray-500">
              <div className="flex justify-between"><span>Sous-total</span><span>{formatPrice(intent.breakdown.subtotal)}</span></div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span className={intent.breakdown.isFreeShipping ? 'font-semibold' : ''} style={intent.breakdown.isFreeShipping ? { color: accentColor } : {}}>
                  {intent.breakdown.isFreeShipping ? 'Gratuite 🎉' : formatPrice(intent.breakdown.shippingCost)}
                </span>
              </div>
              {intent.breakdown.discount > 0 && (
                <div className="flex justify-between font-semibold" style={{ color: accentColor }}>
                  <span>Réduction{intent.breakdown.couponCode ? ` (${intent.breakdown.couponCode})` : ''}</span>
                  <span>−{formatPrice(intent.breakdown.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-1 mt-1">
                <span>Total à envoyer</span><span style={{ color: accentColor }}>{formatPrice(intent.breakdown.total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
