import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../features/auth/authSlice';
import { RootState, AppDispatch } from '../store/store';

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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth);

  const from = (location.state as any)?.from?.pathname || '/';
  const successMessage = (location.state as any)?.message as string | undefined;
  const oauthError = searchParams.get('error');

  const oauthErrorMsg = oauthError === 'google'
    ? 'La connexion avec Google a échoué. Veuillez réessayer.'
    : oauthError === 'facebook'
    ? 'La connexion avec Facebook a échoué. Veuillez réessayer.'
    : oauthError === 'callback'
    ? 'Erreur lors de la connexion sociale. Veuillez réessayer.'
    : null;

  useEffect(() => {
    if (user) navigate(from, { replace: true });
    return () => { dispatch(clearError()); };
  }, [user, navigate, from, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <>
      <Helmet>
        <title>Connexion — Sunu Shop</title>
        <meta name="description" content="Connectez-vous à votre compte Sunu Shop pour accéder à vos commandes et favoris." />
      </Helmet>

      <div className="min-h-screen flex bg-gray-50">

        {/* ── Panneau gauche ── */}
        <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden flex-col"
          style={{ background: 'linear-gradient(155deg, #052e16 0%, #009A44 60%, #00C756 100%)' }}
        >
          {/* Grille décorative */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          {/* Cercles lumineux */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #FCD116 0%, transparent 70%)' }} />
          <div className="absolute bottom-10 -left-16 w-56 h-56 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #00C756 0%, transparent 70%)' }} />

          <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
            {/* Logo */}
            <Link to="/" className="no-underline w-fit">
              <div className="inline-flex items-center px-4 py-2 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)' }}>
                <img src="/logo.svg" alt="Sunu Shop" style={{ height: '3.25rem', width: 'auto', maxWidth: '220px' }} />
              </div>
            </Link>

            {/* Central content */}
            <div className="flex-1 flex flex-col justify-center mt-12">
              <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold w-fit"
                style={{ background: 'rgba(252,209,22,0.2)', color: '#FCD116' }}>
                ✦ Plateforme N°1 en Afrique de l'Ouest
              </div>
              <h2 className="text-white font-bold mt-4 leading-tight"
                style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)' }}>
                Bienvenue sur<br />votre espace tech
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Accédez à des milliers de produits tech authentiques,<br />
                livrés directement au Sénégal, Mali et Guinée.
              </p>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { value: '2 000+', label: 'Produits' },
                  { value: '15k+', label: 'Clients' },
                  { value: '48h', label: 'Livraison' },
                ].map(({ value, label }) => (
                  <div key={label} className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                    <div className="text-white font-bold text-lg">{value}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="mt-8 flex flex-col gap-3">
                {[
                  { icon: '🚚', text: 'Livraison gratuite dès 25 000 FCFA' },
                  { icon: '📱', text: 'Paiement Orange Money & Wave' },
                  { icon: '🔧', text: 'Techniciens certifiés à Dakar' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-base">{icon}</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <p className="text-xs mt-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              © 2025 Sunu Shop · Dakar, Sénégal
            </p>
          </div>
        </div>

        {/* ── Formulaire ── */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <Link to="/" className="flex lg:hidden justify-center mb-8 no-underline">
              <img src="/logo.svg" alt="Sunu Shop" style={{ height: '3.25rem', width: 'auto', maxWidth: '220px' }} />
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
              <p className="text-gray-500 text-sm mt-1">
                Pas encore de compte ?{' '}
                <Link to="/inscription" className="text-primary font-semibold no-underline hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>

            {/* Alerts */}
            {successMessage && (
              <div className="flex items-start gap-3 text-sm p-3.5 rounded-xl mb-6" style={{ backgroundColor: 'rgba(0,154,68,0.08)', border: '1px solid rgba(0,154,68,0.2)', color: '#007A35' }}>
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}
            {(error || oauthErrorMsg) && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 text-sm p-3.5 rounded-xl mb-6">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{oauthErrorMsg || error}</span>
              </div>
            )}

            {/* OAuth buttons */}
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
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Mot de passe</label>
                  <Link to="/mot-de-passe-oublie" className="text-xs text-primary font-medium no-underline hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-11"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  Se souvenir de moi
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full h-11 text-sm relative"
              >
                {isLoading ? (
                  <span
                    className="w-5 h-5 rounded-full border-2 border-white border-t-transparent inline-block"
                    style={{ animation: 'spin 0.7s linear infinite' }}
                  />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Se connecter
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-8 leading-relaxed">
              En vous connectant, vous acceptez nos{' '}
              <Link to="/conditions-generales" className="underline hover:text-gray-600">CGU</Link>
              {' '}et notre{' '}
              <Link to="/politique-de-confidentialite" className="underline hover:text-gray-600">politique de confidentialité</Link>.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
