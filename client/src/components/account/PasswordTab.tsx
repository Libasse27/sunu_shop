import { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { getApiError } from '../../utils/getApiError';
import toast from 'react-hot-toast';
import { getPasswordStrength } from './accountConstants';

export default function PasswordTab() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const strength = form.newPassword ? getPasswordStrength(form.newPassword) : null;
  const passwordsMatch = form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/me/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Mot de passe modifié avec succès');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-bold text-lg text-gray-900 mb-0">Changer le mot de passe</h2>

      <div className="rounded-xl p-4 flex gap-3 text-sm" style={{ background: 'rgba(0,154,68,0.06)', border: '1px solid rgba(0,154,68,0.15)' }}>
        <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
        <div style={{ color: '#007A35' }}>
          <p className="font-semibold mb-1">Conseils pour un mot de passe fort</p>
          <ul className="flex flex-col gap-0.5 text-xs opacity-80 pl-0 mb-0" style={{ listStyle: 'none' }}>
            <li>• Au moins 8 caractères (12+ recommandé)</li>
            <li>• Mélange de majuscules, minuscules, chiffres et symboles</li>
            <li>• Évitez les informations personnelles</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" style={{ maxWidth: 420 }}>
          {/* Mot de passe actuel */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mot de passe actuel *</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} className="input-field pr-10" required />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nouveau mot de passe *</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} className="input-field pr-10" required minLength={8} />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {strength && (
              <div className="mt-2.5">
                <div className="flex gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex-1 rounded-full transition-all duration-300" style={{ height: 4, background: i < strength.score ? strength.color : '#e5e7eb' }} />
                  ))}
                </div>
                <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirmer le mot de passe *</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="input-field pr-10" required
                style={form.confirmPassword ? { borderColor: passwordsMatch ? '#009A44' : '#E31B23' } : {}}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.confirmPassword && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: passwordsMatch ? '#009A44' : '#E31B23' }}>
                {passwordsMatch
                  ? <><CheckCircle2 size={11} /> Les mots de passe correspondent</>
                  : <><AlertCircle size={11} /> Les mots de passe ne correspondent pas</>
                }
              </p>
            )}
          </div>

          <button type="submit" disabled={loading || !form.currentPassword || !form.newPassword || !passwordsMatch} className="btn-primary">
            <Lock size={14} /> {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
