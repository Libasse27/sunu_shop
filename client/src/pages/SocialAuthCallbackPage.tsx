import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setSocialCredentials } from '../features/auth/authSlice';
import { AppDispatch } from '../store/store';
import api from '../services/api';

export default function SocialAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      navigate('/connexion?error=callback', { replace: true });
      return;
    }

    // Échange le code OTP usage unique (30s) contre l'accessToken réel
    api.get(`/auth/social/exchange?code=${encodeURIComponent(code)}`)
      .then(({ data }) => {
        dispatch(setSocialCredentials({ accessToken: data.data.accessToken, user: data.data.user }));
        window.history.replaceState({}, '', '/auth/social/callback');
        navigate('/', { replace: true });
      })
      .catch(() => {
        navigate('/connexion?error=callback', { replace: true });
      });
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div
          className="rounded-full border-4 mx-auto mb-3"
          style={{
            width: 48,
            height: 48,
            borderStyle: 'solid',
            borderColor: '#009A44',
            borderTopColor: 'transparent',
            animation: 'spin 0.75s linear infinite',
          }}
        />
        <p className="text-gray-500 mb-0">Connexion en cours...</p>
      </div>
    </div>
  );
}
