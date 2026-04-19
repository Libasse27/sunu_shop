import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import api from '../services/api';

type Status = 'loading' | 'success' | 'already' | 'error';

export default function NewsletterUnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('Lien de désinscription manquant ou invalide.');
      setStatus('error');
      return;
    }

    api
      .get(`/newsletter/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((res) => {
        const msg: string = res.data?.message ?? '';
        if (msg.includes('déjà')) {
          setStatus('already');
        } else {
          setStatus('success');
        }
        setMessage(msg);
      })
      .catch((err) => {
        setMessage(err?.response?.data?.message || 'Lien invalide ou déjà utilisé.');
        setStatus('error');
      });
  }, [token]);

  const config: Record<Status, { icon: React.ReactNode; title: string; color: string; bg: string }> = {
    loading: {
      icon: <Loader2 size={40} className="animate-spin text-white" />,
      title: 'Traitement en cours…',
      color: '#009A44',
      bg: 'rgba(0,154,68,0.1)',
    },
    success: {
      icon: <CheckCircle size={40} className="text-white" />,
      title: 'Désinscription réussie',
      color: '#009A44',
      bg: 'rgba(0,154,68,0.1)',
    },
    already: {
      icon: <CheckCircle size={40} className="text-white" />,
      title: 'Déjà désinscrit(e)',
      color: '#64748B',
      bg: 'rgba(100,116,139,0.1)',
    },
    error: {
      icon: <XCircle size={40} className="text-white" />,
      title: 'Lien invalide',
      color: '#E31B23',
      bg: 'rgba(227,27,35,0.1)',
    },
  };

  const { icon, title, color, bg } = config[status];

  return (
    <>
      <Helmet>
        <title>Désinscription newsletter — Sunu Shop</title>
      </Helmet>

      {/* Pan-African strip */}
      <div className="flex" style={{ height: 4 }}>
        <div className="flex-1" style={{ background: '#009A44' }} />
        <div className="flex-1" style={{ background: '#FCD116' }} />
        <div className="flex-1" style={{ background: '#E31B23' }} />
      </div>

      <div className="container-custom py-16 flex justify-center">
        <div
          className="w-full rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          style={{ maxWidth: 480 }}
        >
          {/* Top accent */}
          <div style={{ height: 6, background: color }} />

          <div className="p-10 text-center">
            {/* Icon bubble */}
            <div
              className="flex items-center justify-center rounded-full mx-auto mb-6"
              style={{ width: 80, height: 80, background: color }}
            >
              {icon}
            </div>

            <h1 className="font-bold text-2xl text-gray-900 mb-3">{title}</h1>

            {message && (
              <p
                className="text-sm rounded-xl px-4 py-3 mb-6"
                style={{ background: bg, color }}
              >
                {message}
              </p>
            )}

            {status === 'success' && (
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Votre adresse a bien été retirée de notre liste. Vous ne recevrez plus nos newsletters.
              </p>
            )}

            {status === 'error' && (
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Ce lien est invalide ou a déjà été utilisé. Si le problème persiste,{' '}
                <Link to="/contact" className="text-primary underline">contactez-nous</Link>.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/boutique"
                className="btn-primary"
              >
                Retour à la boutique
              </Link>
              {(status === 'success' || status === 'already') && (
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Mail size={15} />
                  Se réinscrire
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
