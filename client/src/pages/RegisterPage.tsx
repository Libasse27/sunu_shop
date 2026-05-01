import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../features/auth/authSlice';
import { RootState, AppDispatch } from '../store/store';
import { RegisterSidePanel } from '../components/auth/RegisterSidePanel';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
    <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
    <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
    <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
    <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
  </svg>
);

const FACEBOOK_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

type PasswordRule = { label: string; test: (p: string) => boolean };
const PASSWORD_RULES: PasswordRule[] = [
  { label: '8 caractères minimum', test: (p) => p.length >= 8 },
  { label: 'Une majuscule', test: (p) => /[A-Z]/.test(p) },
  { label: 'Un chiffre', test: (p) => /[0-9]/.test(p) },
  { label: 'Un caractère spécial', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password: string) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (!password) return { score: 0, label: '', color: '' };
  if (passed <= 1) return { score: 1, label: 'Faible', color: '#E31B23' };
  if (passed === 2) return { score: 2, label: 'Moyen', color: '#FCD116' };
  if (passed === 3) return { score: 3, label: 'Fort', color: '#009A44' };
  return { score: 4, label: 'Très fort', color: '#009A44' };
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth);

  const strength = getStrength(form.password);

  useEffect(() => {
    if (user) navigate('/');
    return () => { dispatch(clearError()); };
  }, [user, navigate, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (localError) setLocalError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (form.password !== form.confirmPassword) {
      setLocalError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!PASSWORD_RULES[0].test(form.password)) {
      setLocalError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!acceptTerms) {
      setLocalError('Veuillez accepter les conditions générales.');
      return;
    }
    dispatch(registerUser({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    }));
  };

  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <>
      <Helmet>
        <title>Inscription — Sunu Shop</title>
        <meta name="description" content="Créez votre compte Sunu Shop et accédez à 2000+ produits tech livrés au Sénégal, Mali et Guinée." />
      </Helmet>

      <div className="min-h-screen flex bg-gray-50">
        <RegisterSidePanel />

        {/* ── Formulaire ── */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 overflow-y-auto">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <Link to="/" className="flex lg:hidden justify-center mb-7 no-underline">
              <img src="/logo.svg" alt="Sunu Shop" style={{ height: '3.25rem', width: 'auto', maxWidth: '220px' }} />
            </Link>

            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
              <p className="text-gray-500 text-sm mt-1">
                Déjà membre ?{' '}
                <Link to="/connexion" className="text-primary font-semibold no-underline hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>

            {/* Error */}
            {(error || localError) && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 text-sm p-3.5 rounded-xl mb-6">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{localError || error}</span>
              </div>
            )}

            {/* OAuth */}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => { window.location.href = `${API_BASE}/auth/google`; }}
                className="flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 shadow-sm"
              >
                {GOOGLE_ICON}
                Google
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = `${API_BASE}/auth/facebook`; }}
                className="flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 shadow-sm"
              >
                {FACEBOOK_ICON}
                Facebook
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">ou par email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Nom / Prénom */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                  <input
                    type="text" name="firstName" value={form.firstName} onChange={handleChange}
                    className="input-field" placeholder="Aminata" required autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                  <input
                    type="text" name="lastName" value={form.lastName} onChange={handleChange}
                    className="input-field" placeholder="Diallo" required autoComplete="family-name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  className="input-field" placeholder="votre@email.com" required autoComplete="email"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Téléphone
                  <span className="ml-1.5 text-xs font-normal text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="tel" name="phone" value={form.phone} onChange={handleChange}
                  className="input-field" placeholder="+221 77 123 45 67" autoComplete="tel"
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" value={form.password} onChange={handleChange}
                    className="input-field pr-11" placeholder="Min. 8 caractères" required
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Jauge + règles */}
                {form.password && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.score ? strength.color : '#e5e7eb' }} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {PASSWORD_RULES.map((rule) => {
                        const ok = rule.test(form.password);
                        return (
                          <div key={rule.label} className="flex items-center gap-1.5">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${ok ? 'bg-primary' : 'bg-gray-200'}`}>
                              {ok && <Check size={8} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className={`text-xs transition-colors ${ok ? 'text-gray-700' : 'text-gray-400'}`}>
                              {rule.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                    className={`input-field pr-11 ${passwordsMismatch ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15' : ''} ${passwordsMatch ? 'border-primary' : ''}`}
                    placeholder="••••••••" required autoComplete="new-password"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {passwordsMatch && <Check size={14} className="text-primary" strokeWidth={2.5} />}
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                      aria-label={showConfirm ? 'Masquer' : 'Afficher'}>
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                {passwordsMismatch && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              {/* CGU */}
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 shrink-0"
                />
                <span className="text-sm text-gray-600 leading-snug">
                  J'accepte les{' '}
                  <Link to="/conditions-generales" className="text-primary font-medium no-underline hover:underline">
                    conditions générales d'utilisation
                  </Link>
                  {' '}et la{' '}
                  <Link to="/politique-de-confidentialite" className="text-primary font-medium no-underline hover:underline">
                    politique de confidentialité
                  </Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading || passwordsMismatch}
                className="btn-primary w-full h-11 text-sm mt-1"
              >
                {isLoading ? (
                  <span
                    className="w-5 h-5 rounded-full border-2 border-white border-t-transparent inline-block"
                    style={{ animation: 'spin 0.7s linear infinite' }}
                  />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Créer mon compte
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </>
  );
}
