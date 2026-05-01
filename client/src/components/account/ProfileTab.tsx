import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit2, ChevronRight, ShieldCheck, Lock,
  Phone, Mail, CheckCircle2,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { setCredentials } from '../../features/auth/authSlice';
import api, { tokenStore } from '../../services/api';
import { getApiError } from '../../utils/getApiError';
import toast from 'react-hot-toast';
import { SN, getInitials } from './accountConstants';

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon, label, value, muted,
}: {
  icon: React.ElementType; label: string; value?: string; muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0">{label}</p>
        <p className={`text-sm font-medium mb-0 ${muted ? 'text-gray-400 italic' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────

export default function ProfileTab() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    phone:     user?.phone     || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/me', form);
      dispatch(setCredentials({ user: { ...user, ...data.data }, accessToken: tokenStore.get() || '' }));
      toast.success('Profil mis à jour');
      setEditing(false);
    } catch (err: unknown) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className="h-20 relative"
          style={{ background: `linear-gradient(135deg, ${SN.green}, ${SN.greenDark})` }}
        >
          <svg
            className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"
            width="48" height="48" viewBox="0 0 24 24" fill={SN.gold}
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          <div className="pan-strip-h absolute bottom-0 left-0 right-0" />
        </div>

        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div
              className="rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white"
              style={{ width: 64, height: 64, background: `linear-gradient(135deg, ${SN.green}, ${SN.greenDark})` }}
            >
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                style={{ color: '#009A44' }}
              >
                <Edit2 size={13} /> Modifier
              </button>
            )}
          </div>

          {!editing ? (
            <>
              <h2 className="font-bold text-xl text-gray-900 mb-0.5">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Mail}         label="Email"            value={user?.email} />
                <InfoRow icon={Phone}        label="Téléphone"        value={user?.phone || 'Non renseigné'} muted={!user?.phone} />
                <InfoRow icon={ShieldCheck}  label="Rôle"             value={user?.role === 'client' ? 'Client' : user?.role} />
                <InfoRow icon={CheckCircle2} label="Compte vérifié"   value={user?.isVerified ? 'Oui' : 'Non'} />
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Prénom *</label>
                  <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nom *</label>
                  <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+221 77 XXX XX XX" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input type="email" value={user?.email || ''} className="input-field" disabled />
                  <p className="text-xs text-gray-400 mt-1">Non modifiable</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-ghost">Annuler</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" /> Sécurité
        </h3>
        <div className="flex items-center justify-between py-3 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
              <Lock size={15} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-0">Mot de passe</p>
              <p className="text-xs text-gray-400 mb-0">Dernière modification inconnue</p>
            </div>
          </div>
          <Link
            to="/mon-compte/mot-de-passe"
            className="text-xs font-semibold flex items-center gap-1 no-underline"
            style={{ color: '#009A44' }}
          >
            Changer <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
