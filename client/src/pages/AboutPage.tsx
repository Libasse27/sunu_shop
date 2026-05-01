import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Monitor, Globe, Award, Users, Wrench, Shield, CheckCircle, ArrowRight, MapPin, MessageCircle } from 'lucide-react';
import { WHATSAPP_NUMBER, SITE_URL } from '../utils/constants';

const stats = [
  { icon: Monitor, label: 'Produits',  value: '500+',   desc: 'Informatique, téléphonie, électronique',   accent: '#009A44' },
  { icon: Globe,   label: 'Présence',  value: '3 pays', desc: 'Sénégal, Mali, Guinée',                    accent: '#FCD116' },
  { icon: Award,   label: 'Expertise', value: '5 ans',  desc: 'Dans le secteur tech africain',            accent: '#E31B23' },
  { icon: Users,   label: 'Clients',   value: '5 000+', desc: 'Satisfaits à travers l\'Afrique',          accent: '#009A44' },
];

const values = [
  { icon: Shield, title: 'Authenticité',  desc: 'Tous nos produits sont originaux, avec facture et garantie constructeur.', accent: '#009A44' },
  { icon: Wrench, title: 'Expertise',     desc: 'Nos techniciens sont formés et certifiés sur les marques qu\'ils réparent.', accent: '#E31B23' },
  { icon: Globe,  title: 'Accessibilité', desc: 'Prix compétitifs et paiements mobiles (Orange Money, Wave) facilités.', accent: '#FCD116' },
  { icon: Users,  title: 'Service client',desc: 'Support réactif via WhatsApp, disponible 7j/7 pour toutes vos questions.', accent: '#009A44' },
];

const countries = [
  { flag: '🇸🇳', name: 'Sénégal',  city: 'Dakar',   desc: 'Siège & atelier principal' },
  { flag: '🇲🇱', name: 'Mali',     city: 'Bamako',  desc: 'Service livraison' },
  { flag: '🇬🇳', name: 'Guinée',   city: 'Conakry', desc: 'Partenaires locaux' },
];

export default function AboutPage() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Bonjour Sunu Shop, je souhaite en savoir plus sur vos services.`;

  return (
    <>
      <Helmet>
        <title>À propos — Sunu Shop</title>
        <meta name="description" content="Sunu Shop, votre boutique tech de confiance à Dakar depuis 2020. Matériel informatique, smartphones et services réparation. Authenticité garantie, paiement mobile." />
        <link rel="canonical" href={`${SITE_URL}/a-propos`} />
        <meta property="og:type"        content="website" />
        <meta property="og:site_name"   content="Sunu Shop" />
        <meta property="og:title"       content="À propos de Sunu Shop" />
        <meta property="og:description" content="Votre partenaire tech en Afrique de l'Ouest. Authenticité, expertise et service client de qualité." />
        <meta property="og:url"         content={`${SITE_URL}/a-propos`} />
        <meta name="twitter:card"  content="summary" />
        <meta name="twitter:site"  content="@sunushop" />
        <meta name="twitter:title" content="À propos — Sunu Shop" />
      </Helmet>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-12" style={{ backgroundColor: '#003D1C' }}>
        {/* Decorative circles */}
        <div className="absolute rounded-full pointer-events-none" style={{ top: -80, right: -80, width: 320, height: 320, backgroundColor: 'rgba(0,154,68,0.10)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ bottom: -64, left: -64, width: 240, height: 240, backgroundColor: 'rgba(206,17,38,0.10)' }} />
        {/* Pan-African left bar */}
        <div className="absolute top-0 bottom-0 left-0 flex flex-col" style={{ width: 6 }}>
          <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
        </div>

        <div className="container-custom relative z-10 text-center">
          <span className="inline-flex items-center gap-2 border rounded-full px-3 py-1 text-sm font-bold uppercase mb-4"
            style={{ backgroundColor: 'rgba(252,209,22,0.15)', borderColor: 'rgba(252,209,22,0.30)', color: '#FCD116', letterSpacing: '0.1em' }}>
            🌍 Technologie pour l'Afrique
          </span>
          <h1 className="font-bold text-white mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.2 }}>
            Notre Histoire
          </h1>
          <p className="text-white mx-auto leading-relaxed" style={{ opacity: 0.65, fontSize: '1.1rem', maxWidth: 600 }}>
            Sunu Shop est né de la volonté de démocratiser l'accès aux technologies de qualité
            pour les populations d'Afrique de l'Ouest.
          </p>
        </div>
      </section>

      {/* ── Pan-African strip ── */}
      <div className="flex" style={{ height: 6 }}>
        <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
        <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
        <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
      </div>

      {/* ── Stats ── */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(item => (
              <div key={item.label} className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0" style={{ height: 2, backgroundColor: item.accent }} />
                <div className="rounded-lg flex items-center justify-center mx-auto mb-4"
                  style={{ width: 48, height: 48, backgroundColor: `${item.accent}15` }}>
                  <item.icon size={22} style={{ color: item.accent }} />
                </div>
                <p className="font-bold mb-1" style={{ fontSize: '1.75rem', color: item.accent }}>{item.value}</p>
                <p className="font-semibold text-sm text-gray-900 mb-1">{item.label}</p>
                <p className="text-sm text-gray-500 mb-0">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="mx-auto" style={{ maxWidth: 768 }}>
            <div className="flex items-center gap-3 mb-6">
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, transparent, rgba(0,154,68,0.30))' }} />
              <h2 className="font-bold text-gray-900 whitespace-nowrap text-3xl mb-0">Notre Mission</h2>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(to left, transparent, rgba(0,154,68,0.30))' }} />
            </div>
            <p className="text-gray-500 leading-relaxed mb-4">
              Chez Sunu Shop, nous croyons que chaque Africain mérite d'avoir accès aux meilleures
              technologies à des prix justes. Nous sélectionnons rigoureusement nos produits auprès des
              meilleurs fournisseurs — <strong className="text-gray-900">Samsung, Apple, HP, Asus, Xiaomi</strong> —
              pour vous garantir authenticité et qualité.
            </p>
            <p className="text-gray-500 leading-relaxed mb-0">
              Au-delà de la vente de matériel, nous proposons des services de réparation, d'installation
              réseau, de vidéosurveillance et de maintenance informatique. Notre équipe de techniciens
              certifiés intervient chez vous ou dans notre atelier. Nous acceptons les paiements mobiles
              (Orange Money, Wave) adaptés au marché africain.
            </p>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="font-bold text-gray-900 text-center text-3xl mb-10">Nos Valeurs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mx-auto" style={{ maxWidth: 768 }}>
            {values.map(v => (
              <div key={v.title} className="bg-white rounded-xl p-6 flex items-start gap-3 border border-gray-100 shadow-sm">
                <div className="rounded-lg flex items-center justify-center shrink-0"
                  style={{ width: 44, height: 44, backgroundColor: `${v.accent}15`, marginTop: 2 }}>
                  <v.icon size={20} style={{ color: v.accent }} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1" style={{ fontSize: '0.95rem' }}>{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-0">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Presence ── */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="font-bold text-gray-900 text-center text-3xl mb-2">Notre Présence</h2>
          <p className="text-center text-gray-500 mb-10">Nous opérons dans 3 pays d'Afrique de l'Ouest</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mx-auto" style={{ maxWidth: 640 }}>
            {countries.map((c, i) => (
              <div key={c.name} className="text-center bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="mb-4" style={{ fontSize: '2.5rem' }}>{c.flag}</div>
                <p className="font-bold text-gray-900 mb-1">{c.name}</p>
                <p className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-1">
                  <MapPin size={12} style={{ color: [' #009A44', '#FCD116', '#E31B23'][i] }} />
                  {c.city}
                </p>
                <p className="text-sm text-gray-500 mb-0" style={{ fontSize: '0.75rem' }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="py-12" style={{ backgroundColor: '#003D1C' }}>
        <div className="container-custom text-center">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold uppercase mb-4"
            style={{ backgroundColor: 'rgba(252,209,22,0.15)', color: '#FCD116', letterSpacing: '0.1em' }}>
            Pourquoi nous choisir
          </span>
          <h2 className="font-bold text-white text-3xl mb-6">
            La différence Sunu Shop
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mx-auto text-left mb-10" style={{ maxWidth: 900 }}>
            {[
              'Produits 100% authentiques avec garantie constructeur',
              'Paiement Orange Money, Wave et carte bancaire',
              'Livraison rapide à Dakar et en sous-région',
              'Techniciens certifiés disponibles 7j/7',
              'Service après-vente réactif via WhatsApp',
              'Prix compétitifs adaptés au marché africain',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl p-4 border"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' }}>
                <CheckCircle size={16} className="shrink-0 mt-1" style={{ color: '#009A44' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{item}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/boutique" className="btn-gold px-6 py-2 inline-flex items-center gap-2">
              Explorer la boutique <ArrowRight size={16} />
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2 font-semibold text-sm text-white"
              style={{ backgroundColor: '#009A44' }}>
              <MessageCircle size={16} /> Contacter via WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
