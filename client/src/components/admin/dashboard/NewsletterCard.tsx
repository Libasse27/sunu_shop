// ─── Carte Newsletter (résumé + lien campagne) ────────────────────────────────

import { Link } from 'react-router-dom';
import { Mail, ArrowUpRight, Send } from 'lucide-react';
import type { NewsletterData } from './DashboardTypes';

interface Props {
  newsletter: NewsletterData | null;
}

export default function NewsletterCard({ newsletter }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-base mb-0 flex items-center gap-2">
          <Mail size={17} style={{ color: '#009A44' }} /> Newsletter
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44' }}>
            {newsletter?.total ?? 0} abonnés
          </span>
          <Link to="/admin/newsletter" className="text-sm no-underline flex items-center gap-1" style={{ color: '#009A44' }}>
            Gérer <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
      {!newsletter?.recent?.length ? (
        <p className="text-sm text-gray-500 text-center py-4 mb-0">Aucun abonné pour l'instant</p>
      ) : (
        <div className="flex flex-col gap-2">
          {newsletter.recent.map(s => (
            <div key={s._id} className="flex items-center gap-3 py-1">
              <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 28, height: 28, backgroundColor: 'rgba(0,154,68,0.1)' }}>
                <Mail size={13} style={{ color: '#009A44' }} />
              </div>
              <span className="text-sm text-gray-900 flex-1 truncate">{s.email}</span>
              <span className="text-xs text-gray-500 shrink-0">{new Date(s.subscribedAt).toLocaleDateString('fr-FR')}</span>
            </div>
          ))}
        </div>
      )}
      <Link to="/admin/newsletter"
        className="mt-3 flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold text-white rounded-xl no-underline transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #009A44, #007A35)' }}>
        <Send size={14} /> Envoyer une newsletter
      </Link>
    </div>
  );
}
