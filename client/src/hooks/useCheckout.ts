import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { RootState } from '../store/store';
import { selectCartTotal, clearCart } from '../features/cart/cartSlice';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../utils/constants';
import api from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────
export type CheckoutStep  = 'address' | 'payment';
export type PaymentMethod = 'wave' | 'orange_money' | 'cash_on_delivery' | 'stripe';

export interface SavedAddress {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region?: string;
  country: string;
  isDefault: boolean;
}

export interface PaymentSettings {
  waveQrCodeUrl:          string;
  wavePhoneNumber:        string;
  orangeMoneyQrCodeUrl:   string;
  orangeMoneyPhoneNumber: string;
}

export interface AmountBreakdown {
  subtotal:       number;
  shippingCost:   number;
  discount:       number;
  couponCode?:    string;
  total:          number;
  isFreeShipping: boolean;
}

export interface PaymentIntent {
  token:     string;
  amount:    number;
  breakdown: AmountBreakdown;
  expiresAt: string;
}

export interface AddressForm {
  fullName:     string;
  phone:        string;
  street:       string;
  city:         string;
  region:       string;
  country:      string;
  instructions: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useCheckout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, coupon } = useSelector((state: RootState) => state.cart);
  const subtotal     = useSelector(selectCartTotal);
  const discount     = coupon?.discount || 0;
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

  // ── State ──────────────────────────────────────────────────────────────────
  const [step,          setStep]          = useState<CheckoutStep>('address');
  const [loading,       setLoading]       = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wave');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  const [intent,        setIntent]        = useState<PaymentIntent | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentExpired, setIntentExpired] = useState(false);
  const intentTokenRef = useRef<string | null>(null);

  const [address, setAddress] = useState<AddressForm>({
    fullName: '', phone: '', street: '', city: 'Dakar',
    region: '', country: 'Sénégal', instructions: '',
  });

  const [codAcceptTerms, setCodAcceptTerms] = useState(false);
  const [codAcceptCash,  setCodAcceptCash]  = useState(false);
  const [codNote,        setCodNote]        = useState('');

  // Stripe
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePaymentId,    setStripePaymentId]    = useState<string | null>(null);
  const [stripeOrderId,      setStripeOrderId]      = useState<string | null>(null);
  const [stripeLoading,      setStripeLoading]      = useState(false);

  // ── Computed (déclaré avant les useEffect qui les utilisent en deps) ─────────
  const isMobilePayment = paymentMethod === 'wave' || paymentMethod === 'orange_money';

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (items.length === 0) navigate('/panier');
  }, [items, navigate]);

  useEffect(() => {
    api.get('/payment-settings')
      .then(res => setPaymentSettings(res.data.data))
      .catch(() => {});
    // Charge les adresses sauvegardées et pré-remplit avec l'adresse par défaut
    api.get('/users/me/addresses')
      .then(res => {
        const addrs: SavedAddress[] = res.data.data || [];
        setSavedAddresses(addrs);
        const def = addrs.find(a => a.isDefault) ?? addrs[0];
        if (def) {
          setAddress({
            fullName:     def.fullName,
            phone:        def.phone,
            street:       def.street,
            city:         def.city,
            region:       def.region || '',
            country:      def.country,
            instructions: '',
          });
        }
      })
      .catch(() => {});
  }, []);

  // Invalide l'intention côté serveur si le client quitte la page
  useEffect(() => {
    return () => {
      if (intentTokenRef.current) {
        api.delete(`/payments/intent/${intentTokenRef.current}`).catch(() => {});
      }
    };
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────────
  const isStripe = paymentMethod === 'stripe';

  const qrCodeUrl = paymentMethod === 'wave'
    ? (paymentSettings?.waveQrCodeUrl || '')
    : (paymentSettings?.orangeMoneyQrCodeUrl || '');

  const phoneNumber = paymentMethod === 'wave'
    ? (paymentSettings?.wavePhoneNumber || '')
    : (paymentSettings?.orangeMoneyPhoneNumber || '');

  const displayAmount = intent?.amount ?? (subtotal - discount + shippingCost);

  const canConfirm = !loading && (
    paymentMethod === 'cash_on_delivery'
      ? codAcceptTerms && codAcceptCash
      : paymentMethod === 'stripe'
        ? false  // Stripe confirme via son propre bouton dans StripePaymentForm
        : !intentLoading && !!intent && !intentExpired
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  const fetchStripeIntent = useCallback(async () => {
    setStripeLoading(true);
    setStripeClientSecret(null);
    setStripeOrderId(null);
    setStripePaymentId(null);
    try {
      // 1. Créer la commande en statut pending
      const orderRes = await api.post('/orders', {
        items:           items.map(i => ({ product: i._id, quantity: i.quantity, variant: i.variant })),
        shippingAddress: address,
        payment:         { method: 'stripe' },
        couponCode:      coupon?.code,
      });
      const orderId = orderRes.data.data._id;
      setStripeOrderId(orderId);
      // 2. Obtenir le clientSecret Stripe
      const intentRes = await api.post('/payments/stripe/create-intent', { orderId });
      setStripeClientSecret(intentRes.data.data.clientSecret);
      setStripePaymentId(intentRes.data.data.paymentId);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Erreur lors de la préparation du paiement Stripe');
    } finally {
      setStripeLoading(false);
    }
  // address, items, coupon are stable refs during step transition — intentional deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStripeSuccess = async (paymentIntentId: string) => {
    if (!stripePaymentId || !stripeOrderId) return;
    setLoading(true);
    try {
      await api.post('/payments/stripe/confirm', {
        paymentId:       stripePaymentId,
        paymentIntentId,
      });
      dispatch(clearCart());
      navigate(`/payment/success?order=${stripeOrderId}&method=stripe`);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Erreur lors de la confirmation du paiement');
    } finally {
      setLoading(false);
    }
  };

  const fetchIntent = useCallback(async () => {
    setIntentLoading(true);
    setIntentExpired(false);
    setIntent(null);
    try {
      const res = await api.post('/payments/intent', {
        items:      items.map(i => ({ productId: i._id, quantity: i.quantity, variant: i.variant })),
        couponCode: coupon?.code,
      });
      const data: PaymentIntent = res.data.data;
      setIntent(data);
      intentTokenRef.current = data.token;
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Impossible de calculer le montant');
    } finally {
      setIntentLoading(false);
    }
  // items and coupon are read at call time — intentional stable snapshot
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Déclenche le pré-chargement de l'intent quand on passe à l'étape paiement.
  // Placé ici pour que fetchIntent/fetchStripeIntent soient déjà déclarés.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (step === 'payment' && isMobilePayment) fetchIntent();
    if (step === 'payment' && paymentMethod === 'stripe') fetchStripeIntent();
  }, [step, paymentMethod, isMobilePayment, fetchIntent, fetchStripeIntent]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.street || !address.city) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'cash_on_delivery' && (!codAcceptTerms || !codAcceptCash)) {
      toast.error('Veuillez cocher les deux cases de confirmation');
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === 'cash_on_delivery') {
        const res = await api.post('/orders', {
          items:           items.map(i => ({ product: i._id, quantity: i.quantity, variant: i.variant })),
          shippingAddress: { ...address, instructions: codNote || address.instructions },
          payment:         { method: 'cash_on_delivery' },
          couponCode:      coupon?.code,
        });
        dispatch(clearCart());
        navigate(`/payment/success?order=${res.data.data._id}&method=cash_on_delivery`);
        return;
      }

      if (!intent || intentExpired) {
        toast.error('Le temps de paiement a expiré. Veuillez rafraîchir.');
        return;
      }

      const res = await api.post('/payments/confirm', {
        token:           intent.token,
        clientAmount:    intent.amount,
        items:           items.map(i => ({ product: i._id, quantity: i.quantity, variant: i.variant })),
        shippingAddress: address,
        payment:         { method: paymentMethod },
        couponCode:      coupon?.code,
      });

      intentTokenRef.current = null;
      dispatch(clearCart());
      navigate(`/payment/success?order=${res.data.data.order._id}&method=${paymentMethod}`);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || 'Erreur lors du traitement');
    } finally {
      setLoading(false);
    }
  };

  const handleIntentExpire = () => {
    setIntentExpired(true);
    toast.error('Le temps de paiement a expiré. Cliquez sur "Actualiser" pour continuer.', { duration: 6000 });
  };

  const fillFromSavedAddress = (addr: SavedAddress) => {
    setAddress({
      fullName:     addr.fullName,
      phone:        addr.phone,
      street:       addr.street,
      city:         addr.city,
      region:       addr.region || '',
      country:      addr.country,
      instructions: '',
    });
  };

  return {
    // state
    step, setStep,
    loading,
    paymentMethod, setPaymentMethod,
    paymentSettings,
    savedAddresses,
    fillFromSavedAddress,
    intent, intentLoading, intentExpired,
    address, setAddress,
    codAcceptTerms, setCodAcceptTerms,
    codAcceptCash,  setCodAcceptCash,
    codNote,        setCodNote,
    // computed
    isMobilePayment,
    isStripe,
    qrCodeUrl,
    phoneNumber,
    displayAmount,
    canConfirm,
    subtotal,
    discount,
    shippingCost,
    items,
    coupon,
    // stripe
    stripeClientSecret,
    stripeLoading,
    handleStripeSuccess,
    // actions
    fetchIntent,
    handleAddressSubmit,
    handleConfirmPayment,
    handleIntentExpire,
  };
}
