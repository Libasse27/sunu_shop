// ─── Section Services sur la page d'accueil ──────────────────────────────────

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Wrench, CheckCircle, MessageCircle } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../../utils/constants';

interface Service {
  _id: string; title: string; slug: string; shortDescription: string;
  startingPrice: number; estimatedDuration: string; image: string;
  features: string[]; whatsappMessage: string;
}

interface Props {
  services: Service[];
}

export default function HomeServicesSection({ services }: Props) {
  if (services.length === 0) return null;
  return (
    <section className="bg-gray-50 border-t py-4">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full shrink-0" style={{ width: 4, height: 24, backgroundColor: '#009A44' }} />
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(0,154,68,0.1)', color: '#007A35', letterSpacing: '0.07em' }}>
              <Wrench size={10} /> Services
            </span>
            <h2 className="font-bold text-xl text-gray-900 mb-0">Réparation & Installation</h2>
          </div>
          <Link to="/services" className="text-sm font-medium flex items-center gap-1 no-underline shrink-0" style={{ color: '#009A44' }}>
            Voir tout <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.slice(0, 6).map((service, i) => (
            <motion.div key={service._id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-gray-900 text-sm leading-snug">{service.title}</h3>
                <span className="text-xl shrink-0 leading-none">🔧</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{service.shortDescription}</p>
              {service.features?.slice(0, 3).map((f) => (
                <div key={f} className="flex items-center gap-2 mb-1">
                  <CheckCircle size={11} style={{ color: '#009A44' }} className="shrink-0" />
                  <span className="text-xs text-gray-600">{f}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 flex items-center justify-between border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 mb-0">À partir de</p>
                  <p className="font-bold text-sm mb-0" style={{ color: '#009A44' }}>
                    {new Intl.NumberFormat('fr-FR').format(service.startingPrice)} FCFA
                  </p>
                </div>
                <motion.a whileTap={{ scale: 0.97 }}
                  href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(
                    service.whatsappMessage || `Bonjour, je suis intéressé par ${service.title}`
                  )}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-white px-3 py-2 rounded-lg text-xs font-semibold no-underline transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#009A44' }}>
                  <MessageCircle size={12} /> WhatsApp
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
