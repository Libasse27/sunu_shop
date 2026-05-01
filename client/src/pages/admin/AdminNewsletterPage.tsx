import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Send, Users, Clock } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { ComposeTab, SubscribersTab, HistoryTab } from '../../components/admin/newsletter/NewsletterTabs';
import { adminNewsletterApi } from '../../services/admin.api';

type Tab = 'compose' | 'subscribers' | 'history';

const TABS: { key: Tab; label: string; icon: typeof Mail }[] = [
  { key: 'compose',     label: 'Composer',    icon: Send },
  { key: 'subscribers', label: 'Abonnés',     icon: Users },
  { key: 'history',     label: 'Historique',  icon: Clock },
];

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
              <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 44, height: 44, background: 'rgba(0,154,68,0.1)' }}>
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
              <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 44, height: 44, background: 'rgba(252,209,22,0.15)' }}>
                <Send size={20} style={{ color: '#9A7A00' }} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Prêt à envoyer</p>
                <p className="text-sm font-semibold text-gray-900 mb-0">Rédigez un message et envoyez-le en un clic</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
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
            <div className="flex border-b border-gray-100">
              {TABS.map(t => (
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
