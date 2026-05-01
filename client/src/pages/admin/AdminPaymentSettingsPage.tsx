import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { QrCode, Loader2, CheckCircle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { QRUploadZone } from '../../components/admin/payment/QRUploadZone';
import { adminPaymentSettingsApi } from '../../services/admin.api';
import toast from 'react-hot-toast';
import WaveLogo from '../../components/payment/WaveLogo';
import OrangeMoneyLogo from '../../components/payment/OrangeMoneyLogo';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Settings {
  waveQrCodeUrl: string;
  wavePhoneNumber: string;
  orangeMoneyQrCodeUrl: string;
  orangeMoneyPhoneNumber: string;
}

const EMPTY: Settings = {
  waveQrCodeUrl: '', wavePhoneNumber: '',
  orangeMoneyQrCodeUrl: '', orangeMoneyPhoneNumber: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPaymentSettingsPage() {
  const [settings, setSettings] = useState<Settings>({ ...EMPTY });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminPaymentSettingsApi.get()
      .then(({ data }) => {
        const s = data.data || {};
        setSettings({
          waveQrCodeUrl:          s.waveQrCodeUrl          || '',
          wavePhoneNumber:        s.wavePhoneNumber        || '',
          orangeMoneyQrCodeUrl:   s.orangeMoneyQrCodeUrl   || '',
          orangeMoneyPhoneNumber: s.orangeMoneyPhoneNumber || '',
        });
      })
      .catch(() => toast.error('Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await adminPaymentSettingsApi.update(settings);
      setSaved(true);
      toast.success('Paramètres sauvegardés');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const SaveButton = ({ extraClass = '' }: { extraClass?: string }) => (
    <button
      onClick={handleSave}
      disabled={saving || loading}
      className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold border-0 disabled:opacity-60 ${extraClass}`}
      style={{ backgroundColor: '#009A44' }}
    >
      {saving ? (
        <><Loader2 size={15} className="animate-spin" /> Sauvegarde...</>
      ) : saved ? (
        <><CheckCircle size={15} /> Sauvegardé</>
      ) : (
        'Sauvegarder'
      )}
    </button>
  );

  return (
    <>
      <Helmet><title>Admin — Paiements QR | Sunu Shop</title></Helmet>
      <AdminLayout title="Paramètres de paiement">
        <AdminPageHeader
          title="Paramètres de paiement"
          subtitle="Configurez les QR codes et numéros pour Wave et Orange Money"
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Paiements QR' }]}
          actions={<SaveButton />}
        />

        <div
          className="mb-5 p-4 rounded-xl text-sm flex items-start gap-3"
          style={{ background: 'rgba(0,154,68,0.07)', border: '1px solid rgba(0,154,68,0.2)', color: '#007A35' }}
        >
          <QrCode size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Comment ça fonctionne</p>
            <p className="mb-0">
              Uploadez l'image du QR code de votre compte Wave et Orange Money (obtenu depuis vos applications respectives).
              Les clients scannent directement ce QR code pour envoyer le montant exact de leur commande.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => <div key={i} className="bg-white rounded-xl border border-gray-100 h-64 animate-pulse" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <QRUploadZone
              label="Wave"
              logo={<WaveLogo size="md" />}
              accentColor="#1BC5CB"
              currentUrl={settings.waveQrCodeUrl}
              phoneNumber={settings.wavePhoneNumber}
              onUrlChange={url => setSettings(s => ({ ...s, waveQrCodeUrl: url }))}
              onPhoneChange={phone => setSettings(s => ({ ...s, wavePhoneNumber: phone }))}
            />

            <QRUploadZone
              label="Orange Money"
              logo={<OrangeMoneyLogo size="md" />}
              accentColor="#FF6600"
              currentUrl={settings.orangeMoneyQrCodeUrl}
              phoneNumber={settings.orangeMoneyPhoneNumber}
              onUrlChange={url => setSettings(s => ({ ...s, orangeMoneyQrCodeUrl: url }))}
              onPhoneChange={phone => setSettings(s => ({ ...s, orangeMoneyPhoneNumber: phone }))}
            />

            <div className="flex justify-end">
              <SaveButton extraClass="px-6 py-2.5" />
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
