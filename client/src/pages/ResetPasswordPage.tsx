import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { getApiError } from '../utils/getApiError';

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '#e5e7eb' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Faible', color: '#E31B23' };
  if (score === 2) return { level: 2, label: 'Moyen', color: '#FCD116' };
  if (score === 3) return { level: 3, label: 'Fort', color: '#009A44' };
  return { level: 4, label: 'Très fort', color: '#007A35' };
}

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Le mot de passe doit contenir au moins une majuscule');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Le mot de passe doit contenir au moins un chiffre');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/connexion', { state: { message: 'Mot de passe réinitialisé avec succès !' } });
      }, 2500);
    } catch (err: unknown) {
      setError(getApiError(err, 'Lien invalide ou expiré. Veuillez demander un nouveau lien.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Réinitialiser le mot de passe — Sunu Shop</title></Helmet>
      <div className="flex items-center justify-center py-12 px-4" style={{ minHeight: '80vh' }}>
        <div className="w-full" style={{ maxWidth: 448 }}>
          {!success ? (
            <>
              <div className="text-center mb-6">
                <div
                  className="rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ width: 64, height: 64, backgroundColor: 'rgba(0,154,68,0.10)' }}
                >
                  <Lock size={28} style={{ color: '#009A44' }} />
                </div>
                <h1 className="font-bold text-2xl" style={{ color: '#1A1A2E' }}>Nouveau mot de passe</h1>
                <p className="text-gray-500 text-sm mt-2 mb-0">
                  Choisissez un mot de passe fort pour sécuriser votre compte.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Pan-African strip */}
                <div className="flex" style={{ height: '3px' }}>
                  <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
                  <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
                  <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
                </div>
              <div className="p-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Nouveau mot de passe</label>
                    <div className="relative">
                      <Lock size={18} className="absolute text-gray-400" style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: 40, paddingRight: 40 }}
                        placeholder="Min. 8 caractères"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute border-0 bg-transparent text-gray-400 hover:text-gray-600"
                        style={{ right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Strength indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="flex-1 rounded-full transition-colors"
                              style={{
                                height: 4,
                                backgroundColor: i <= strength.level ? strength.color : '#e5e7eb',
                                transition: 'background-color 0.2s',
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mb-0">{strength.label}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Confirmer le mot de passe</label>
                    <div className="relative">
                      <Lock size={18} className="absolute text-gray-400" style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: 40, paddingRight: 40 }}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute border-0 bg-transparent text-gray-400 hover:text-gray-600"
                        style={{ right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-red-500 mt-1 mb-0">Les mots de passe ne correspondent pas</p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-sm mt-1 mb-0" style={{ color: '#009A44' }}>Les mots de passe correspondent ✓</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span
                        className="rounded-full border-2 border-white inline-block"
                        style={{ width: 20, height: 20, borderTopColor: 'transparent', animation: 'spin 0.75s linear infinite' }}
                      />
                    ) : 'Réinitialiser le mot de passe'}
                  </button>
                </form>
              </div>
              </div>

              <div className="text-center mt-6">
                <Link to="/mot-de-passe-oublie" className="text-sm text-gray-500">
                  Demander un nouveau lien
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div
                className="rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #009A44, #007A35)' }}
              >
                <CheckCircle size={40} className="text-white" />
              </div>
              <h1 className="font-bold text-2xl mb-2" style={{ color: '#1A1A2E' }}>Mot de passe réinitialisé !</h1>
              <p className="text-gray-500 text-sm mb-6">
                Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la connexion…
              </p>
              <Link to="/connexion" className="btn-primary inline-flex items-center gap-2">
                Se connecter maintenant
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
