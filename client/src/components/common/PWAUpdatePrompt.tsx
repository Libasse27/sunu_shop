import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Affiche une bannière en bas de page quand une nouvelle version de l'app est disponible.
 * L'utilisateur peut accepter la mise à jour ou la reporter.
 */
export default function PWAUpdatePrompt() {
  const [show, setShow] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) console.log('[PWA] Service Worker enregistré');
    },
    onRegisterError(error) {
      console.error('[PWA] Erreur enregistrement SW:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) setShow(true);
  }, [needRefresh]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Nouvelle version disponible</p>
          <p className="text-xs text-gray-500">Rechargez pour bénéficier des dernières améliorations.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShow(false)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
          >
            Plus tard
          </button>
          <button
            onClick={() => updateServiceWorker(true)}
            className="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Mettre à jour
          </button>
        </div>
      </div>
    </div>
  );
}
