import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Truck, Shield, RotateCcw, Headphones,
  ChevronLeft, ChevronRight, MessageCircle, Wrench, CheckCircle,
  Star, Zap, Package, Tag, Clock, Flame,
} from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';
import { Product } from '../types/product.types';
import { SITE_NAME, CATEGORIES_NAV, WHATSAPP_NUMBER } from '../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PromoBanner {
  _id: string; badge: string; title: string; highlight: string;
  description: string; buttonText: string; buttonLink: string; accentColor: string;
}
interface Banner {
  _id: string; title: string; subtitle?: string; description?: string;
  badge?: string; cta: string; link: string; image: string;
}
interface Service {
  _id: string; title: string; slug: string; shortDescription: string;
  startingPrice: number; estimatedDuration: string; image: string;
  features: string[]; whatsappMessage: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────
const defaultSlides: Banner[] = [
  {
    _id: 'default-1',
    title: 'Votre partenaire tech',
    subtitle: "en Afrique de l'Ouest",
    description: 'Laptops, smartphones, TV, électroménager — tout le matériel tech dont vous avez besoin',
    cta: 'Explorer la boutique',
    link: '/boutique',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200',
    badge: 'Livraison rapide · Dakar & régions',
  },
  {
    _id: 'default-2',
    title: 'Smartphones dernière génération',
    subtitle: 'Samsung, iPhone, Xiaomi',
    description: 'Les meilleurs smartphones au meilleur prix, avec garantie et service après-vente',
    cta: 'Voir les téléphones',
    link: '/boutique/telephones',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1200',
    badge: 'Nouveautés 2025',
  },
  {
    _id: 'default-3',
    title: 'Services Réparation & Installation',
    subtitle: 'Techniciens certifiés',
    description: 'Réparation PC, téléphones, installation caméras, réseau Wi-Fi',
    cta: 'Voir nos services',
    link: '/services',
    image: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=1200',
    badge: 'Devis gratuit via WhatsApp',
  },
];

const promoBanners = [
  {
    slug: 'informatique',
    label: 'Informatique',
    title: 'Laptops & PC',
    sub: 'Dès 150 000 FCFA',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    gradient: 'linear-gradient(to right, rgba(0,61,28,0.85) 0%, rgba(0,61,28,0.4) 60%, transparent 100%)',
    accent: '#FCD116',
  },
  {
    slug: 'telephones',
    label: 'Téléphonie',
    title: 'Smartphones 2025',
    sub: 'Samsung · iPhone · Xiaomi',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    gradient: 'linear-gradient(to right, rgba(80,0,100,0.85) 0%, rgba(80,0,100,0.4) 60%, transparent 100%)',
    accent: '#FCD116',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFlashSaleCountdown() {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 };
}

function SectionHeader({
  label, labelIcon, title, to, toLabel = 'Voir plus',
  accent = '#009A44',
}: {
  label?: string; labelIcon?: React.ReactNode; title: string;
  to: string; toLabel?: string; accent?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full shrink-0" style={{ width: 4, height: 24, backgroundColor: accent }} />
        {label && (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded"
            style={{ backgroundColor: accent + '18', color: accent, letterSpacing: '0.07em' }}>
            {labelIcon} {label}
          </span>
        )}
        <h2 className="font-bold text-xl text-gray-900 mb-0">{title}</h2>
      </div>
      <Link to={to} className="text-sm font-medium flex items-center gap-1 no-underline shrink-0"
        style={{ color: accent }}>
        {toLabel} <ArrowRight size={13} />
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [banners, setBanners] = useState<Banner[]>(defaultSlides);
  const [promoBanner, setPromoBanner] = useState<PromoBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [countdown, setCountdown] = useState(getFlashSaleCountdown);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [f, n, b, s, bann, promo] = await Promise.all([
          api.get('/products/featured'),
          api.get('/products/new-arrivals'),
          api.get('/products/best-sellers'),
          api.get('/services'),
          api.get('/banners'),
          api.get('/promo-banners'),
        ]);
        setFeatured(f.data.data || []);
        setNewArrivals(n.data.data || []);
        setBestSellers(b.data.data || []);
        setServices(s.data.data || []);
        if (bann.data.data?.length > 0) setBanners(bann.data.data);
        if (promo.data.data) setPromoBanner(promo.data.data);
      } catch {
        // silently fail — defaults already set
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Hero auto-slide
  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % banners.length), 5500);
    return () => clearInterval(t);
  }, [banners.length]);

  // Flash sale countdown
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((prev) => {
        let { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        return { h: 0, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  const slide = banners[currentSlide] ?? banners[0];
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <>
      <Helmet>
        <title>{SITE_NAME} — Informatique, Électronique & Services Tech</title>
        <meta name="description"
          content="Boutique en ligne de matériel informatique, smartphones, TV et électroménager. Services réparation et installation. Livraison en Afrique de l'Ouest. Paiement Orange Money, Wave." />
      </Helmet>

      {/* ══ 1. HERO + SIDEBAR ═════════════════════════════════════════════════ */}
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
                {/* Pan-African strip */}
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
                      <span className="text-sm text-gray-800 font-medium group-hover:text-[#009A44] transition-colors">
                        {cat.name}
                      </span>
                      <ChevronRight size={12} className="ml-auto text-gray-300 group-hover:text-[#009A44]" />
                    </Link>
                  ))}
                  <div className="px-3 py-2 border-t mt-1">
                    <Link to="/boutique?onSale=true"
                      className="flex items-center gap-2.5 transition-colors no-underline group">
                      <Tag size={14} style={{ color: '#E31B23' }} />
                      <span className="text-sm font-semibold group-hover:underline" style={{ color: '#E31B23' }}>
                        Promotions
                      </span>
                      <ChevronRight size={12} className="ml-auto opacity-40" style={{ color: '#E31B23' }} />
                    </Link>
                  </div>
                  <div className="px-3 py-2 border-t">
                    <Link to="/services"
                      className="flex items-center gap-2.5 transition-colors no-underline group">
                      <Wrench size={14} style={{ color: '#009A44' }} />
                      <span className="text-sm font-semibold group-hover:underline" style={{ color: '#009A44' }}>
                        Nos Services
                      </span>
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
                  className="absolute inset-0 w-full h-full object-cover" />
              </AnimatePresence>

              {/* Overlay */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(105deg, #003D1C 0%, #005C29 28%, rgba(0,60,28,0.65) 58%, transparent 100%)',
              }} />
              {/* Red right accent */}
              <div className="absolute top-0 right-0 bottom-0 pointer-events-none"
                style={{ width: '6rem', background: 'linear-gradient(to left, rgba(206,17,38,0.18), transparent)' }} />
              {/* Pan-African left bar */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: '5px' }}>
                <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
                <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
                <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-center py-6"
                style={{ paddingLeft: '3.5rem', paddingRight: '3rem' }}>
                {/* Badge */}
                <motion.span key={`badge-${currentSlide}`}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-3 self-start border font-bold uppercase"
                  style={{ fontSize: '10px', letterSpacing: '0.06em', backgroundColor: 'rgba(252,209,22,0.15)', color: '#FCD116', borderColor: 'rgba(252,209,22,0.35)' }}>
                  <Zap size={9} /> {slide.badge}
                </motion.span>

                <motion.h1 key={`title-${currentSlide}`}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="font-bold text-white mb-1"
                  style={{ fontSize: 'clamp(1.3rem, 3.5vw, 2.8rem)', lineHeight: 1.1 }}>
                  {slide.title}
                </motion.h1>
                <motion.p key={`sub-${currentSlide}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="text-base font-semibold mb-2" style={{ color: '#FCD116' }}>
                  {slide.subtitle}
                </motion.p>
                <motion.p key={`desc-${currentSlide}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.13 }}
                  className="text-sm leading-relaxed mb-5 max-w-xs"
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

                {/* Dots */}
                <div className="mt-5 flex items-center gap-2">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)}
                      className="border-0 p-0 rounded-full transition-all duration-300"
                      style={{ height: '4px', width: i === currentSlide ? 26 : 6,
                        backgroundColor: i === currentSlide ? '#FCD116' : 'rgba(255,255,255,0.3)' }} />
                  ))}
                  <span className="ml-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {currentSlide + 1}/{banners.length}
                  </span>
                </div>
              </div>

              {/* Prev/Next */}
              {[
                { dir: 'prev', icon: ChevronLeft, pos: 'left-2', onClick: () => setCurrentSlide((p) => (p - 1 + banners.length) % banners.length) },
                { dir: 'next', icon: ChevronRight, pos: 'right-2', onClick: () => setCurrentSlide((p) => (p + 1) % banners.length) },
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

      {/* ══ 2. FEATURES STRIP ════════════════════════════════════════════════ */}
      <section className="bg-white border-b shadow-sm">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
            {[
              { icon: Truck,      title: 'Livraison rapide',      desc: 'Dakar & régions',           color: '#009A44' },
              { icon: Shield,     title: 'Produits garantis',     desc: 'Originaux & certifiés',     color: '#FCD116' },
              { icon: RotateCcw,  title: 'SAV réactif',           desc: 'Support technique',         color: '#E31B23' },
              { icon: Headphones, title: 'Techniciens certifiés', desc: 'Réparation & installation', color: '#009A44' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-center gap-3 px-4 py-3">
                <div className="rounded-lg flex items-center justify-center shrink-0"
                  style={{ width: 38, height: 38, backgroundColor: color + '18' }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 mb-0">{title}</p>
                  <p className="text-xs text-gray-500 mb-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 3. CATEGORIES QUICK NAV (Jumia style) ════════════════════════════ */}
      <section className="bg-white border-b">
        <div className="container-custom py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {CATEGORIES_NAV.map((cat) => (
              <motion.div key={cat.slug} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link to={`/boutique/${cat.slug}`}
                  className="flex flex-col items-center gap-1.5 min-w-[80px] px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#009A44] hover:bg-green-50 transition-all no-underline group shadow-sm">
                  <span className="text-2xl leading-none">{cat.icon}</span>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight group-hover:text-[#009A44] transition-colors"
                    style={{ whiteSpace: 'nowrap' }}>
                    {cat.name.split(' ')[0]}
                  </span>
                </Link>
              </motion.div>
            ))}
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link to="/boutique?onSale=true"
                className="flex flex-col items-center gap-1.5 min-w-[80px] px-3 py-2.5 rounded-xl border bg-white transition-all no-underline group shadow-sm"
                style={{ borderColor: '#E31B2340' }}>
                <Tag size={24} style={{ color: '#E31B23' }} />
                <span className="text-xs font-semibold text-center leading-tight"
                  style={{ color: '#E31B23', whiteSpace: 'nowrap' }}>
                  Promos
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ 4. FLASH SALE ════════════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section className="bg-white border-t pt-4 pb-2">
          <div className="container-custom">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full shrink-0" style={{ width: 4, height: 24, backgroundColor: '#E31B23' }} />
                <Flame size={18} style={{ color: '#E31B23' }} />
                <h2 className="font-bold text-xl text-gray-900 mb-0">Ventes Flash</h2>
                {/* Countdown */}
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white font-mono text-xs font-bold"
                  style={{ backgroundColor: '#E31B23' }}>
                  <Clock size={11} className="mr-0.5" />
                  {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                </div>
              </div>
              <Link to="/boutique?onSale=true"
                className="text-sm font-medium flex items-center gap-1 no-underline shrink-0"
                style={{ color: '#E31B23' }}>
                Voir plus <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {featured.slice(0, 5).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ 5. PROMO BANNER DUO ══════════════════════════════════════════════ */}
      <section className="bg-gray-50 border-t py-4">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {promoBanners.map((b) => (
              <motion.div key={b.slug} whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                <Link to={`/boutique/${b.slug}`}
                  className="relative block rounded-xl overflow-hidden no-underline shadow-md"
                  style={{ height: '150px' }}>
                  <img src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: b.gradient }} />
                  <div className="absolute inset-0 flex flex-col justify-center p-5">
                    <span className="text-xs font-bold uppercase mb-1 px-2 py-0.5 rounded self-start"
                      style={{ backgroundColor: b.accent + '30', color: b.accent, letterSpacing: '0.07em' }}>
                      {b.label}
                    </span>
                    <h3 className="font-bold text-white text-xl mb-1">{b.title}</h3>
                    <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>{b.sub}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg self-start"
                      style={{ backgroundColor: b.accent, color: '#003D1C' }}>
                      Découvrir <ArrowRight size={11} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. NOUVEAUTÉS ════════════════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section className="bg-white border-t py-4">
          <div className="container-custom">
            <SectionHeader
              label="Derniers arrivages" labelIcon={<Package size={10} />}
              title="Nouveautés" to="/boutique?sort=newest"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {newArrivals.slice(0, 5).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ 7. PROMO BANNER (dynamic) ════════════════════════════════════════ */}
      {promoBanner && (
        <section className="bg-gray-50 border-t py-4">
          <div className="container-custom">
            <div className="relative overflow-hidden rounded-xl px-6 py-8 lg:px-10"
              style={{ background: 'linear-gradient(135deg, #003D1C 0%, #005C29 50%, #003D1C 100%)' }}>
              <div className="absolute rounded-full pointer-events-none"
                style={{ right: '-4rem', top: '-4rem', width: '16rem', height: '16rem', backgroundColor: promoBanner.accentColor, opacity: 0.1 }} />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold uppercase mb-3"
                    style={{ fontSize: '11px', letterSpacing: '0.05em', backgroundColor: `${promoBanner.accentColor}28`, color: promoBanner.accentColor }}>
                    <Zap size={11} /> {promoBanner.badge}
                  </span>
                  <h2 className="font-bold text-2xl text-white mb-2">
                    {promoBanner.title}{' '}
                    {promoBanner.highlight && <span style={{ color: promoBanner.accentColor }}>{promoBanner.highlight}</span>}
                    {' '}de réduction
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>{promoBanner.description}</p>
                </div>
                <motion.div whileTap={{ scale: 0.97 }} className="shrink-0">
                  <Link to={promoBanner.buttonLink}
                    className="inline-flex items-center gap-2 text-white px-5 py-3 rounded-lg font-semibold no-underline shadow-lg"
                    style={{ backgroundColor: promoBanner.accentColor, boxShadow: `0 8px 20px ${promoBanner.accentColor}40` }}>
                    {promoBanner.buttonText} <ArrowRight size={16} />
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ 8. SERVICES ══════════════════════════════════════════════════════ */}
      {services.length > 0 && (
        <section className="bg-gray-50 border-t py-4">
          <div className="container-custom">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full shrink-0" style={{ width: 4, height: 24, backgroundColor: '#009A44' }} />
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(0,154,68,0.1)', color: '#007A35', letterSpacing: '0.07em' }}>
                  <Wrench size={10} /> Services
                </span>
                <h2 className="font-bold text-xl text-gray-900 mb-0">Réparation & Installation</h2>
              </div>
              <Link to="/services" className="text-sm font-medium flex items-center gap-1 no-underline shrink-0"
                style={{ color: '#009A44' }}>
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
                  {/* Title */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug">{service.title}</h3>
                    <span className="text-xl shrink-0 leading-none">🔧</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{service.shortDescription}</p>

                  {/* Features */}
                  {service.features?.slice(0, 3).map((f) => (
                    <div key={f} className="flex items-center gap-2 mb-1">
                      <CheckCircle size={11} style={{ color: '#009A44' }} className="shrink-0" />
                      <span className="text-xs text-gray-600">{f}</span>
                    </div>
                  ))}

                  {/* Footer */}
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
      )}

      {/* ══ 9. MEILLEURES VENTES ═════════════════════════════════════════════ */}
      {bestSellers.length > 0 && (
        <section className="bg-white border-t py-4">
          <div className="container-custom">
            <SectionHeader
              label="Populaires" title="Meilleures Ventes"
              to="/boutique?sort=bestseller" accent="#009A44"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {bestSellers.slice(0, 6).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ 10. AVIS CLIENTS ═════════════════════════════════════════════════ */}
      <section className="bg-gray-50 border-t py-10">
        <div className="container-custom">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full shrink-0" style={{ width: 4, height: 24, backgroundColor: '#FCD116' }} />
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded"
                style={{ backgroundColor: '#FCD11620', color: '#8B7000', letterSpacing: '0.07em' }}>
                <Star size={10} className="fill-current" /> Avis clients
              </span>
              <h2 className="font-bold text-xl text-gray-900 mb-0">Ce que disent nos clients</h2>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm ml-1 text-gray-500">4.9/5 · 200+ avis</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Moussa K.',   city: 'Dakar',   flag: '🇸🇳', text: 'Mon laptop ASUS est arrivé en parfait état, la livraison était rapide. Service client très réactif sur WhatsApp.', rating: 5, accent: '#009A44' },
              { name: 'Ibrahima S.', city: 'Bamako',  flag: '🇲🇱', text: 'Réparation de mon Samsung en 2h chrono ! Techniciens professionnels, prix honnêtes. Je recommande vivement.', rating: 5, accent: '#FCD116' },
              { name: 'Fatou D.',    city: 'Conakry', flag: '🇬🇳', text: "Installation WiFi impeccable dans mon bureau. L'équipe Sunu Shop est compétente et très sérieuse.", rating: 5, accent: '#E31B23' },
            ].map((review, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                {/* Top accent line */}
                <div className="absolute top-0 left-6 right-6 h-0.5 rounded-full" style={{ backgroundColor: review.accent }} />
                {/* Stars */}
                <div className="flex gap-0.5 mb-3 mt-1">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} size={13} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-600 mb-4 italic">"{review.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ width: 38, height: 38, background: `linear-gradient(135deg, ${review.accent}, ${review.accent}99)` }}>
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-0">
                      {review.name} <span>{review.flag}</span>
                    </p>
                    <p className="mb-0 flex items-center gap-1" style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      <CheckCircle size={10} style={{ color: '#009A44' }} /> {review.city} · Client vérifié
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
