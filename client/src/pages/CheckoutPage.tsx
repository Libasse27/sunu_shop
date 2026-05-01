import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Smartphone, Package, MapPin, ShieldCheck,
  Loader2, CheckCircle, Check, Clock, Lock, RefreshCw, AlertCircle,
  Mail, Phone, Eye, EyeOff, LogIn, UserPlus,
} from 'lucide-react';
import { RootState, AppDispatch } from '../store/store';
import { loginUser, registerUser } from '../features/auth/authSlice';
import { formatPrice } from '../utils/formatPrice';
import WaveLogo from '../components/payment/WaveLogo';
import OrangeMoneyLogo from '../components/payment/OrangeMoneyLogo';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import { InlineQRPanel } from '../components/checkout/CheckoutPaymentPanel';
import { useCheckout } from '../hooks/useCheckout';

// ── Config méthodes de paiement ───────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'wave' as const,             name: 'Wave',           subtitle: 'QR code',    badge: 'Populaire',    badgeClass: 'bg-cyan-100 text-cyan-700',    iconBg: '#1BC5CB', accentColor: '#1BC5CB' },
  { id: 'orange_money' as const,     name: 'Orange Money',   subtitle: 'QR code',    badge: 'Rapide',       badgeClass: 'bg-orange-100 text-orange-700', iconBg: '#FF6600', accentColor: '#FF6600' },
  { id: 'stripe' as const,           name: 'Carte bancaire', subtitle: 'Visa / MC',  badge: 'International', badgeClass: 'bg-blue-100 text-blue-700',    iconBg: '#635BFF', accentColor: '#635BFF' },
  { id: 'cash_on_delivery' as const, name: 'À la livraison', subtitle: 'Espèces',    badge: '24-72h',       badgeClass: 'bg-gray-100 text-gray-700',    iconBg: '#475569', accentColor: '#475569' },
];

export default function CheckoutPage() {
  const co = useCheckout();
  const activeMethod = PAYMENT_METHODS.find(m => m.id === co.paymentMethod)!;

  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();

  // ── Guest wall state ────────────────────────────────────────────────────────
  const [guestMode, setGuestMode] = useState<'login' | 'register'>('login');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState('');
  const [showGuestPass, setShowGuestPass] = useState(false);

  const handleGuestAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError('');
    setGuestLoading(true);
    try {
      if (guestMode === 'login') {
        await dispatch(loginUser({ email: guestEmail, password: guestPassword })).unwrap();
      } else {
        await dispatch(registerUser({
          firstName: guestFirstName,
          lastName: guestLastName,
          email: guestEmail,
          password: guestPassword,
          phone: guestPhone,
        })).unwrap();
      }
      // Auth succeeded — component re-renders with user set, wall disappears
    } catch (err: unknown) {
      // rejectWithValue returns a plain string; a thrown Error has .message
      const message = typeof err === 'string'
        ? err
        : (err as { message?: string })?.message || 'Une erreur est survenue';
      setGuestError(message);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Commander — Sunu Shop</title></Helmet>

      {/* ── Guest auth wall (shown only when user is not logged in) ── */}
      {!user ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center rounded-2xl mb-4"
                style={{ width: 64, height: 64, background: 'rgba(0,154,68,0.1)' }}>
                <LogIn size={28} style={{ color: '#009A44' }} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Finaliser la commande</h1>
              <p className="text-gray-500 text-sm">Connectez-vous ou créez un compte pour continuer</p>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: '#f1f5f9' }}>
              {(['login', 'register'] as const).map((mode) => (
                <button key={mode} type="button"
                  onClick={() => { setGuestMode(mode); setGuestError(''); }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border-0"
                  style={{
                    background: guestMode === mode ? 'white' : 'transparent',
                    color: guestMode === mode ? '#009A44' : '#6b7280',
                    boxShadow: guestMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {mode === 'login' ? (
                    <span className="flex items-center justify-center gap-1.5"><LogIn size={14} /> Se connecter</span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5"><UserPlus size={14} /> Créer un compte</span>
                  )}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleGuestAuth}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">

              {guestMode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Prénom *</label>
                    <input type="text" value={guestFirstName} onChange={e => setGuestFirstName(e.target.value)}
                      className="input-field" placeholder="Fatou" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom *</label>
                    <input type="text" value={guestLastName} onChange={e => setGuestLastName(e.target.value)}
                      className="input-field" placeholder="Ba" required />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                    className="input-field pl-9" placeholder="votre@email.com" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mot de passe *</label>
                <div className="relative">
                  <input type={showGuestPass ? 'text' : 'password'} value={guestPassword}
                    onChange={e => setGuestPassword(e.target.value)}
                    className="input-field pr-10" placeholder="••••••••" required
                    minLength={guestMode === 'register' ? 8 : undefined} />
                  <button type="button" onClick={() => setShowGuestPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0 border-0 bg-transparent text-gray-400"
                    aria-label={showGuestPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                    {showGuestPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {guestMode === 'register' && (
                  <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
                )}
              </div>

              {guestMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                      className="input-field pl-9" placeholder="+221 77 123 45 67" required />
                  </div>
                </div>
              )}

              {guestError && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  {guestError}
                </div>
              )}

              <button type="submit" disabled={guestLoading}
                className="btn-primary py-3 font-bold flex items-center justify-center gap-2">
                {guestLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> {guestMode === 'login' ? 'Connexion...' : 'Création...'}</>
                ) : guestMode === 'login' ? (
                  <><LogIn size={18} /> Se connecter et commander</>
                ) : (
                  <><UserPlus size={18} /> Créer mon compte et commander</>
                )}
              </button>

              {guestMode === 'login' && (
                <Link to="/mot-de-passe-oublie" className="text-center text-xs text-gray-400 hover:text-gray-600">
                  Mot de passe oublié ?
                </Link>
              )}
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              Votre panier est conservé.{' '}
              <Link to="/panier" className="underline text-gray-500">Retour au panier</Link>
            </p>
          </div>
        </div>
      ) : (
        /* ─── Checkout content (authenticated users only) ─── */
        <div className="min-h-screen bg-gray-50 py-6">
          <div className="container-custom">

            {/* ── Barre de progression ──────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-2 mb-10">
              {['Adresse', 'Paiement'].map((label, i) => {
                const idx = co.step === 'address' ? 0 : 1;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ width: 36, height: 36, ...(i < idx ? { background: '#009A44', color: '#fff' } : i === idx ? { background: 'linear-gradient(135deg,#009A44,#007A35)', color: '#fff', boxShadow: '0 4px 12px rgba(0,154,68,0.3)' } : { background: '#e5e7eb', color: '#9ca3af' }) }}>
                      {i < idx ? <Check size={16} /> : i + 1}
                    </div>
                    <span className="text-sm font-semibold hidden sm:inline" style={{ color: i <= idx ? '#009A44' : '#9ca3af' }}>{label}</span>
                    {i < 1 && <div className="rounded-full mx-1" style={{ width: 40, height: 2, background: i < idx ? '#009A44' : '#e5e7eb' }} />}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">

                {/* ══ ÉTAPE 1 — ADRESSE ════════════════════════════════════════ */}
                {co.step === 'address' && (
                  <form onSubmit={co.handleAddressSubmit}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900">
                        <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 32, height: 32, background: 'rgba(0,154,68,0.1)' }}>
                          <MapPin size={16} style={{ color: '#009A44' }} />
                        </div>
                        Adresse de livraison
                      </h2>

                      {/* Adresses sauvegardées */}
                      {co.savedAddresses.length > 0 && (
                        <div className="mb-5">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mes adresses enregistrées</p>
                          <div className="flex flex-wrap gap-2">
                            {co.savedAddresses.map(addr => {
                              const isSelected = co.address.fullName === addr.fullName && co.address.street === addr.street;
                              return (
                                <button key={addr._id} type="button" onClick={() => co.fillFromSavedAddress(addr)}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all"
                                  style={{ borderColor: isSelected ? '#009A44' : '#e5e7eb', background: isSelected ? 'rgba(0,154,68,0.06)' : 'white', color: '#374151' }}>
                                  <span>{addr.label === 'domicile' ? '🏠' : addr.label === 'bureau' ? '🏢' : '📍'}</span>
                                  <span className="font-medium">{addr.fullName}</span>
                                  <span className="text-gray-400 text-xs">— {addr.city}</span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 border-t border-gray-200" />
                            <span className="text-xs text-gray-400">ou modifier ci-dessous</span>
                            <div className="flex-1 border-t border-gray-200" />
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Nom complet *', key: 'fullName', type: 'text',  placeholder: 'Prénom Nom',         required: true },
                          { label: 'Téléphone *',   key: 'phone',    type: 'tel',   placeholder: '+221 77 123 45 67',  required: true },
                        ].map(({ label, key, type, placeholder, required }) => (
                          <div key={key}>
                            <label className="block text-sm font-medium mb-1">{label}</label>
                            <input type={type} value={(co.address as unknown as Record<string, string>)[key]}
                              onChange={e => co.setAddress({ ...co.address, [key]: e.target.value })}
                              className="input-field" placeholder={placeholder} required={required} />
                          </div>
                        ))}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1">Adresse *</label>
                          <input type="text" value={co.address.street}
                            onChange={e => co.setAddress({ ...co.address, street: e.target.value })}
                            className="input-field" placeholder="Rue, quartier, numéro" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Ville *</label>
                          <input type="text" value={co.address.city}
                            onChange={e => co.setAddress({ ...co.address, city: e.target.value })}
                            className="input-field" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Pays</label>
                          <select value={co.address.country}
                            onChange={e => co.setAddress({ ...co.address, country: e.target.value })}
                            className="input-field">
                            {['Sénégal', 'Mali', 'Guinée', "Côte d'Ivoire", 'Burkina Faso'].map(p => <option key={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1">Instructions <span className="text-gray-400 font-normal">(optionnel)</span></label>
                          <textarea value={co.address.instructions}
                            onChange={e => co.setAddress({ ...co.address, instructions: e.target.value })}
                            className="input-field" rows={2} placeholder="Indications pour le livreur..." />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-6">
                        <Link to="/panier" className="btn-outline px-4 shrink-0 flex items-center gap-1.5 text-sm">
                          ← Panier
                        </Link>
                        <button type="submit" className="btn-primary flex-1">Choisir le paiement →</button>
                      </div>
                    </div>
                  </form>
                )}

                {/* ══ ÉTAPE 2 — PAIEMENT ═══════════════════════════════════════ */}
                {co.step === 'payment' && (
                  <div className="flex flex-col gap-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                      {/* Récap adresse de livraison */}
                      <div className="mb-5 p-3 rounded-xl flex items-start gap-3 text-sm"
                        style={{ background: 'rgba(0,154,68,0.05)', border: '1px solid rgba(0,154,68,0.15)' }}>
                        <MapPin size={16} style={{ color: '#009A44' }} className="mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 mb-0">{co.address.fullName}</p>
                          <p className="text-gray-500 mb-0">{co.address.street}, {co.address.city}</p>
                          <p className="text-gray-400 mb-0">{co.address.phone}</p>
                        </div>
                        <button type="button" onClick={() => co.setStep('address')}
                          className="text-xs font-semibold border-0 bg-transparent shrink-0"
                          style={{ color: '#009A44' }}>
                          Modifier
                        </button>
                      </div>

                      <h2 className="font-bold text-lg mb-5 flex items-center gap-2 text-gray-900">
                        <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 32, height: 32, background: 'rgba(0,154,68,0.1)' }}>
                          <Smartphone size={16} style={{ color: '#009A44' }} />
                        </div>
                        Méthode de paiement
                      </h2>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {PAYMENT_METHODS.map(method => {
                          const active = co.paymentMethod === method.id;
                          return (
                            <label key={method.id}
                              className="relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all text-center select-none"
                              style={{ borderColor: active ? method.accentColor : '#e5e7eb', background: active ? method.accentColor + '08' : 'white' }}>
                              <input type="radio" name="payment" value={method.id} checked={active}
                                onChange={() => co.setPaymentMethod(method.id)} className="sr-only" />
                              <div className="rounded-xl flex items-center justify-center shadow-sm"
                                style={{ width: 48, height: 48, background: `linear-gradient(135deg, ${method.iconBg}ee, ${method.iconBg}88)` }}>
                                {method.id === 'wave'             && <WaveLogo variant="icon" size="sm" />}
                                {method.id === 'orange_money'     && <OrangeMoneyLogo variant="icon" size="sm" />}
                                {method.id === 'stripe'           && <Lock size={20} className="text-white" />}
                                {method.id === 'cash_on_delivery' && <Package size={20} className="text-white" />}
                              </div>
                              <div>
                                <p className="font-semibold text-xs sm:text-sm text-gray-900 mb-0">{method.name}</p>
                                <p className="text-xs text-gray-400 mb-0">{method.subtitle}</p>
                              </div>
                              <span className={`rounded-full text-xs font-bold px-2 py-0.5 ${method.badgeClass}`}>{method.badge}</span>
                              {active && (
                                <div className="absolute top-2 right-2 rounded-full flex items-center justify-center"
                                  style={{ width: 18, height: 18, backgroundColor: method.accentColor }}>
                                  <Check size={10} className="text-white" />
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>

                      {/* QR inline */}
                      {co.isMobilePayment && (
                        co.intentExpired ? (
                          <div className="mt-4 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-red-200 bg-red-50">
                            <Clock size={32} className="text-red-400" />
                            <p className="text-sm font-semibold text-red-700 mb-0">Session expirée</p>
                            <p className="text-xs text-red-500 text-center mb-0">Le temps alloué pour ce paiement est écoulé.</p>
                            <button onClick={co.fetchIntent}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white border-0"
                              style={{ backgroundColor: activeMethod.accentColor }}>
                              <RefreshCw size={14} /> Actualiser le montant
                            </button>
                          </div>
                        ) : (
                          <InlineQRPanel
                            name={activeMethod.name}
                            qrCodeUrl={co.intentLoading ? '' : co.qrCodeUrl}
                            phoneNumber={co.phoneNumber}
                            intent={co.intentLoading ? null : co.intent}
                            accentColor={activeMethod.accentColor}
                            onIntentExpire={co.handleIntentExpire}
                            logo={co.paymentMethod === 'wave' ? <WaveLogo size="sm" /> : <OrangeMoneyLogo size="sm" />}
                          />
                        )
                      )}

                      {/* Stripe */}
                      {co.isStripe && (
                        <div className="mt-4">
                          {co.stripeLoading ? (
                            <div className="flex items-center justify-center gap-3 py-10 text-sm text-gray-500">
                              <Loader2 size={18} className="animate-spin" />
                              Préparation du paiement sécurisé…
                            </div>
                          ) : co.stripeClientSecret ? (
                            <StripePaymentForm
                              clientSecret={co.stripeClientSecret}
                              amount={co.displayAmount}
                              onSuccess={co.handleStripeSuccess}
                              onError={() => {}}
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-4 rounded-xl text-sm"
                              style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                              <AlertCircle size={16} />
                              Impossible d'initier le paiement Stripe. Veuillez choisir une autre méthode.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Paiement à la livraison */}
                      {co.paymentMethod === 'cash_on_delivery' && (
                        <div className="mt-4 flex flex-col gap-4">
                          <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {[
                                { icon: Clock, label: 'Délai', value: '24 — 72h' },
                                { icon: Package, label: 'Mode', value: 'Espèces' },
                                { icon: ShieldCheck, label: 'Garantie', value: 'À réception' },
                              ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-white rounded-lg p-3 text-center shadow-sm">
                                  <Icon size={16} className="text-gray-400 mx-auto mb-1" />
                                  <p className="text-gray-400 uppercase mb-0" style={{ fontSize: 9 }}>{label}</p>
                                  <p className="text-xs font-semibold text-gray-800 mb-0">{value}</p>
                                </div>
                              ))}
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Note pour le livreur <span className="text-gray-400 font-normal">(optionnel)</span></label>
                              <textarea value={co.codNote} onChange={e => co.setCodNote(e.target.value)}
                                className="input-field" rows={2} placeholder="Ex: Appeler avant d'arriver..." />
                            </div>
                          </div>
                          <div className="flex flex-col gap-3">
                            <p className="text-sm font-semibold text-gray-900">Confirmation requise</p>
                            {[
                              { checked: co.codAcceptTerms, onChange: co.setCodAcceptTerms, text: 'Je confirme vouloir payer à la réception en espèces' },
                              { checked: co.codAcceptCash,  onChange: co.setCodAcceptCash,  text: 'Le colis ne sera pas remis sans paiement complet' },
                            ].map(({ checked, onChange, text }) => (
                              <label key={text}
                                className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
                                style={{ borderColor: checked ? '#009A44' : '#e5e7eb', background: checked ? 'rgba(0,154,68,0.04)' : '' }}>
                                <div className="rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                                  style={{ width: 20, height: 20, borderColor: checked ? '#009A44' : '#d1d5db', background: checked ? '#009A44' : '' }}>
                                  {checked && <Check size={11} className="text-white" />}
                                </div>
                                <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
                                <span className="text-sm text-gray-600">{text}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
                      <ShieldCheck size={12} style={{ color: '#009A44' }} />
                      Vos informations sont chiffrées et sécurisées.
                    </div>
                    {/* Stripe : son propre bouton est dans StripePaymentForm — on n'affiche que retour */}
                    {co.isStripe ? (
                      <button onClick={() => co.setStep('address')} className="btn-outline px-5 self-start">← Retour</button>
                    ) : (
                      <div className="flex gap-3">
                        <button onClick={() => co.setStep('address')} className="btn-outline px-5 shrink-0">← Retour</button>
                        <button onClick={co.handleConfirmPayment} disabled={!co.canConfirm}
                          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-base font-bold"
                          style={{ opacity: !co.canConfirm ? 0.5 : 1, cursor: !co.canConfirm ? 'not-allowed' : 'pointer' }}>
                          {co.loading ? (
                            <><Loader2 size={18} className="animate-spin" /> Traitement...</>
                          ) : co.paymentMethod === 'cash_on_delivery' ? (
                            'Confirmer la commande →'
                          ) : (
                            <><CheckCircle size={18} /> J'ai payé — Confirmer</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Récapitulatif sidebar ──────────────────────────────────── */}
              <div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-28">
                  <h3 className="font-bold text-base mb-4 text-gray-900">Votre commande</h3>
                  <div className="flex flex-col gap-3 mb-4 overflow-y-auto" style={{ maxHeight: 240 }}>
                    {co.items.map(item => (
                      <div key={`${item._id}-${item.variant?.value ?? ''}`} className="flex gap-3">
                        <div className="rounded-xl overflow-hidden shrink-0 bg-gray-100" style={{ width: 52, height: 52 }}>
                          {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-900 mb-0">{item.name}</p>
                          {item.variant && <p className="text-xs text-gray-400 mb-0">{item.variant.name}: {item.variant.value}</p>}
                          <p className="text-xs text-gray-400 mb-0">Qté: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-bold whitespace-nowrap text-gray-900 shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex flex-col gap-2 text-sm">
                    {co.intent?.breakdown ? (
                      <>
                        <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{formatPrice(co.intent.breakdown.subtotal)}</span></div>
                        <div className="flex justify-between text-gray-500">
                          <span>Livraison</span>
                          <span>{co.intent.breakdown.isFreeShipping
                            ? <span className="font-semibold" style={{ color: '#009A44' }}>Gratuite 🎉</span>
                            : formatPrice(co.intent.breakdown.shippingCost)}</span>
                        </div>
                        {co.intent.breakdown.discount > 0 && (
                          <div className="flex justify-between font-medium" style={{ color: '#009A44' }}>
                            <span>Réduction{co.intent.breakdown.couponCode ? ` (${co.intent.breakdown.couponCode})` : ''}</span>
                            <span>−{formatPrice(co.intent.breakdown.discount)}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                          <span className="flex items-center gap-1.5"><Lock size={11} style={{ color: '#009A44' }} /> Total</span>
                          <span>{formatPrice(co.intent.breakdown.total)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{formatPrice(co.subtotal)}</span></div>
                        <div className="flex justify-between text-gray-500">
                          <span>Livraison</span>
                          <span>{co.shippingCost === 0
                            ? <span style={{ color: '#009A44' }} className="font-semibold">Gratuite 🎉</span>
                            : formatPrice(co.shippingCost)}</span>
                        </div>
                        {co.discount > 0 && (
                          <div className="flex justify-between font-medium" style={{ color: '#009A44' }}>
                            <span>Réduction</span><span>−{formatPrice(co.discount)}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                          <span>Total</span><span>{formatPrice(co.displayAmount)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {co.step === 'payment' && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">Mode de paiement</p>
                      <div className="flex items-center gap-2">
                        {co.paymentMethod === 'wave'             && <WaveLogo size="xs" />}
                        {co.paymentMethod === 'orange_money'     && <OrangeMoneyLogo size="xs" />}
                        {co.paymentMethod === 'stripe'           && <><Lock size={14} style={{ color: '#635BFF' }} /><span className="text-sm font-medium text-gray-600">Carte bancaire</span></>}
                        {co.paymentMethod === 'cash_on_delivery' && (
                          <><Package size={14} className="text-gray-400" /><span className="text-sm font-medium text-gray-600">À la livraison</span></>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-1.5 text-gray-400" style={{ fontSize: 11 }}>
                    <ShieldCheck size={11} style={{ color: '#009A44' }} />
                    Paiement sécurisé & chiffré
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
