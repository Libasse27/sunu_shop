// ─── Zone d'upload QR Code (Wave / Orange Money) ─────────────────────────────

import { useRef, useState } from 'react';
import { QrCode, Upload, Loader2, Phone, Image as ImageIcon, X } from 'lucide-react';
import { adminUploadApi } from '../../../services/admin.api';
import toast from 'react-hot-toast';

interface Props {
  label: string;
  logo: React.ReactNode;
  accentColor: string;
  currentUrl: string;
  phoneNumber: string;
  onUrlChange: (url: string) => void;
  onPhoneChange: (phone: string) => void;
}

export function QRUploadZone({ label, logo, accentColor, currentUrl, phoneNumber, onUrlChange, onPhoneChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Fichier image uniquement (PNG, JPG, WebP)');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await adminUploadApi.uploadImage(fd);
      onUrlChange(data.data?.url || data.data?.secure_url || '');
      toast.success('QR code uploadé');
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
        {logo}
        <div>
          <h3 className="font-bold text-gray-900 text-base mb-0">{label}</h3>
          <p className="text-sm text-gray-500 mb-0">QR code et numéro de téléphone pour le paiement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone QR code */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <QrCode size={15} style={{ color: accentColor }} />
            Image du QR code
          </label>

          <div
            className="relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors"
            style={{ borderColor: currentUrl ? accentColor : '#d1d5db', backgroundColor: currentUrl ? `${accentColor}08` : '#fafafa', minHeight: 180 }}
            onClick={() => !uploading && fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            {uploading ? (
              <Loader2 size={28} className="animate-spin" style={{ color: accentColor }} />
            ) : currentUrl ? (
              <>
                <img src={currentUrl} alt="QR code" className="rounded-lg object-contain" style={{ maxWidth: 160, maxHeight: 160 }} />
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onUrlChange(''); }}
                    className="p-1 rounded-full bg-white shadow border border-gray-200 text-gray-400 hover:text-red-500"
                  >
                    <X size={13} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 absolute bottom-2">Cliquez pour remplacer</p>
              </>
            ) : (
              <>
                <div className="rounded-full flex items-center justify-center" style={{ width: 48, height: 48, backgroundColor: `${accentColor}15` }}>
                  <Upload size={20} style={{ color: accentColor }} />
                </div>
                <div className="text-center px-4">
                  <p className="text-sm font-semibold text-gray-700 mb-0">Déposez le QR code ici</p>
                  <p className="text-xs text-gray-400 mb-0">ou cliquez pour parcourir</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP — 2 MB max</p>
                </div>
              </>
            )}
            <input
              ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          <div className="mt-3">
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
              <ImageIcon size={11} /> Ou coller une URL directement
            </label>
            <input
              type="url" value={currentUrl}
              onChange={e => onUrlChange(e.target.value)}
              placeholder="https://res.cloudinary.com/..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* Numéro de téléphone */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Phone size={15} style={{ color: accentColor }} />
            Numéro de téléphone {label}
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Affiché dans le checkout comme alternative au QR code si le client préfère envoyer manuellement.
          </p>
          <input
            type="tel" value={phoneNumber}
            onChange={e => onPhoneChange(e.target.value)}
            placeholder="+221 77 XXX XX XX"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />

          {(currentUrl || phoneNumber) && (
            <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}06` }}>
              <p className="text-xs font-semibold uppercase mb-3" style={{ color: accentColor, letterSpacing: '0.06em' }}>
                Aperçu dans le checkout
              </p>
              <div className="flex items-start gap-4">
                {currentUrl && (
                  <img
                    src={currentUrl} alt=""
                    className="rounded-lg border"
                    style={{ width: 72, height: 72, objectFit: 'contain', borderColor: `${accentColor}20` }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div>
                  {phoneNumber && <p className="text-sm font-bold text-gray-900 mb-0">{phoneNumber}</p>}
                  {!currentUrl && !phoneNumber && <p className="text-xs text-gray-400">Aucune info configurée</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
