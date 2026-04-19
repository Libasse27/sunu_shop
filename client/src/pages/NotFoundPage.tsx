import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <>
      <Helmet><title>Page non trouvée — Sunu Shop</title></Helmet>

      {/* Hero sénégalais */}
      <section className="relative border-b py-16 overflow-hidden text-center" style={{ background: 'linear-gradient(135deg, #003D1C 0%, #005C29 50%, #003D1C 100%)' }}>
        <div className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: '5px' }}>
          <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
        </div>
        {/* Decorative circles */}
        <div className="absolute rounded-full pointer-events-none" style={{ top: -48, right: -48, width: 192, height: 192, backgroundColor: 'rgba(0,154,68,0.10)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ bottom: -32, left: -32, width: 144, height: 144, backgroundColor: 'rgba(227,27,35,0.10)' }} />
        <div className="container-custom relative z-10">
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="font-bold mb-2"
            style={{ fontSize: 'clamp(5rem, 15vw, 9rem)', lineHeight: 1, color: 'rgba(252,209,22,0.35)' }}
          >
            404
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-2xl font-bold text-white mb-3"
          >
            Page non trouvée
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="mb-8"
            style={{ color: 'rgba(255,255,255,0.60)', maxWidth: 400, margin: '0 auto 2rem' }}
          >
            La page que vous recherchez n'existe pas ou a été déplacée.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm"
              style={{ backgroundColor: '#FCD116', color: '#003D1C' }}
            >
              Retour à l'accueil <ArrowRight size={16} />
            </Link>
            <Link
              to="/boutique"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-white border"
              style={{ backgroundColor: '#009A44', borderColor: '#009A44' }}
            >
              Voir la boutique
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
