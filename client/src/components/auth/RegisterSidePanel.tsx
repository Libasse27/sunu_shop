// ─── Panneau gauche décoratif de la page inscription ─────────────────────────

import { Link } from 'react-router-dom';

const BENEFITS = [
  { icon: '🎯', title: 'Offres exclusives', desc: 'Accès à des promotions réservées aux membres' },
  { icon: '📦', title: 'Suivi en temps réel', desc: 'Suivez chaque étape de vos commandes' },
  { icon: '⭐', title: 'Programme fidélité', desc: 'Cumulez des points à chaque achat' },
  { icon: '💬', title: 'Support prioritaire', desc: 'Assistance WhatsApp 7j/7' },
];

export function RegisterSidePanel() {
  return (
    <div
      className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden flex-col"
      style={{ background: 'linear-gradient(155deg, #052e16 0%, #009A44 60%, #00C756 100%)' }}
    >
      {/* Grille décorative */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #FCD116 0%, transparent 70%)' }} />
      <div className="absolute bottom-10 -left-16 w-56 h-56 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #00C756 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
        {/* Logo */}
        <Link to="/" className="no-underline w-fit">
          <div className="inline-flex items-center px-4 py-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)' }}>
            <img src="/logo.svg" alt="Sunu Shop" style={{ height: '3.25rem', width: 'auto', maxWidth: '220px' }} />
          </div>
        </Link>

        {/* Central content */}
        <div className="flex-1 flex flex-col justify-center mt-12">
          <div
            className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold w-fit"
            style={{ background: 'rgba(252,209,22,0.2)', color: '#FCD116' }}
          >
            ✦ Inscription gratuite · Aucune carte requise
          </div>
          <h2 className="text-white font-bold mt-4 leading-tight" style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)' }}>
            Rejoignez la<br />communauté tech
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Des milliers de clients au Sénégal, Mali et Guinée<br />
            font confiance à Sunu Shop pour leurs achats tech.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            {BENEFITS.map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  {icon}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs mt-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          © 2025 Sunu Shop · Dakar, Sénégal
        </p>
      </div>
    </div>
  );
}
