// ─── Hero Slider avec sidebar catégories ────────────────────────────────────

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ArrowRight, MessageCircle, Tag, Wrench, Zap,
} from 'lucide-react';
import { CATEGORIES_NAV, WHATSAPP_NUMBER } from '../../utils/constants';

interface Banner {
  _id: string; title: string; subtitle?: string; description?: string;
  badge?: string; cta: string; link: string; image: string;
}

interface Props {
  banners: Banner[];
  currentSlide: number;
  onSlideChange: (i: number) => void;
}

export default function HeroSlider({ banners, currentSlide, onSlideChange }: Props) {
  const slide = banners[currentSlide] ?? banners[0];

  return (
    <section className="bg-gray-100 border-b">
      <div className="container-custom">
        <div className="flex gap-0 py-3">

          {/* Category Sidebar */}
          <aside className="hidden lg:block shrink-0" style={{ width: '220px' }}>
            <div className="bg-white rounded-xl border overflow-hidden h-full flex flex-col shadow-sm">
              <div className="px-3 py-2.5" style={{ backgroundColor: '#009A44' }}>
                <h2 className="text-white font-bold text-xs uppercase" style={{ letterSpacing: '0.06em' }}>
                  Toutes catégories
                </h2>
              </div>
              <div className="flex" style={{ height: '3px' }}>
                <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
                <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
                <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
              </div>
              <nav className="py-1 flex-1">
                {CATEGORIES_NAV.map((cat) => (
                  <Link key={cat.slug} to={`/boutique/${cat.slug}`}
                    className="flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 transition-colors no-underline hover:bg-green-50 group">
                    <span className="text-base leading-none">{cat.icon}</span>
                    <span className="text-sm text-gray-800 font-medium group-hover:text-[#009A44] transition-colors">{cat.name}</span>
                    <ChevronRight size={12} className="ml-auto text-gray-300 group-hover:text-[#009A44]" />
                  </Link>
                ))}
                <div className="px-3 py-2 border-t mt-1">
                  <Link to="/boutique?onSale=true" className="flex items-center gap-2.5 transition-colors no-underline group">
                    <Tag size={14} style={{ color: '#E31B23' }} />
                    <span className="text-sm font-semibold group-hover:underline" style={{ color: '#E31B23' }}>Promotions</span>
                    <ChevronRight size={12} className="ml-auto opacity-40" style={{ color: '#E31B23' }} />
                  </Link>
                </div>
                <div className="px-3 py-2 border-t">
                  <Link to="/services" className="flex items-center gap-2.5 transition-colors no-underline group">
                    <Wrench size={14} style={{ color: '#009A44' }} />
                    <span className="text-sm font-semibold group-hover:underline" style={{ color: '#009A44' }}>Nos Services</span>
                    <ChevronRight size={12} className="ml-auto opacity-40" style={{ color: '#009A44' }} />
                  </Link>
                </div>
              </nav>
            </div>
          </aside>

          {/* Hero Slider */}
          <div className="flex-1 relative rounded-xl overflow-hidden lg:ml-3 shadow-md" style={{ minHeight: '260px' }}>
            <AnimatePresence mode="wait">
              <motion.img key={currentSlide} src={slide.image} alt=""
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 w-full h-full object-cover"
                loading={currentSlide === 0 ? 'eager' : 'lazy'}
                {...(currentSlide === 0 ? ({ fetchpriority: 'high' } as object) : {})}
                decoding="async"
              />
            </AnimatePresence>

            <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, #003D1C 0%, #005C29 28%, rgba(0,60,28,0.65) 58%, transparent 100%)' }} />
            <div className="absolute top-0 right-0 bottom-0 pointer-events-none"
              style={{ width: '6rem', background: 'linear-gradient(to left, rgba(206,17,38,0.18), transparent)' }} />
            <div className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: '5px' }}>
              <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
              <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
              <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-center py-6" style={{ paddingLeft: '3.5rem', paddingRight: '3rem' }}>
              <motion.span key={`badge-${currentSlide}`}
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-3 self-start border font-bold uppercase"
                style={{ fontSize: '10px', letterSpacing: '0.06em', backgroundColor: 'rgba(252,209,22,0.15)', color: '#FCD116', borderColor: 'rgba(252,209,22,0.35)' }}>
                <Zap size={9} /> {slide.badge}
              </motion.span>

              <motion.h1 key={`title-${currentSlide}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }} className="font-bold text-white mb-1"
                style={{ fontSize: 'clamp(1.3rem, 3.5vw, 2.8rem)', lineHeight: 1.1 }}>
                {slide.title}
              </motion.h1>
              <motion.p key={`sub-${currentSlide}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }} className="text-base font-semibold mb-2" style={{ color: '#FCD116' }}>
                {slide.subtitle}
              </motion.p>
              <motion.p key={`desc-${currentSlide}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13 }} className="text-sm leading-relaxed mb-5 max-w-xs"
                style={{ color: 'rgba(255,255,255,0.62)' }}>
                {slide.description}
              </motion.p>

              <div className="flex flex-wrap items-center gap-3">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link to={slide.link}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm no-underline shadow-lg transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#FCD116', color: '#003D1C', boxShadow: '0 6px 20px rgba(252,209,22,0.4)' }}>
                    {slide.cta} <ArrowRight size={14} />
                  </Link>
                </motion.div>
                <motion.a whileTap={{ scale: 0.97 }}
                  href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-semibold no-underline shadow-lg transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#009A44', boxShadow: '0 6px 20px rgba(0,154,68,0.35)' }}>
                  <MessageCircle size={13} /> WhatsApp
                </motion.a>
              </div>

              <div className="mt-5 flex items-center gap-2">
                {banners.map((_, i) => (
                  <button key={i} onClick={() => onSlideChange(i)}
                    className="border-0 p-0 rounded-full transition-all duration-300"
                    style={{ height: '4px', width: i === currentSlide ? 26 : 6,
                      backgroundColor: i === currentSlide ? '#FCD116' : 'rgba(255,255,255,0.3)' }} />
                ))}
                <span className="ml-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {currentSlide + 1}/{banners.length}
                </span>
              </div>
            </div>

            {[
              { dir: 'prev', icon: ChevronLeft, pos: 'left-2', onClick: () => onSlideChange((currentSlide - 1 + banners.length) % banners.length) },
              { dir: 'next', icon: ChevronRight, pos: 'right-2', onClick: () => onSlideChange((currentSlide + 1) % banners.length) },
            ].map(({ dir, icon: Icon, pos, onClick }) => (
              <button key={dir} onClick={onClick}
                className={`absolute ${pos} top-1/2 -translate-y-1/2 border-0 flex items-center justify-center text-white rounded-full transition-all hover:bg-black/50`}
                style={{ width: 34, height: 34, backgroundColor: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(4px)' }}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
