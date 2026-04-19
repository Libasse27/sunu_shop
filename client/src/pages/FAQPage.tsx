import { Helmet } from 'react-helmet-async';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronDown, MessageCircle, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WHATSAPP_NUMBER } from '../utils/constants';

const faqCategories = [
  {
    category: 'Paiement',
    color: '#009A44',
    items: [
      { q: 'Quels sont les moyens de paiement acceptés ?', a: 'Nous acceptons Orange Money, Wave, les cartes bancaires (Visa, Mastercard) via Stripe, et le paiement à la livraison dans certaines zones de Dakar.' },
    ],
  },
  {
    category: 'Livraison',
    color: '#FCD116',
    items: [
      { q: 'Quels sont les délais de livraison ?', a: "Dakar : 24–48h. Autres villes du Sénégal : 3–5 jours. Afrique de l'Ouest : 5–10 jours ouvrés selon le pays." },
      { q: 'La livraison est-elle gratuite ?', a: 'Oui, la livraison est gratuite pour toute commande supérieure à 25 000 FCFA. En dessous, des frais de 3 000 FCFA s\'appliquent.' },
      { q: 'Comment suivre ma commande ?', a: 'Après validation de votre commande, vous recevrez un email avec votre numéro de suivi. Vous pouvez également suivre votre commande depuis votre espace client ou via la page de suivi.' },
    ],
  },
  {
    category: 'Produits & Garantie',
    color: '#E31B23',
    items: [
      { q: 'Les produits sont-ils sous garantie ?', a: 'Oui, tous nos produits bénéficient de la garantie constructeur officielle. Les laptops et PC sont garantis 1 à 3 ans selon la marque. Les smartphones 1 à 2 ans. Les électroménagers 1 à 2 ans.' },
      { q: 'Puis-je retourner un produit ?', a: 'Oui, vous avez 14 jours après réception pour retourner un produit non utilisé dans son emballage d\'origine. Les frais de retour sont à la charge du client sauf en cas de produit défectueux.' },
    ],
  },
  {
    category: 'Services Réparation',
    color: '#009A44',
    items: [
      { q: 'Comment fonctionne le service de réparation ?', a: 'Contactez-nous via WhatsApp ou par téléphone pour décrire le problème. Nous vous donnerons un diagnostic et un devis gratuit. Vous pouvez déposer l\'appareil dans notre atelier à Dakar ou nous planifions un déplacement.' },
      { q: 'Combien coûte une réparation ?', a: 'Les prix débutent à 10 000 FCFA pour une réparation téléphone simple et à 15 000 FCFA pour un PC. Un diagnostic préalable est toujours proposé gratuitement avant toute intervention.' },
    ],
  },
];

export default function FAQPage() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Bonjour Sunu Shop, j'ai une question.`;

  return (
    <>
      <Helmet><title>FAQ — Sunu Shop</title></Helmet>

      {/* ── Hero ── */}
      <section className="relative py-12 overflow-hidden" style={{ backgroundColor: '#003D1C' }}>
        <div className="absolute rounded-full pointer-events-none" style={{ top: -64, right: -64, width: 256, height: 256, backgroundColor: 'rgba(0,154,68,0.10)' }} />
        <div className="absolute top-0 bottom-0 left-0 flex flex-col" style={{ width: 6 }}>
          <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #FCD116, #D4A800)' }}>
            <HelpCircle size={26} style={{ color: '#003D1C' }} />
          </div>
          <h1 className="font-bold text-white mb-2" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Questions Fréquentes</h1>
          <p className="mx-auto mb-0" style={{ color: 'rgba(255,255,255,0.60)', fontSize: '1.1rem', maxWidth: 520 }}>
            Retrouvez les réponses aux questions les plus courantes sur nos produits et services
          </p>
        </div>
      </section>

      {/* Pan-African strip */}
      <div className="flex" style={{ height: 6 }}>
        <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
        <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
        <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
      </div>

      {/* ── FAQ content ── */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="mx-auto flex flex-col gap-6" style={{ maxWidth: 768 }}>
            {faqCategories.map((cat) => (
              <div key={cat.category}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-full shrink-0" style={{ width: 8, height: 24, backgroundColor: cat.color }} />
                  <h2 className="font-bold text-lg text-gray-900 mb-0">{cat.category}</h2>
                  <div className="flex-1" style={{ height: 1, backgroundColor: '#e5e7eb' }} />
                </div>

                <div className="flex flex-col gap-2">
                  {cat.items.map((faq, i) => (
                    <Disclosure key={`${cat.category}-${i}`}>
                      {({ open }) => (
                        <div
                          className="bg-white rounded-xl overflow-hidden border-2 transition-colors"
                          style={{ borderColor: open ? cat.color : '#f3f4f6' }}
                        >
                          <Disclosure.Button className="flex w-full justify-between items-center px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors gap-3">
                            <span className="text-sm">{faq.q}</span>
                            <ChevronDown
                              size={18}
                              className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                              style={{ color: cat.color }}
                            />
                          </Disclosure.Button>
                          <Transition
                            enter="transition duration-150 ease-out"
                            enterFrom="opacity-0 -translate-y-2"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition duration-100 ease-in"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 -translate-y-2"
                          >
                            <Disclosure.Panel className="px-6 pb-6 text-sm text-gray-500 leading-relaxed border-t pt-4">
                              {faq.a}
                            </Disclosure.Panel>
                          </Transition>
                        </div>
                      )}
                    </Disclosure>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── CTA ── */}
          <div className="mx-auto mt-10" style={{ maxWidth: 768 }}>
            <div className="rounded-xl p-6 md:p-8 text-center relative overflow-hidden" style={{ backgroundColor: '#003D1C' }}>
              <div className="absolute top-0 left-0 right-0 flex" style={{ height: 4 }}>
                <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
                <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
                <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
              </div>
              <MessageCircle size={32} className="mx-auto mb-4" style={{ color: '#009A44' }} />
              <h3 className="font-bold text-lg text-white mb-2">Vous n'avez pas trouvé votre réponse ?</h3>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.60)' }}>Notre équipe est disponible via WhatsApp pour répondre à toutes vos questions</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-2 font-semibold text-sm text-white"
                  style={{ backgroundColor: '#009A44' }}>
                  <MessageCircle size={16} /> Contacter via WhatsApp
                </a>
                <Link to="/contact"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-2 font-semibold text-sm text-white border"
                  style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)' }}>
                  Formulaire de contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
