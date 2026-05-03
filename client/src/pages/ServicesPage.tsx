import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, CheckCircle, Clock, ArrowRight, Wrench, Shield, Star, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';
import { SITE_NAME, SITE_URL, WHATSAPP_NUMBER } from '../utils/constants';
import { formatPrice } from '../utils/formatPrice';

interface Service {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  startingPrice: number;
  estimatedDuration: string;
  image: string;
  isAvailable: boolean;
  features: string[];
  whatsappMessage: string;
}

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState('Tous');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(r => r.data.data as Service[]),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  const categories = ['Tous', ...Array.from(new Set(services.map(s => s.category)))];
  const filtered = activeCategory === 'Tous' ? services : services.filter(s => s.category === activeCategory);

  return (
    <>
      <Helmet>
        <title>Services Réparation & Installation — {SITE_NAME}</title>
        <meta name="description" content="Services de réparation d'ordinateurs et téléphones, installation caméras, réseau Wi-Fi et maintenance informatique par des techniciens certifiés." />
        <link rel="canonical" href={`${SITE_URL}/services`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Services Techniques', item: `${SITE_URL}/services` },
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Combien coûte une réparation de téléphone à Dakar ?',
              acceptedAnswer: { '@type': 'Answer', text: `Les réparations de téléphone démarrent à 15 000 FCFA selon la panne et le modèle. Contactez ${SITE_NAME} via WhatsApp pour un devis gratuit et rapide.` },
            },
            {
              '@type': 'Question',
              name: 'Combien de temps dure une réparation d\'ordinateur ?',
              acceptedAnswer: { '@type': 'Answer', text: 'La plupart des réparations d\'ordinateurs sont effectuées en 24 à 48 heures. Pour les pannes complexes, un délai de 3 à 5 jours peut être nécessaire. Un service express est disponible.' },
            },
            {
              '@type': 'Question',
              name: 'Proposez-vous une garantie sur les réparations ?',
              acceptedAnswer: { '@type': 'Answer', text: 'Oui, toutes nos réparations sont garanties de 3 à 6 mois selon le type d\'intervention. Les pièces de remplacement sont également couvertes par cette garantie.' },
            },
            {
              '@type': 'Question',
              name: 'Installez-vous des caméras de surveillance à Dakar ?',
              acceptedAnswer: { '@type': 'Answer', text: 'Oui, nous installons des systèmes de vidéosurveillance complets (caméras IP, NVR, DVR) à Dakar et en banlieue. Devis gratuit sur site disponible.' },
            },
            {
              '@type': 'Question',
              name: 'Pouvez-vous installer un réseau Wi-Fi pour mon entreprise ?',
              acceptedAnswer: { '@type': 'Answer', text: 'Nos techniciens certifiés installent et configurent des réseaux Wi-Fi professionnels pour entreprises, boutiques et domiciles au Sénégal. Contactez-nous via WhatsApp pour un devis.' },
            },
          ],
        })}</script>
      </Helmet>

      {services.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `Services Réparation & Installation — ${SITE_NAME}`,
            itemListElement: services.filter(s => s.isAvailable).map((service, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Service',
                name: service.title,
                description: service.shortDescription,
                url: `${SITE_URL}/services/${service.slug}`,
                provider: { '@type': 'LocalBusiness', name: SITE_NAME },
                offers: {
                  '@type': 'Offer',
                  priceCurrency: 'XOF',
                  price: service.startingPrice,
                  availability: 'https://schema.org/InStock',
                },
              },
            })),
          })}}
        />
      )}

      {/* ── Breadcrumb ── */}
      <div className="bg-gray-50 border-b">
        <div className="container-custom py-2">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="no-underline transition-colors" style={{ color: 'inherit' }}>Accueil</Link>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-medium">Services Techniques</span>
          </nav>
        </div>
      </div>

      {/* ── Hero banner ── */}
      <section className="border-b" style={{ background: '#003D1C', borderColor: '#1f2937' }}>
        <div className="container-custom py-6 lg:py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-2 mb-4 font-bold uppercase text-sm" style={{ background: 'rgba(0,154,68,0.12)', color: '#009A44', letterSpacing: '0.08em' }}>
                <Wrench size={11} /> Services Techniques
              </span>
              <h1 className="font-bold text-3xl lg:text-4xl text-white mb-4">
                Réparation & Installation
              </h1>
              <p className="text-white mb-6" style={{ opacity: 0.55, maxWidth: '36rem' }}>
                Techniciens certifiés pour la réparation de vos appareils, installation de caméras, réseaux Wi-Fi et maintenance informatique. Devis gratuit.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-5">
                {[
                  { icon: Shield, label: 'Garantie sur les réparations' },
                  { icon: Star, label: 'Techniciens certifiés' },
                  { icon: Clock, label: 'Intervention rapide' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <Icon size={14} className="shrink-0" style={{ color: '#009A44' }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Bonjour Sunu Shop, j'ai besoin d'un service technique.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-white shadow"
                style={{ background: '#009A44', boxShadow: '0 4px 16px rgba(0,154,68,0.2)' }}
              >
                <MessageCircle size={17} />
                Devis gratuit WhatsApp
              </a>
              <a
                href={`tel:${WHATSAPP_NUMBER}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-white border"
                style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <Phone size={17} />
                Appeler maintenant
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section className="bg-white border-b">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x">
            {[
              { icon: Wrench, title: 'Réparation rapide', desc: 'Délai express disponible' },
              { icon: Shield, title: 'Garantie pièces', desc: '3 à 6 mois selon service' },
              { icon: Star, title: 'Techniciens certifiés', desc: 'Experts qualifiés' },
              { icon: MessageCircle, title: 'Devis gratuit', desc: 'Via WhatsApp ou téléphone' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 px-6 py-4">
                <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 36, height: 36, background: 'rgba(0,154,68,0.1)' }}>
                  <Icon size={17} style={{ color: '#009A44' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 mb-0">{title}</p>
                  <p className="text-sm text-gray-500 mb-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services grid ── */}
      <section className="py-6 lg:py-12 bg-gray-50">
        <div className="container-custom">

          {/* Category filter tabs */}
          {categories.length > 2 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-sm font-medium rounded-lg border px-4 py-2 transition-colors ${
                    activeCategory === cat
                      ? 'btn-primary shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Wrench size={40} className="mx-auto mb-4 opacity-25" />
              <p>Aucun service disponible pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((service, i) => {
                const waUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(
                  service.whatsappMessage || `Bonjour, je suis intéressé par ${service.title}`
                )}`;
                return (
                  <motion.div
                    key={service._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    whileHover={{ y: -3 }}
                    className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full transition-shadow hover:shadow-md ${!service.isAvailable ? 'opacity-75' : ''}`}
                  >
                    {/* Image */}
                    {service.image && (
                      <div className="overflow-hidden bg-gray-50" style={{ aspectRatio: '16/9' }}>
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-full object-cover transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h2 className="font-bold text-sm text-gray-900 leading-snug mb-0">{service.title}</h2>
                        {service.isAvailable ? (
                          <span className="rounded-full shrink-0 px-2 py-0.5" style={{ background: 'rgba(0,154,68,0.12)', color: '#007A35', fontSize: '10px' }}>Disponible</span>
                        ) : (
                          <span className="rounded-full shrink-0 bg-gray-100 text-gray-500 px-2 py-0.5" style={{ fontSize: '10px' }}>Indisponible</span>
                        )}
                      </div>

                      <p className="text-sm font-medium mb-2 text-primary">{service.category}</p>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{service.shortDescription}</p>

                      {/* Features */}
                      {service.features?.length > 0 && (
                        <ul className="list-none p-0 flex flex-col gap-2 mb-4">
                          {service.features.slice(0, 3).map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle size={13} className="shrink-0" style={{ color: '#009A44' }} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Price & duration */}
                      <div className="flex items-center justify-between py-4 border-t border-gray-100 mb-4">
                        <div>
                          <p className="mb-0 text-gray-500" style={{ fontSize: '11px' }}>À partir de</p>
                          <p className="font-bold text-lg text-primary leading-none mb-0">{formatPrice(service.startingPrice)}</p>
                        </div>
                        {service.estimatedDuration && (
                          <div className="text-right">
                            <p className="mb-0 text-gray-500 flex items-center gap-1 justify-end" style={{ fontSize: '11px' }}>
                              <Clock size={11} /> Durée estimée
                            </p>
                            <p className="text-sm font-semibold text-gray-600 mb-0">{service.estimatedDuration}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                          style={{ background: '#009A44' }}
                        >
                          <MessageCircle size={15} /> WhatsApp
                        </a>
                        <Link
                          to={`/services/${service.slug}`}
                          className="border border-gray-200 rounded-lg flex items-center justify-center text-gray-500"
                          style={{ width: 44 }}
                        >
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-6 lg:py-12 border-t" style={{ background: '#003D1C', borderColor: '#1f2937' }}>
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h2 className="font-bold text-2xl lg:text-3xl text-white mb-2">
                Vous ne trouvez pas ce que vous cherchez ?
              </h2>
              <p className="text-sm mb-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Contactez-nous directement, nous avons une solution pour chaque problème tech.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Bonjour Sunu Shop, j'ai besoin d'un service non listé.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-white"
                style={{ background: '#009A44' }}
              >
                <MessageCircle size={16} /> WhatsApp — Devis gratuit
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-white border"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Formulaire de contact <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
