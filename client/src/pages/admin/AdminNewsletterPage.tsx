import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Mail, Send, Users, CheckCircle, XCircle, Loader2,
  ChevronLeft, ChevronRight, Clock, User, AlertTriangle,
  Trash2, RefreshCw,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { adminNewsletterApi } from '../../services/admin.api';

type Tab = 'compose' | 'subscribers' | 'history';

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div
        className="rounded-full animate-spin"
        style={{
          width: 32,
          height: 32,
          border: '4px solid rgba(0,154,68,0.2)',
          borderTopColor: '#009A44',
        }}
      />
    </div>
  );
}

// ─── Compose Tab ──────────────────────────────────────────────────────────────

function ComposeTab({ subscriberCount }: { subscriberCount: number }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const doSend = async () => {
    setLoading(true);
    setResult(null);
    setConfirmOpen(false);
    try {
      const res = await adminNewsletterApi.sendCampaign({ subject, body });
      setResult({ type: 'success', message: res.data.message || 'Newsletter envoyée avec succès' });
      setSubject('');
      setBody('');
    } catch (err: any) {
      setResult({
        type: 'error',
        message: err?.response?.data?.message || "Erreur lors de l'envoi",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setConfirmOpen(true);
  };

  return (
    <>
      <div style={{ maxWidth: 672 }}>
        {/* Recipient info */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
          style={{ background: 'rgba(0,154,68,0.08)', border: '1px solid rgba(0,154,68,0.2)' }}
        >
          <Users size={16} style={{ color: '#009A44' }} className="shrink-0" />
          <span className="text-sm text-gray-900">
            Votre newsletter sera envoyée à{' '}
            <strong style={{ color: '#009A44' }}>{subscriberCount} abonné{subscriberCount !== 1 ? 's' : ''}</strong>
          </span>
        </div>

        {result && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 mb-4"
            style={{
              background: result.type === 'success' ? 'rgba(0,154,68,0.08)' : 'rgba(206,17,38,0.08)',
              border: `1px solid ${result.type === 'success' ? 'rgba(0,154,68,0.2)' : 'rgba(206,17,38,0.2)'}`,
            }}
          >
            {result.type === 'success' ? (
              <CheckCircle size={16} style={{ color: '#009A44' }} className="shrink-0 mt-1" />
            ) : (
              <XCircle size={16} style={{ color: '#E31B23' }} className="shrink-0 mt-1" />
            )}
            <span className="text-sm font-semibold" style={{ color: result.type === 'success' ? '#007A35' : '#E31B23' }}>
              {result.message}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Objet de l'email <span style={{ color: '#E31B23' }}>*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ex: Nouvelles offres tech de mars 2026 !"
              className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
              style={{ borderColor: '#e5e7eb' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Contenu du message <span style={{ color: '#E31B23' }}>*</span>
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={14}
              placeholder={`Bonjour,\n\nNous avons le plaisir de vous annoncer...\n\nÀ très bientôt,\nL'équipe Sunu Shop`}
              className="w-full px-3 py-3 rounded-xl text-sm border leading-relaxed focus:outline-none"
              style={{ fontFamily: 'monospace', resize: 'vertical', borderColor: '#e5e7eb' }}
              required
            />
            <p className="text-sm text-gray-500 mt-1 mb-0">
              Le texte sera envoyé tel quel. Utilisez des sauts de ligne pour structurer votre message.
            </p>
          </div>

          {body && (
            <div className="rounded-xl p-3 bg-gray-50 border">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2" style={{ letterSpacing: '0.06em' }}>Aperçu</p>
              <p className="text-sm text-gray-900 leading-relaxed mb-0 line-clamp-6" style={{ whiteSpace: 'pre-wrap' }}>{body}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !subject.trim() || !body.trim() || subscriberCount === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl border-0 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #009A44, #007A35)',
                opacity: (loading || !subject.trim() || !body.trim() || subscriberCount === 0) ? 0.6 : 1,
              }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {loading ? 'Envoi en cours...' : `Envoyer à ${subscriberCount} abonné${subscriberCount !== 1 ? 's' : ''}`}
            </button>
            {subscriberCount === 0 && (
              <span className="flex items-center gap-2 text-sm" style={{ color: '#d97706' }}>
                <AlertTriangle size={13} />
                Aucun abonné actif
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Confirm send */}
      <AdminConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSend}
        loading={loading}
        variant="warning"
        title={`Envoyer à ${subscriberCount} abonné${subscriberCount !== 1 ? 's' : ''} ?`}
        message={`Cette action est irréversible. La newsletter "${subject}" sera immédiatement envoyée à tous les abonnés actifs.`}
        confirmLabel="Envoyer maintenant"
      />
    </>
  );
}

// ─── Subscribers Tab ──────────────────────────────────────────────────────────

function SubscribersTab() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unsubscribingEmail, setUnsubscribingEmail] = useState<string | null>(null);
  const [confirmUnsubscribe, setConfirmUnsubscribe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminNewsletterApi.getSubscribers({ page, limit: 30 });
      setData(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleUnsubscribeConfirm = async () => {
    if (!confirmUnsubscribe) return;
    setUnsubscribingEmail(confirmUnsubscribe);
    try {
      await adminNewsletterApi.unsubscribe(confirmUnsubscribe);
      setConfirmUnsubscribe(null);
      load();
    } catch {
      // ignore
    } finally {
      setUnsubscribingEmail(null);
    }
  };

  if (loading) return <Spinner />;

  const subscribers = data?.subscribers || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500 mb-0">
            <strong className="text-gray-900">{total}</strong> abonné{total !== 1 ? 's' : ''} actif{total !== 1 ? 's' : ''}
          </p>
          <button
            onClick={load}
            className="flex items-center gap-2 text-sm text-gray-500 border-0 bg-transparent p-0 cursor-pointer"
          >
            <RefreshCw size={13} /> Actualiser
          </button>
        </div>

        {subscribers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Mail size={36} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm mb-0">Aucun abonné pour l'instant</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-3 text-gray-500 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
                      Email
                    </th>
                    <th className="text-left px-3 py-3 text-gray-500 uppercase font-semibold hidden sm:table-cell" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
                      Date d'inscription
                    </th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s: any) => (
                    <tr key={s._id} className="border-t">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex items-center justify-center rounded-full shrink-0"
                            style={{ width: 28, height: 28, background: 'rgba(0,154,68,0.1)' }}
                          >
                            <Mail size={12} style={{ color: '#009A44' }} />
                          </div>
                          <span className="text-gray-900 font-semibold">{s.email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-500 hidden sm:table-cell" style={{ fontSize: 12 }}>
                        {new Date(s.subscribedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => setConfirmUnsubscribe(s.email)}
                          disabled={unsubscribingEmail === s.email}
                          className="p-1 rounded-lg border-0 bg-transparent text-gray-400 cursor-pointer"
                          title="Désinscrire"
                        >
                          {unsubscribingEmail === s.email
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-500">Page {page} / {pages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-2 rounded-lg border bg-white" style={{ opacity: page === 1 ? 0.4 : 1 }}>
                    <ChevronLeft size={15} />
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page === pages} className="p-2 rounded-lg border bg-white" style={{ opacity: page === pages ? 0.4 : 1 }}>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AdminConfirmDialog
        open={!!confirmUnsubscribe}
        onClose={() => setConfirmUnsubscribe(null)}
        onConfirm={handleUnsubscribeConfirm}
        loading={!!unsubscribingEmail}
        variant="warning"
        title="Désinscrire cet abonné ?"
        message={`L'adresse "${confirmUnsubscribe}" sera désinscrite de la newsletter.`}
        confirmLabel="Désinscrire"
      />
    </>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminNewsletterApi.getCampaigns({ page });
        setData(res.data.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  if (loading) return <Spinner />;

  const campaigns = data?.campaigns || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        <strong className="text-gray-900">{total}</strong> campagne{total !== 1 ? 's' : ''} envoyée{total !== 1 ? 's' : ''}
      </p>

      {campaigns.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Clock size={36} className="mx-auto mb-3 opacity-25" />
          <p className="text-sm mb-0">Aucune campagne envoyée</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((c: any) => (
            <div key={c._id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold text-gray-900 truncate mb-1">{c.subject}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock size={11} />
                      {new Date(c.sentAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {c.sentBy && (
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <User size={11} />
                        {c.sentBy.firstName} {c.sentBy.lastName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="flex items-center gap-1 text-sm font-semibold rounded-full px-2 py-1"
                    style={{
                      background: c.status === 'sent' ? 'rgba(0,154,68,0.1)' : 'rgba(206,17,38,0.1)',
                      color: c.status === 'sent' ? '#009A44' : '#E31B23',
                    }}
                  >
                    {c.status === 'sent'
                      ? <><CheckCircle size={11} /> Envoyée</>
                      : <><XCircle size={11} /> Échec</>
                    }
                  </span>
                  <span className="text-sm font-bold text-gray-900 rounded-full px-2 py-1" style={{ background: '#f3f4f6' }}>
                    {c.recipientCount} dest.
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-0 line-clamp-2" style={{ whiteSpace: 'pre-line' }}>
                {c.body}
              </p>
              {c.errorMessage && (
                <div
                  className="mt-3 flex items-start gap-2 rounded-xl p-2"
                  style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
                >
                  <AlertTriangle size={13} style={{ color: '#f59e0b' }} className="shrink-0 mt-1" />
                  <p className="text-sm mb-0" style={{ color: '#92400e' }}>{c.errorMessage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-500">Page {page} / {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-2 rounded-lg border bg-white" style={{ opacity: page === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={15} />
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page === pages} className="p-2 rounded-lg border bg-white" style={{ opacity: page === pages ? 0.4 : 1 }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminNewsletterPage() {
  const [tab, setTab] = useState<Tab>('compose');
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    adminNewsletterApi.getStats()
      .then(res => setSubscriberCount(res.data.data?.total ?? 0))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const tabs: { key: Tab; label: string; icon: typeof Mail }[] = [
    { key: 'compose', label: 'Composer', icon: Send },
    { key: 'subscribers', label: 'Abonnés', icon: Users },
    { key: 'history', label: 'Historique', icon: Clock },
  ];

  return (
    <>
      <Helmet><title>Admin — Newsletter | Sunu Shop</title></Helmet>
      <AdminLayout title="Newsletter">
        <AdminPageHeader
          title="Newsletter"
          subtitle={!statsLoading ? `${subscriberCount} abonné${subscriberCount !== 1 ? 's' : ''} actif${subscriberCount !== 1 ? 's' : ''}` : undefined}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Newsletter' }]}
        />

        <div className="flex flex-col gap-4">
          {/* Stats bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 44, height: 44, background: 'rgba(0,154,68,0.1)' }}
              >
                <Users size={20} style={{ color: '#009A44' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-0" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {statsLoading ? '—' : subscriberCount}
                </p>
                <p className="text-sm text-gray-500 mb-0">Abonnés actifs</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 44, height: 44, background: 'rgba(252,209,22,0.15)' }}
              >
                <Send size={20} style={{ color: '#9A7A00' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Prêt à envoyer</p>
                <p className="text-sm font-semibold text-gray-900 mb-0">
                  Rédigez un message et envoyez-le en un clic
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              {/* Pan-African strip */}
              <div className="flex rounded-full overflow-hidden mb-3" style={{ height: 6 }}>
                <div className="flex-1" style={{ background: '#009A44' }} />
                <div className="flex-1" style={{ background: '#FCD116' }} />
                <div className="flex-1" style={{ background: '#E31B23' }} />
              </div>
              <p className="text-sm text-gray-500 mb-0">
                Les newsletters sont envoyées avec le template Sunu Shop incluant un lien de désinscription.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-0 bg-transparent cursor-pointer"
                  style={{
                    color: tab === t.key ? '#009A44' : '#6b7280',
                    borderBottom: `2px solid ${tab === t.key ? '#009A44' : 'transparent'}`,
                    marginBottom: -1,
                  }}
                >
                  <t.icon size={15} />
                  {t.label}
                  {t.key === 'subscribers' && subscriberCount > 0 && (
                    <span
                      className="ml-1 rounded-full text-white font-bold"
                      style={{ background: '#009A44', fontSize: 10, padding: '2px 6px', lineHeight: 1 }}
                    >
                      {subscriberCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4">
              {tab === 'compose' && <ComposeTab subscriberCount={subscriberCount} />}
              {tab === 'subscribers' && <SubscribersTab />}
              {tab === 'history' && <HistoryTab />}
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
