import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  CreditCard, Smartphone, Package, MapPin, ShieldCheck,
  Loader2, QrCode, CheckCircle, Clock, AlertCircle, Check,
  ExternalLink, RefreshCw, Phone, ArrowRight,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { selectCartTotal, clearCart } from '../features/cart/cartSlice';
import { formatPrice } from '../utils/formatPrice';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../utils/constants';
import api from '../services/api';
import toast from 'react-hot-toast';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import WaveLogo from '../components/payment/WaveLogo';
import OrangeMoneyLogo from '../components/payment/OrangeMoneyLogo';

// ── Types ────────────────────────────────────────────────────────────────────
type CheckoutStep = 'address' | 'payment' | 'processing';
type PaymentMethod = 'stripe' | 'wave' | 'orange_money' | 'cash_on_delivery';
type MobilePayMode = 'qr' | 'phone';

// ── Payment method config ────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'stripe' as PaymentMethod,
    name: 'Carte bancaire',
    subtitle: 'Visa & Mastercard',
    icon: CreditCard,
    badge: 'Sécurisé SSL',
    badgeClass: 'text-[#007A35]',
    badgeStyle: { backgroundColor: 'rgba(0,154,68,0.12)' },
    color: 'from-[#009A44] to-[#003D1C]',
    iconBg: '#009A44',
  },
  {
    id: 'wave' as PaymentMethod,
    name: 'Wave',
    subtitle: 'QR code ou numéro',
    icon: null,
    badge: 'Populaire',
    badgeClass: 'bg-cyan-100 text-cyan-700',
    color: 'from-[#1BC5CB] to-[#0e7490]',
    iconBg: '#1BC5CB',
  },
  {
    id: 'orange_money' as PaymentMethod,
    name: 'Orange Money',
    subtitle: 'Paiement mobile',
    icon: Smartphone,
    badge: 'Rapide',
    badgeClass: 'bg-orange-100 text-orange-700',
    color: 'from-[#FF6600] to-[#cc5200]',
    iconBg: '#FF6600',
  },
  {
    id: 'cash_on_delivery' as PaymentMethod,
    name: 'Paiement à la livraison',
    subtitle: 'Paiement en espèces',
    icon: Package,
    badge: '24-72h',
    badgeClass: 'bg-gray-100 text-gray-700',
    color: 'from-gray-600 to-gray-800',
    iconBg: '#475569',
  },
];

// ── QR Code display component ────────────────────────────────────────────────
function QRCodeDisplay({
  url,
  label,
  amount,
  onOpenDirect,
  accentColor,
  logo,
}: {
  url: string;
  label: string;
  amount: number;
  onOpenDirect: () => void;
  accentColor: string;
  logo: React.ReactNode;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [refreshKey]);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const expired = timeLeft === 0;

  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=240&margin=1&ecLevel=M&format=png`;

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeLeft(900);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div
        className="w-full rounded-xl p-6 mb-6 text-white text-center"
        style={{ background: `linear-gradient(135deg, ${accentColor}ee, ${accentColor}aa)` }}
      >
        <div className="flex justify-center mb-3">{logo}</div>
        <p style={{ color: 'rgba(255,255,255,0.8)' }} className="text-sm mb-1">Montant à payer</p>
        <p className="text-2xl font-bold">{formatPrice(amount)}</p>
      </div>

      {/* QR block */}
      <div className="relative mb-4">
        <div className={`p-3 bg-white rounded-xl shadow border-2 transition-all ${expired ? 'border-red-400 opacity-75' : 'border-gray-100'}`}>
          {refreshing ? (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ width: 200, height: 200 }}>
              <Loader2 size={32} className="text-gray-400" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <img
              key={refreshKey}
              src={qrUrl}
              alt="QR Code paiement"
              className="rounded-lg"
              style={{ width: 200, height: 200 }}
            />
          )}
        </div>
        {/* Logo badge on QR */}
        <div
          className="absolute bg-white rounded-full px-3 py-1 shadow border border-gray-100 flex items-center gap-2 text-sm font-semibold text-gray-600"
          style={{ bottom: '-12px', left: '50%', transform: 'translateX(-50%)' }}
        >
          <QrCode size={11} /> Scanner avec {label}
        </div>
      </div>

      {/* Timer */}
      <div className={`flex items-center gap-2 text-sm mt-6 mb-6 ${expired ? 'text-red-500' : 'text-gray-500'}`}>
        <Clock size={14} className="shrink-0" />
        {expired ? (
          <span className="font-semibold">QR expiré — actualisez pour continuer</span>
        ) : (
          <span>Expire dans <span className="font-mono font-bold">{minutes}:{seconds}</span></span>
        )}
      </div>

      {/* Steps */}
      <div className="w-full bg-gray-50 rounded-lg p-4 mb-4 flex flex-col gap-2">
        {[
          `Ouvrez l'application ${label}`,
          'Appuyez sur "Scanner" ou "Payer"',
          'Pointez la caméra vers le QR code',
          "Confirmez le paiement dans l'app",
        ].map((text, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm"
              style={{ width: 24, height: 24, background: accentColor }}
            >
              {i + 1}
            </div>
            <p className="text-sm text-gray-600 mb-0">{text}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-2">
        <button
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium border border-gray-300 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualiser le QR code
        </button>
        <button
          onClick={onOpenDirect}
          className="flex items-center justify-center gap-2 text-white rounded-lg text-sm font-semibold py-2"
          style={{ background: accentColor }}
        >
          <ExternalLink size={15} />
          Ouvrir {label} directement
        </button>
      </div>

      {/* Waiting notice */}
      <div className="mt-4 flex items-start gap-2 p-3 rounded-lg w-full" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
        <p className="text-sm mb-0" style={{ color: '#92400e' }}>
          <span className="font-semibold">Paiement en attente.</span> Votre commande sera confirmée automatiquement après réception du paiement.
        </p>
      </div>
    </div>
  );
}

// ── Phone payment confirmation screen ────────────────────────────────────────
function PhoneConfirmScreen({
  method,
  phone,
  amount,
  logo,
  accentColor,
  paymentUrl,
}: {
  method: string;
  phone: string;
  amount: number;
  logo: React.ReactNode;
  accentColor: string;
  paymentUrl: string;
}) {
  const [redirecting, setRedirecting] = useState(false);

  const handleRedirect = () => {
    setRedirecting(true);
    setTimeout(() => { window.location.href = paymentUrl; }, 800);
  };

  return (
    <div className="flex flex-col items-center text-center">
      {/* Header */}
      <div
        className="w-full rounded-xl p-6 mb-6 text-white"
        style={{ background: `linear-gradient(135deg, ${accentColor}ee, ${accentColor}99)` }}
      >
        <div className="flex justify-center mb-3">{logo}</div>
        <p style={{ color: 'rgba(255,255,255,0.7)' }} className="text-sm mb-1">Numéro enregistré</p>
        <p className="text-xl font-bold font-mono tracking-wider">{phone}</p>
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Montant à payer</p>
          <p className="text-2xl font-bold">{formatPrice(amount)}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 text-left flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-900 mb-2">Étapes à suivre :</p>
        {[
          { num: '1', text: `Vous serez redirigé vers ${method}` },
          { num: '2', text: `Entrez votre code PIN ${method}` },
          { num: '3', text: 'Confirmez le paiement par SMS' },
          { num: '4', text: 'Retournez sur Sunu Shop' },
        ].map(({ num, text }) => (
          <div key={num} className="flex items-center gap-3">
            <div
              className="rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm"
              style={{ width: 28, height: 28, background: accentColor }}
            >
              {num}
            </div>
            <p className="text-sm text-gray-600 mb-0">{text}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleRedirect}
        disabled={redirecting}
        className="w-full flex items-center justify-center gap-2 text-white rounded-lg font-semibold py-3 transition-opacity"
        style={{ background: accentColor, opacity: redirecting ? 0.7 : 1 }}
      >
        {redirecting ? (
          <><Loader2 size={18} className="animate-spin" /> Redirection en cours...</>
        ) : (
          <><ArrowRight size={18} /> Procéder au paiement</>
        )}
      </button>

      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <ShieldCheck size={12} style={{ color: '#009A44' }} />
        Transaction sécurisée — Aucune donnée bancaire stockée
      </div>
    </div>
  );
}

// ── Mode toggle (QR / Phone) ─────────────────────────────────────────────────
function ModeToggle({
  mode,
  onChange,
  accentColor,
}: {
  mode: MobilePayMode;
  onChange: (m: MobilePayMode) => void;
  accentColor: string;
}) {
  return (
    <div className="flex gap-1 p-1 bg-gray-50 rounded-lg mb-6">
      {[
        { value: 'qr' as MobilePayMode, icon: QrCode, label: 'QR Code' },
        { value: 'phone' as MobilePayMode, icon: Phone, label: 'Numéro' },
      ].map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold py-2 transition-all ${
            mode === value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Icon size={15} style={mode === value ? { color: accentColor } : {}} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, coupon } = useSelector((state: RootState) => state.cart);
  const subtotal = useSelector(selectCartTotal);
  const discount = coupon?.discount || 0;
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal - discount + shippingCost;

  const [step, setStep] = useState<CheckoutStep>('address');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [orderId, setOrderId] = useState<string | null>(null);

  // Stripe
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePaymentId, setStripePaymentId] = useState<string | null>(null);

  // Mobile pay modes
  const [waveMode, setWaveMode] = useState<MobilePayMode>('qr');
  const [omMode, setOmMode] = useState<MobilePayMode>('phone');
  const [wavePhone, setWavePhone] = useState('');
  const [omPhone, setOmPhone] = useState('');

  // Processing screens
  const [waveCheckoutUrl, setWaveCheckoutUrl] = useState<string | null>(null);
  const [omCheckoutUrl, setOmCheckoutUrl] = useState<string | null>(null);
  const [processingFor, setProcessingFor] = useState<'wave' | 'orange_money' | null>(null);
  const [processingPhoneUrl, setProcessingPhoneUrl] = useState<string | null>(null);

  // Cash on delivery
  const [codAcceptTerms, setCodAcceptTerms] = useState(false);
  const [codAcceptCash, setCodAcceptCash] = useState(false);
  const [codNote, setCodNote] = useState('');

  // Address
  const [address, setAddress] = useState({
    fullName: '', phone: '', street: '', city: 'Dakar', region: '', country: 'Sénégal', instructions: '',
  });

  useEffect(() => {
    if (items.length === 0 && !orderId) navigate('/panier');
  }, [items, navigate, orderId]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.street || !address.city) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setStep('payment');
  };

  const handlePayment = async () => {
    if (paymentMethod === 'wave' && waveMode === 'phone' && !wavePhone.trim()) {
      toast.error('Veuillez saisir votre numéro Wave');
      return;
    }
    if (paymentMethod === 'orange_money' && !omPhone.trim()) {
      toast.error('Veuillez saisir votre numéro Orange Money');
      return;
    }
    if (paymentMethod === 'cash_on_delivery' && (!codAcceptTerms || !codAcceptCash)) {
      toast.error('Veuillez cocher les deux cases de confirmation');
      return;
    }

    setLoading(true);
    try {
      const orderRes = await api.post('/orders', {
        items: items.map(item => ({ product: item._id, quantity: item.quantity, variant: item.variant })),
        shippingAddress: {
          ...address,
          instructions: paymentMethod === 'cash_on_delivery' ? codNote : address.instructions,
        },
        payment: { method: paymentMethod },
        couponCode: coupon?.code,
      });
      const order = orderRes.data.data;
      setOrderId(order._id);

      if (paymentMethod === 'cash_on_delivery') {
        dispatch(clearCart());
        navigate(`/payment/success?order=${order._id}&method=cash_on_delivery`);
        return;
      }

      if (paymentMethod === 'stripe') {
        const res = await api.post('/payments/stripe/create-intent', { orderId: order._id });
        setStripeClientSecret(res.data.data.clientSecret);
        setStripePaymentId(res.data.data.paymentId);
        setStep('processing');
        setLoading(false);
        return;
      }

      if (paymentMethod === 'wave') {
        const body: any = { orderId: order._id };
        if (waveMode === 'phone') body.phoneNumber = wavePhone;
        const res = await api.post('/payments/wave/initiate', body);
        const checkoutUrl = res.data.data.checkoutUrl;
        dispatch(clearCart());
        if (waveMode === 'phone') {
          setProcessingFor('wave');
          setProcessingPhoneUrl(checkoutUrl);
          setStep('processing');
          setLoading(false);
          return;
        }
        setWaveCheckoutUrl(checkoutUrl);
        setProcessingFor('wave');
        setStep('processing');
        setLoading(false);
        return;
      }

      if (paymentMethod === 'orange_money') {
        const res = await api.post('/payments/orange-money/initiate', {
          orderId: order._id,
          phoneNumber: omPhone,
        });
        const paymentUrl = res.data.data.paymentUrl;
        dispatch(clearCart());
        if (omMode === 'phone') {
          setProcessingFor('orange_money');
          setProcessingPhoneUrl(paymentUrl);
          setStep('processing');
          setLoading(false);
          return;
        }
        setOmCheckoutUrl(paymentUrl);
        setProcessingFor('orange_money');
        setStep('processing');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du traitement');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSuccess = async (paymentIntentId: string) => {
    try {
      await api.post('/payments/stripe/confirm', { paymentId: stripePaymentId, paymentIntentId });
      dispatch(clearCart());
      navigate(`/payment/success?order=${orderId}&method=stripe`);
    } catch {
      navigate(`/payment/failed?order=${orderId}&method=stripe`);
    }
  };

  const handleStripeError = () => navigate(`/payment/failed?order=${orderId}&method=stripe`);

  const currentStepIndex = step === 'address' ? 0 : step === 'payment' ? 1 : 2;

  const stepLabel3 =
    step === 'processing' && stripeClientSecret ? 'Carte' :
    step === 'processing' && processingFor === 'wave' ? 'Wave' :
    step === 'processing' && processingFor === 'orange_money' ? 'Orange Money' :
    'Confirmation';

  return (
    <>
      <Helmet><title>Commander — Sunu Shop</title></Helmet>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="container-custom">

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {['Adresse', 'Paiement', stepLabel3].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={{
                    width: 36, height: 36,
                    ...(i < currentStepIndex ? { background: '#009A44', color: '#fff' } :
                      i === currentStepIndex ? { background: 'linear-gradient(135deg,#009A44,#007A35)', color: '#fff', boxShadow: '0 4px 12px rgba(0,154,68,0.35)' } :
                      { background: '#e5e7eb', color: '#9ca3af' })
                  }}
                >
                  {i < currentStepIndex ? <Check size={16} /> : i + 1}
                </div>
                <span
                  className="text-sm font-semibold hidden sm:inline"
                  style={{ color: i <= currentStepIndex ? '#009A44' : '#9ca3af' }}
                >
                  {label}
                </span>
                {i < 2 && (
                  <div
                    className="rounded-full mx-1"
                    style={{ width: 40, height: 2, background: i < currentStepIndex ? '#009A44' : '#e5e7eb' }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-6">

                {/* ══ STEP 1 — ADRESSE ═════════════════════════════════════ */}
                {step === 'address' && (
                  <form onSubmit={handleCreateOrder}>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-900">
                        <div className="rounded-full flex items-center justify-center" style={{ width: 32, height: 32, background: 'rgba(0,154,68,0.1)' }}>
                          <MapPin size={16} style={{ color: '#009A44' }} />
                        </div>
                        Adresse de livraison
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Nom complet *</label>
                          <input type="text" value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })} className="input-field" placeholder="Prénom Nom" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Téléphone *</label>
                          <input type="tel" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} className="input-field" placeholder="+221 77 123 45 67" required />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1">Adresse *</label>
                          <input type="text" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} className="input-field" placeholder="Rue, quartier, numéro" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Ville *</label>
                          <input type="text" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="input-field" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Pays</label>
                          <select value={address.country} onChange={e => setAddress({ ...address, country: e.target.value })} className="input-field">
                            <option>Sénégal</option>
                            <option>Mali</option>
                            <option>Guinée</option>
                            <option>Côte d'Ivoire</option>
                            <option>Burkina Faso</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1">Instructions de livraison</label>
                          <textarea value={address.instructions} onChange={e => setAddress({ ...address, instructions: e.target.value })} className="input-field" rows={2} placeholder="Indications pour le livreur..." />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary mt-6">
                        Continuer vers le paiement →
                      </button>
                    </div>
                  </form>
                )}

                {/* ══ STEP 2 — PAIEMENT ════════════════════════════════════ */}
                {step === 'payment' && (
                  <div className="flex flex-col gap-6">

                    {/* Method selector */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-900">
                        <div className="rounded-full flex items-center justify-center" style={{ width: 32, height: 32, background: 'rgba(0,154,68,0.1)' }}>
                          <CreditCard size={16} style={{ color: '#009A44' }} />
                        </div>
                        Méthode de paiement
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PAYMENT_METHODS.map(method => {
                          const active = paymentMethod === method.id;
                          return (
                            <label
                              key={method.id}
                              className={`relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer w-full transition-all ${active ? 'shadow-sm' : ''}`}
                              style={{
                                borderColor: active ? '#009A44' : '#e5e7eb',
                                background: active ? 'rgba(0,154,68,0.05)' : '',
                              }}
                            >
                              <input type="radio" name="payment" value={method.id} checked={active} onChange={() => setPaymentMethod(method.id)} className="sr-only" />

                              <div
                                className="rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                                style={{ width: 44, height: 44, background: `linear-gradient(135deg, ${method.iconBg}ee, ${method.iconBg}aa)` }}
                              >
                                {method.id === 'wave' && <WaveLogo variant="icon" size="sm" />}
                                {method.id === 'orange_money' && <OrangeMoneyLogo variant="icon" size="sm" />}
                                {method.icon && <method.icon size={20} className="text-white" />}
                              </div>

                              <div className="flex-1" style={{ minWidth: 0 }}>
                                <p className="font-semibold text-sm text-gray-900 mb-0">{method.name}</p>
                                <p className="text-sm text-gray-500 mb-0">{method.subtitle}</p>
                              </div>

                              <span
                                className={`rounded-full text-xs font-bold px-2 py-0.5 ${method.badgeClass}`}
                                style={(method as any).badgeStyle || {}}
                              >
                                {method.badge}
                              </span>

                              {active && (
                                <div
                                  className="absolute top-0 right-0 m-2 rounded-full flex items-center justify-center"
                                  style={{ width: 16, height: 16, backgroundColor: '#009A44' }}
                                >
                                  <Check size={9} className="text-white" />
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Carte bancaire ── */}
                    {paymentMethod === 'stripe' && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="rounded-lg flex items-center justify-center" style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #009A44, #003D1C)' }}>
                            <CreditCard size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 mb-0">Carte Visa / Mastercard</p>
                            <p className="text-sm text-gray-500 mb-0">Paiement 3D Secure — sécurisé par Stripe</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2">
                          {[
                            'Chiffrement SSL 256 bits',
                            'Visa Secure & Mastercard Identity Check',
                            'Aucune donnée bancaire stockée',
                          ].map(t => (
                            <div key={t} className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle size={14} style={{ color: '#009A44' }} className="shrink-0" /> {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Wave ── */}
                    {paymentMethod === 'wave' && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <WaveLogo size="md" />
                          <div>
                            <p className="font-bold text-gray-900 mb-0">Payer avec Wave</p>
                            <p className="text-sm text-gray-500 mb-0">Choisissez votre mode de paiement</p>
                          </div>
                        </div>

                        <ModeToggle mode={waveMode} onChange={setWaveMode} accentColor="#1BC5CB" />

                        {waveMode === 'qr' && (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#ecfeff', border: '1px solid #a5f3fc' }}>
                              <QrCode size={22} style={{ color: '#1BC5CB' }} className="shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-gray-900 mb-0">QR Code Wave</p>
                                <p className="text-sm text-gray-500 mb-0">Un QR code unique sera généré après confirmation. Scannez-le avec l'app Wave.</p>
                              </div>
                            </div>
                            {[
                              'Ouvrez Wave sur votre téléphone',
                              'Appuyez sur "Scanner" ou "Payer"',
                              'Scannez le QR code affiché',
                              "Confirmez le montant dans l'app",
                            ].map((t, i) => (
                              <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="rounded-full flex items-center justify-center shrink-0 text-sm font-bold" style={{ width: 20, height: 20, background: 'rgba(27,197,203,0.15)', color: '#1BC5CB' }}>{i + 1}</div>
                                {t}
                              </div>
                            ))}
                          </div>
                        )}

                        {waveMode === 'phone' && (
                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Numéro Wave *</label>
                              <div className="relative">
                                <Phone size={15} className="absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: '#1BC5CB' }} />
                                <input
                                  type="tel"
                                  value={wavePhone}
                                  onChange={e => setWavePhone(e.target.value)}
                                  className="input-field"
                                  style={{ paddingLeft: 36 }}
                                  placeholder="+221 77 XXX XX XX"
                                />
                              </div>
                              <p className="text-sm text-gray-500 mt-1">Numéro associé à votre compte Wave</p>
                            </div>
                            <div className="rounded-lg p-3 text-sm" style={{ background: '#ecfeff', border: '1px solid #a5f3fc', color: '#0e7490' }}>
                              Vous serez redirigé vers Wave pour saisir votre code PIN et confirmer le paiement.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Orange Money ── */}
                    {paymentMethod === 'orange_money' && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <OrangeMoneyLogo size="md" />
                          <p className="text-sm text-gray-500 mb-0">Choisissez votre mode de paiement</p>
                        </div>

                        <ModeToggle mode={omMode} onChange={setOmMode} accentColor="#FF6600" />

                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-1">Numéro Orange Money *</label>
                          <div className="relative">
                            <Phone size={15} className="absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: '#FF6600' }} />
                            <input
                              type="tel"
                              value={omPhone}
                              onChange={e => setOmPhone(e.target.value)}
                              className="input-field"
                              style={{ paddingLeft: 36 }}
                              placeholder="+221 77 XXX XX XX"
                            />
                          </div>
                        </div>

                        {omMode === 'qr' && (
                          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                            <QrCode size={22} style={{ color: '#FF6600' }} className="shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900 mb-0">QR Code Orange Money</p>
                              <p className="text-sm text-gray-500 mb-0">Un QR code de paiement sera généré. Scannez avec votre application Orange Money.</p>
                            </div>
                          </div>
                        )}

                        {omMode === 'phone' && (
                          <div className="rounded-lg p-3 text-sm" style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}>
                            Vous serez redirigé vers Orange Money. Confirmez le paiement par SMS avec votre code PIN.
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Cash on delivery ── */}
                    {paymentMethod === 'cash_on_delivery' && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="rounded-lg flex items-center justify-center" style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #4b5563, #1f2937)' }}>
                            <Package size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 mb-0">Paiement à la livraison</p>
                            <p className="text-sm text-gray-500 mb-0">Payez en espèces à la réception</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                          {[
                            { icon: Clock, label: 'Délai', value: '24 — 72h' },
                            { icon: Package, label: 'Mode', value: 'Espèces uniquement' },
                            { icon: ShieldCheck, label: 'Garantie', value: 'Vérification réception' },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                              <Icon size={18} className="text-gray-400 mx-auto mb-1" />
                              <p className="text-gray-500 uppercase text-xs mb-0" style={{ fontSize: '10px' }}>{label}</p>
                              <p className="text-sm font-semibold text-gray-900 mb-0">{value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-1">
                            Note pour le livreur <span className="text-gray-400 font-normal">(optionnel)</span>
                          </label>
                          <textarea value={codNote} onChange={e => setCodNote(e.target.value)} className="input-field" rows={2} placeholder="Ex: Appeler avant d'arriver..." />
                        </div>

                        <div className="flex flex-col gap-3 border-t border-gray-100 pt-6">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Confirmation requise</p>
                          {[
                            { checked: codAcceptTerms, onChange: setCodAcceptTerms, text: 'Je confirme vouloir payer à la réception en espèces' },
                            { checked: codAcceptCash, onChange: setCodAcceptCash, text: 'Je comprends que le colis ne sera pas remis sans paiement complet' },
                          ].map(({ checked, onChange, text }) => (
                            <label
                              key={text}
                              className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                              style={{ borderColor: checked ? '#009A44' : '#e5e7eb', background: checked ? 'rgba(0,154,68,0.05)' : '' }}
                            >
                              <div
                                className="rounded border-2 flex items-center justify-center shrink-0 mt-0.5"
                                style={{ width: 20, height: 20, borderColor: checked ? '#009A44' : '#d1d5db', background: checked ? '#009A44' : '' }}
                              >
                                {checked && <Check size={11} className="text-white" />}
                              </div>
                              <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
                              <span className="text-sm text-gray-600">{text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
                      <ShieldCheck size={13} style={{ color: '#009A44' }} className="shrink-0" />
                      Vos informations sont chiffrées et sécurisées.
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep('address')} className="btn-outline px-6">← Retour</button>
                      <button
                        onClick={handlePayment}
                        disabled={loading || (paymentMethod === 'cash_on_delivery' && (!codAcceptTerms || !codAcceptCash))}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                        style={{
                          opacity: (loading || (paymentMethod === 'cash_on_delivery' && (!codAcceptTerms || !codAcceptCash))) ? 0.5 : 1,
                          cursor: (loading || (paymentMethod === 'cash_on_delivery' && (!codAcceptTerms || !codAcceptCash))) ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {loading ? (
                          <><Loader2 size={17} className="animate-spin" /> Traitement...</>
                        ) : paymentMethod === 'cash_on_delivery' ? 'Confirmer la commande →' : `Payer ${formatPrice(total)} →`}
                      </button>
                    </div>
                  </div>
                )}

                {/* ══ STEP 3 — PROCESSING ══════════════════════════════════ */}
                {step === 'processing' && (
                  <>
                    {stripeClientSecret && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-lg mb-6 text-gray-900 flex items-center gap-2">
                          <CreditCard size={18} style={{ color: '#009A44' }} /> Paiement par carte bancaire
                        </h3>
                        <StripePaymentForm
                          clientSecret={stripeClientSecret}
                          onSuccess={handleStripeSuccess}
                          onError={handleStripeError}
                          amount={total}
                        />
                      </div>
                    )}

                    {processingFor === 'wave' && waveCheckoutUrl && !processingPhoneUrl && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <QRCodeDisplay
                          url={waveCheckoutUrl}
                          label="Wave"
                          amount={total}
                          accentColor="#1BC5CB"
                          logo={<WaveLogo size="md" />}
                          onOpenDirect={() => window.open(waveCheckoutUrl, '_blank')}
                        />
                      </div>
                    )}

                    {processingFor === 'wave' && processingPhoneUrl && !waveCheckoutUrl && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <PhoneConfirmScreen
                          method="Wave"
                          phone={wavePhone}
                          amount={total}
                          accentColor="#1BC5CB"
                          logo={<WaveLogo size="md" />}
                          paymentUrl={processingPhoneUrl}
                        />
                      </div>
                    )}

                    {processingFor === 'orange_money' && omCheckoutUrl && !processingPhoneUrl && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <QRCodeDisplay
                          url={omCheckoutUrl}
                          label="Orange Money"
                          amount={total}
                          accentColor="#FF6600"
                          logo={<OrangeMoneyLogo size="md" />}
                          onOpenDirect={() => window.open(omCheckoutUrl, '_blank')}
                        />
                      </div>
                    )}

                    {processingFor === 'orange_money' && processingPhoneUrl && !omCheckoutUrl && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <PhoneConfirmScreen
                          method="Orange Money"
                          phone={omPhone}
                          amount={total}
                          accentColor="#FF6600"
                          logo={<OrangeMoneyLogo size="md" />}
                          paymentUrl={processingPhoneUrl}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-28">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Votre commande</h3>
                <div className="flex flex-col gap-3 mb-4 overflow-y-auto" style={{ maxHeight: 256 }}>
                  {items.map(item => (
                    <div key={`${item._id}-${item.variant?.value}`} className="flex gap-3">
                      <img src={item.image} alt="" className="rounded-lg object-cover shrink-0" style={{ width: 56, height: 56, background: '#f3f4f6' }} />
                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <p className="text-sm font-medium truncate text-gray-900 mb-0">{item.name}</p>
                        {item.variant && <p className="text-sm text-gray-500 mb-0">{item.variant.name}: {item.variant.value}</p>}
                        <p className="text-sm text-gray-500 mb-0">Qté: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold whitespace-nowrap text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-4 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Sous-total</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between text-gray-600">
                    <span>Livraison</span>
                    <span>{shippingCost === 0 ? <span className="font-semibold" style={{ color: '#009A44' }}>Gratuite 🎉</span> : formatPrice(shippingCost)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between font-medium" style={{ color: '#009A44' }}>
                      <span>Réduction{coupon?.code ? ` (${coupon.code})` : ''}</span>
                      <span>−{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                    <span>Total</span><span>{formatPrice(total)}</span>
                  </div>
                </div>

                {step !== 'address' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">Mode de paiement</p>
                    <div className="flex items-center gap-2">
                      {paymentMethod === 'wave' && <WaveLogo size="xs" />}
                      {paymentMethod === 'orange_money' && <OrangeMoneyLogo size="xs" />}
                      {paymentMethod === 'stripe' && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center px-2 rounded" style={{ height: 24, background: '#1a1f71' }}><span className="text-white font-black italic text-sm">VISA</span></div>
                          <div className="flex">
                            <div className="rounded-full" style={{ width: 20, height: 20, background: '#ef4444' }} />
                            <div className="rounded-full" style={{ width: 20, height: 20, background: '#facc15', marginLeft: -8 }} />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">Carte</span>
                        </div>
                      )}
                      {paymentMethod === 'cash_on_delivery' && (
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">À la livraison</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-gray-500" style={{ fontSize: '11px' }}>
                  <ShieldCheck size={11} style={{ color: '#009A44' }} /> Paiement sécurisé & chiffré
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
