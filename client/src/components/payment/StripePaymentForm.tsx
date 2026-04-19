import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, ShieldCheck, Lock, CreditCard, AlertCircle } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

// ── Types ────────────────────────────────────────────────────────────────────
type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

interface CardState {
  name: string;
  brand: CardBrand;
  numberComplete: boolean;
  expiryComplete: boolean;
  cvcComplete: boolean;
  flipped: boolean;
}

interface StripePaymentFormProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: () => void;
  amount: number;
}

// ── Stripe element shared style ──────────────────────────────────────────────
const ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1F2937',
      fontFamily: "'Inter', system-ui, sans-serif",
      fontWeight: '500',
      letterSpacing: '0.01em',
      '::placeholder': { color: '#9CA3AF' },
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
};

// ── Card brand logos ─────────────────────────────────────────────────────────
function BrandLogo({ brand, size = 'md' }: { brand: CardBrand; size?: 'sm' | 'md' }) {
  if (brand === 'visa') {
    return (
      <div
        className="flex items-center justify-center rounded"
        style={{ background: 'rgba(255,255,255,0.15)', height: size === 'sm' ? '24px' : '32px', padding: size === 'sm' ? '0 8px' : '0 12px' }}
      >
        <span className="text-white font-black italic" style={{ fontSize: size === 'sm' ? '11px' : '16px', letterSpacing: '-0.02em' }}>
          VISA
        </span>
      </div>
    );
  }
  if (brand === 'mastercard') {
    return (
      <div className="flex items-center">
        <div className="rounded-full" style={{ width: size === 'sm' ? '20px' : '32px', height: size === 'sm' ? '20px' : '32px', background: 'rgba(239,68,68,0.9)' }} />
        <div className="rounded-full" style={{ width: size === 'sm' ? '20px' : '32px', height: size === 'sm' ? '20px' : '32px', background: 'rgba(250,204,21,0.9)', marginLeft: size === 'sm' ? '-8px' : '-12px' }} />
      </div>
    );
  }
  if (brand === 'amex') {
    return (
      <div
        className="flex items-center justify-center rounded"
        style={{ background: 'rgba(255,255,255,0.2)', height: size === 'sm' ? '24px' : '32px', padding: size === 'sm' ? '0 8px' : '0 12px' }}
      >
        <span className="text-white font-bold" style={{ fontSize: size === 'sm' ? '10px' : '12px', letterSpacing: '-0.02em' }}>AMEX</span>
      </div>
    );
  }
  // Unknown brand — show both Visa + MC placeholders
  return (
    <div className="flex items-center gap-1">
      <div
        className="flex items-center rounded px-2"
        style={{ background: 'rgba(255,255,255,0.1)', height: size === 'sm' ? '20px' : '28px' }}
      >
        <span className="text-white font-black italic" style={{ fontSize: size === 'sm' ? '9px' : '12px', opacity: 0.5 }}>VISA</span>
      </div>
      <div className="flex items-center">
        <div className="rounded-full" style={{ width: size === 'sm' ? '16px' : '24px', height: size === 'sm' ? '16px' : '24px', background: 'rgba(255,255,255,0.2)' }} />
        <div className="rounded-full" style={{ width: size === 'sm' ? '16px' : '24px', height: size === 'sm' ? '16px' : '24px', background: 'rgba(255,255,255,0.1)', marginLeft: size === 'sm' ? '-6px' : '-8px' }} />
      </div>
    </div>
  );
}

// ── 3D Card Visual ───────────────────────────────────────────────────────────
function CardVisual({ card, amount }: { card: CardState; amount: number }) {
  const gradients: Record<CardBrand, string> = {
    visa:       'linear-gradient(135deg, #1a1f71 0%, #162580 50%, #0c1756 100%)',
    mastercard: 'linear-gradient(135deg, #14532D 0%, #1a3a2a 50%, #052e16 100%)',
    amex:       'linear-gradient(135deg, #016FD0 0%, #003087 100%)',
    discover:   'linear-gradient(135deg, #f76b1c 0%, #f5a623 100%)',
    unknown:    'linear-gradient(135deg, #14532D 0%, #1a4a30 50%, #052e16 100%)',
  };

  const bg = gradients[card.brand];

  return (
    <div style={{ perspective: '1200px', maxWidth: '420px' }} className="w-full mx-auto mb-6">
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: card.flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          position: 'relative',
          height: '230px',
          maxWidth: '420px',
          margin: '0 auto',
        }}
      >
        {/* ── FRONT ── */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: bg,
            position: 'absolute',
            inset: 0,
          }}
          className="rounded-xl p-6 shadow-lg overflow-hidden"
        >
          {/* Decorative blobs */}
          <div className="absolute rounded-full pointer-events-none" style={{ right: '-64px', top: '-64px', width: '208px', height: '208px', background: 'rgba(255,255,255,0.05)' }} />
          <div className="absolute rounded-full pointer-events-none" style={{ left: '-32px', bottom: '-40px', width: '160px', height: '160px', background: 'rgba(255,255,255,0.05)' }} />

          {/* Amount badge */}
          <div className="absolute rounded-full px-3 py-1 pointer-events-none" style={{ top: '16px', right: '16px', background: 'rgba(0,0,0,0.2)' }}>
            <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>{formatPrice(amount)}</span>
          </div>

          {/* Chip + brand */}
          <div className="relative flex items-start justify-between mb-6" style={{ zIndex: 10 }}>
            {/* EMV chip */}
            <div className="rounded overflow-hidden" style={{ width: '44px', height: '32px', background: 'linear-gradient(135deg, #d4af37, #c5982a)' }}>
              <div className="grid gap-0 p-1 h-full" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="rounded-sm" style={{ background: 'rgba(180,140,30,0.4)' }} />
                ))}
              </div>
            </div>
            <BrandLogo brand={card.brand} />
          </div>

          {/* Card number */}
          <div className="relative mb-6" style={{ zIndex: 10 }}>
            <p
              className="text-white mb-0"
              style={{ fontFamily: 'monospace', opacity: 0.85, fontSize: '20px', letterSpacing: '0.2em', fontWeight: 300 }}
            >
              •••• •••• •••• ••••
            </p>
          </div>

          {/* Name + expiry */}
          <div className="relative flex items-end justify-between" style={{ zIndex: 10 }}>
            <div>
              <p className="mb-0" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Titulaire</p>
              <p className="mb-0 text-sm font-semibold truncate uppercase" style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em', maxWidth: '180px' }}>
                {card.name || 'VOTRE NOM'}
              </p>
            </div>
            <div className="text-right">
              <p className="mb-0" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Expire</p>
              <p className="mb-0 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace' }}>
                {card.expiryComplete ? '••/••' : 'MM/AA'}
              </p>
            </div>
          </div>

          {/* Completion dots */}
          <div className="absolute flex gap-1" style={{ bottom: '16px', left: '24px' }}>
            {[
              { done: card.numberComplete, label: 'N°' },
              { done: card.expiryComplete, label: 'EXP' },
              { done: card.cvcComplete, label: 'CVV' },
              { done: !!card.name.trim(), label: 'NOM' },
            ].map(({ done, label }) => (
              <div key={label} className="flex items-center gap-1" title={label}>
                <div className="rounded-full transition-colors" style={{ width: '6px', height: '6px', background: done ? '#86efac' : 'rgba(255,255,255,0.25)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: bg,
            transform: 'rotateY(180deg)',
            position: 'absolute',
            inset: 0,
          }}
          className="rounded-xl shadow-lg overflow-hidden"
        >
          {/* Magnetic strip */}
          <div className="w-full" style={{ height: '48px', marginTop: '32px', background: 'rgba(0,0,0,0.65)' }} />

          {/* Signature strip + CVV */}
          <div className="px-6 mt-6">
            <div className="flex items-stretch gap-3">
              <div className="flex-1 rounded flex items-center px-3 overflow-hidden" style={{ height: '40px', background: 'rgba(255,255,255,0.9)' }}>
                {/* Signature pattern */}
                <div className="w-full flex gap-0 items-end">
                  {[...Array(14)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{ background: '#E5E7EB', height: `${8 + Math.sin(i * 1.2) * 5}px` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded flex flex-col items-center justify-center bg-white" style={{ width: '56px', height: '40px' }}>
                <span style={{ fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CVV</span>
                <span className="font-bold text-sm" style={{ color: '#1F2937', fontFamily: 'monospace', letterSpacing: '0.2em' }}>•••</span>
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <p className="mb-0" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Signature autorisée</p>
              <p className="mb-0" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Code CVV</p>
            </div>
          </div>

          <div className="px-6 mt-4 flex items-center justify-between">
            <BrandLogo brand={card.brand} size="sm" />
            <p className="mb-0 text-right" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px' }}>
              Protégé par Stripe<br />Chiffrement SSL 256-bit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Field wrapper ────────────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-1">{label}</label>
      <div
        className="px-3 py-3 rounded-lg bg-white transition-all"
        style={{
          border: error ? '1px solid #F87171' : '1px solid #E5E7EB',
          background: error ? 'rgba(254,242,242,0.2)' : '#fff',
        }}
      >
        {children}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-sm mt-1 mb-0" style={{ color: '#EF4444' }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
      {hint && !error && (
        <p className="mb-0 mt-1" style={{ fontSize: '11px', color: '#9CA3AF' }}>{hint}</p>
      )}
    </div>
  );
}

// ── Checkout form ────────────────────────────────────────────────────────────
function CheckoutForm({ clientSecret, onSuccess, onError, amount }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [card, setCard] = useState<CardState>({
    name: '',
    brand: 'unknown',
    numberComplete: false,
    expiryComplete: false,
    cvcComplete: false,
    flipped: false,
  });

  const setFieldError = (field: string, msg?: string) => {
    setFieldErrors(prev => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!card.name.trim()) {
      setFieldErrors(prev => ({ ...prev, name: 'Le nom du titulaire est requis' }));
      return;
    }

    setLoading(true);
    setSubmitError(null);

    const cardNumberEl = elements.getElement(CardNumberElement);
    if (!cardNumberEl) { setLoading(false); return; }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumberEl,
        billing_details: {
          name: card.name.trim(),
        },
      },
    });

    if (error) {
      setSubmitError(error.message || 'Une erreur est survenue lors du paiement');
      setLoading(false);
      if (error.type !== 'card_error' && error.type !== 'validation_error') {
        onError();
      }
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setSubmitError("Le paiement n'a pas abouti. Veuillez réessayer.");
      setLoading(false);
    }
  };

  const allComplete =
    card.numberComplete &&
    card.expiryComplete &&
    card.cvcComplete &&
    card.name.trim().length > 0;

  return (
    <div>
      {/* 3D Card visual */}
      <CardVisual card={card} amount={amount} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Cardholder name */}
        <Field label="Nom du titulaire" error={fieldErrors.name}>
          <input
            type="text"
            value={card.name}
            onChange={e => {
              setCard(prev => ({ ...prev, name: e.target.value }));
              setFieldError('name');
            }}
            onBlur={() => {
              if (!card.name.trim()) setFieldError('name', 'Requis');
            }}
            placeholder="PRÉNOM NOM"
            className="w-full border-0 bg-transparent uppercase font-semibold"
            style={{ fontSize: '15px', color: '#111827', outline: 'none' }}
            autoComplete="cc-name"
          />
        </Field>

        {/* Card number */}
        <Field
          label="Numéro de carte"
          error={fieldErrors.number}
          hint="Visa, Mastercard, American Express acceptés"
        >
          <CardNumberElement
            options={{
              ...ELEMENT_STYLE,
              showIcon: true,
              iconStyle: 'solid',
            }}
            onChange={e => {
              setCard(prev => ({
                ...prev,
                brand: (e.brand as CardBrand) || 'unknown',
                numberComplete: e.complete,
              }));
              setFieldError('number', e.error?.message);
            }}
          />
        </Field>

        {/* Expiry + CVV side by side */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date d'expiration" error={fieldErrors.expiry}>
            <CardExpiryElement
              options={ELEMENT_STYLE}
              onChange={e => {
                setCard(prev => ({ ...prev, expiryComplete: e.complete }));
                setFieldError('expiry', e.error?.message);
              }}
            />
          </Field>

          <Field label="CVV / CVC" error={fieldErrors.cvc} hint="3 chiffres au dos">
            <CardCvcElement
              options={ELEMENT_STYLE}
              onFocus={() => setCard(prev => ({ ...prev, flipped: true }))}
              onBlur={() => setCard(prev => ({ ...prev, flipped: false }))}
              onChange={e => {
                setCard(prev => ({ ...prev, cvcComplete: e.complete }));
                setFieldError('cvc', e.error?.message);
              }}
            />
          </Field>
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
            <AlertCircle size={16} className="shrink-0 mt-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Security badges */}
        <div className="grid grid-cols-3 gap-2 py-1">
          {[
            { icon: ShieldCheck, text: 'SSL 256-bit' },
            { icon: Lock, text: 'PCI DSS' },
            { icon: CreditCard, text: 'Stripe Secure' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1" style={{ fontSize: '11px', color: '#9CA3AF' }}>
              <Icon size={12} style={{ color: '#22C55E' }} className="shrink-0" />
              {text}
            </div>
          ))}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!stripe || loading || !allComplete}
          className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-lg"
          style={{
            background: !stripe || loading || !allComplete ? '#D1D5DB' : '#009A44',
            fontSize: '16px',
            cursor: !stripe || loading || !allComplete ? 'not-allowed' : 'pointer',
            border: 'none',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <Lock size={16} />
              Payer {formatPrice(amount)} en sécurité
            </>
          )}
        </button>

        {/* Card logos row */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Cartes acceptées :</span>
          <div className="flex items-center rounded px-2" style={{ height: '24px', background: '#1a1f71' }}>
            <span className="text-white font-black italic" style={{ fontSize: '11px', letterSpacing: '-0.02em' }}>VISA</span>
          </div>
          <div className="flex items-center">
            <div className="rounded-full" style={{ width: '20px', height: '20px', background: '#EF4444' }} />
            <div className="rounded-full" style={{ width: '20px', height: '20px', background: '#FACC15', marginLeft: '-8px' }} />
          </div>
          <div className="flex items-center rounded px-2" style={{ height: '24px', background: '#016FD0' }}>
            <span className="text-white font-bold" style={{ fontSize: '10px' }}>AMEX</span>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Public export ────────────────────────────────────────────────────────────
export default function StripePaymentForm(props: StripePaymentFormProps) {
  if (!stripePromise) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg text-sm" style={{ background: '#FEFCE8', border: '1px solid #FDE68A', color: '#92400E' }}>
        <AlertCircle size={16} className="shrink-0 mt-0" />
        Le paiement par carte n'est pas disponible pour le moment. Veuillez choisir une autre méthode.
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#009A44',
            colorBackground: '#ffffff',
            colorText: '#1F2937',
            colorDanger: '#EF4444',
            fontFamily: "'Inter', system-ui, sans-serif",
            spacingUnit: '4px',
            borderRadius: '12px',
          },
        },
        locale: 'fr',
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  );
}
