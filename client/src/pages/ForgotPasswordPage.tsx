import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, Lock, CheckCircle, ArrowLeft, Send } from 'lucide-react';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch {
      // Silently ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Mot de passe oublié — Sunu Shop</title></Helmet>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="w-full" style={{ maxWidth: 448 }}>

          {!sent ? (
            <>
              {/* Icon */}
              <div className="text-center mb-6">
                <div
                  className="rounded-xl flex items-center justify-center mx-auto mb-4 shadow"
                  style={{ background: 'linear-gradient(135deg, #009A44, #007A35)', width: 72, height: 72 }}
                >
                  <Lock size={30} className="text-white" />
                </div>
                <h1 className="font-bold text-gray-900 text-2xl">Mot de passe oublié ?</h1>
                <p className="text-gray-500 text-sm mt-2 mx-auto mb-0" style={{ maxWidth: 280 }}>
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {/* Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Pan-African strip */}
                <div className="flex" style={{ height: 4 }}>
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
                      <label className="block text-sm font-semibold mb-1" style={{ color: '#374151' }}>Adresse email</label>
                      <div className="relative">
                        <Mail size={17} className="absolute text-gray-400" style={{ left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-field"
                          style={{ paddingLeft: 40 }}
                          placeholder="votre@email.com"
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                      {loading ? (
                        <span className="flex items-center gap-2 justify-center">
                          <span
                            className="rounded-full border-2 border-white inline-block"
                            style={{ width: 16, height: 16, borderTopColor: 'transparent', animation: 'spin 0.75s linear infinite' }}
                          />
                          Envoi en cours...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 justify-center">
                          <Send size={16} /> Envoyer le lien de réinitialisation
                        </span>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              <div className="text-center mt-6">
                <Link to="/connexion" className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <ArrowLeft size={15} /> Retour à la connexion
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Success icon */}
              <div className="text-center mb-6">
                <div
                  className="rounded-xl flex items-center justify-center mx-auto mb-4 shadow"
                  style={{ background: 'linear-gradient(135deg, #009A44, #007A35)', width: 72, height: 72 }}
                >
                  <CheckCircle size={30} className="text-white" />
                </div>
                <h1 className="font-bold text-gray-900 text-2xl">Email envoyé !</h1>
              </div>

              {/* Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex" style={{ height: 4 }}>
                  <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
                  <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
                  <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
                </div>
                <div className="p-6 text-center">
                  <p className="text-gray-500 mb-1">Un lien de réinitialisation a été envoyé à</p>
                  <p className="font-bold text-gray-900 text-lg mb-4">{email}</p>

                  <div
                    className="rounded-lg p-4 mb-6 text-left flex flex-col gap-2"
                    style={{ backgroundColor: 'rgba(0,154,68,0.08)', border: '1px solid rgba(0,154,68,0.20)' }}
                  >
                    {[
                      'Vérifiez votre boîte mail (et les spams)',
                      "Cliquez sur le lien dans l'email reçu",
                      'Le lien expire dans 1 heure',
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-900">
                        <div
                          className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
                          style={{ width: 20, height: 20, backgroundColor: '#009A44', fontSize: 11 }}
                        >
                          {i + 1}
                        </div>
                        {step}
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-gray-500 mb-4">Vous n'avez pas reçu l'email ?</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="btn-outline text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="rounded-full inline-block"
                          style={{ width: 16, height: 16, border: '2px solid rgba(0,154,68,0.30)', borderTopColor: '#009A44', animation: 'spin 0.75s linear infinite' }}
                        />
                        Renvoi...
                      </span>
                    ) : "Renvoyer l'email"}
                  </button>
                </div>
              </div>

              <div className="text-center mt-6">
                <Link to="/connexion" className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <ArrowLeft size={15} /> Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
