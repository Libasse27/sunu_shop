import { useEffect, useRef } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface AdminConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
  variant?: 'danger' | 'warning';
}

export default function AdminConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmer la suppression',
  message = 'Cette action est irréversible. Voulez-vous vraiment continuer ?',
  confirmLabel = 'Supprimer',
  loading = false,
  variant = 'danger',
}: AdminConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus le bouton de confirmation à l'ouverture (accessibilité)
  useEffect(() => {
    if (open) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [open]);

  // Fermer avec Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  const iconColor = variant === 'danger' ? '#E31B23' : '#9A7A00';
  const iconBg = variant === 'danger' ? '#fdeaea' : '#fffde6';
  const confirmBg = variant === 'danger' ? '#E31B23' : '#CCB000';
  const confirmHoverBg = variant === 'danger' ? '#B81219' : '#9A7A00';

  return (
    /* Overlay */
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Dialog */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
        style={{ animation: 'dialogIn 0.15s ease-out' }}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 border-0 bg-transparent cursor-pointer transition-colors disabled:opacity-50"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        {/* Icône */}
        <div
          className="flex items-center justify-center rounded-full mb-4 mx-auto"
          style={{ width: 56, height: 56, backgroundColor: iconBg }}
        >
          <AlertTriangle size={26} style={{ color: iconColor }} />
        </div>

        {/* Titre */}
        <h2
          id="confirm-dialog-title"
          className="text-center text-base font-bold text-gray-900 mb-2"
        >
          {title}
        </h2>

        {/* Message */}
        <p className="text-center text-sm text-gray-500 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border-0 cursor-pointer transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white border-0 cursor-pointer transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            style={{
              backgroundColor: loading ? confirmBg : confirmBg,
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = confirmHoverBg;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = confirmBg;
            }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'En cours...' : confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dialogIn {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
