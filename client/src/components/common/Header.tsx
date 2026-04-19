import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Heart, ShoppingCart, User, Menu, X, ChevronDown, LogOut, Globe, Wrench, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Menu as HMenu, Transition, Popover } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Fragment } from 'react';
import { RootState } from '../../store/store';
import { selectCartCount, openCartDrawer } from '../../features/cart/cartSlice';
import { logout } from '../../features/auth/authSlice';
import { CATEGORIES_NAV, FREE_SHIPPING_THRESHOLD } from '../../utils/constants';
import { formatPrice } from '../../utils/formatPrice';
import api from '../../services/api';
import SearchBar from './SearchBar';

interface Announcement {
  _id: string;
  text: string;
  link?: string;
  linkLabel?: string;
  image?: string;
  bgColor: string;
  textColor: string;
}

const DEFAULT_ANNOUNCEMENT: Announcement = {
  _id: 'default',
  text: `Livraison gratuite dès ${formatPrice(FREE_SHIPPING_THRESHOLD)} · Paiement Orange Money & Wave · Services réparation/installation`,
  bgColor: '#009A44',
  textColor: '#ffffff',
};

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([DEFAULT_ANNOUNCEMENT]);
  const [annIdx, setAnnIdx] = useState(0);
  const [annVisible, setAnnVisible] = useState(true);
  const [annDismissed, setAnnDismissed] = useState(() => {
    try { return localStorage.getItem('ann_dismissed') === '1'; } catch { return false; }
  });
  const annTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    api.get('/announcements').then(res => {
      const data: Announcement[] = res.data.data || [];
      if (data.length > 0) {
        setAnnouncements(data);
        // reset dismiss state when new announcements are loaded
        // (compare ids to detect a change)
        const savedIds = localStorage.getItem('ann_ids') || '';
        const newIds = data.map((a) => a._id).join(',');
        if (savedIds !== newIds) {
          localStorage.removeItem('ann_dismissed');
          localStorage.setItem('ann_ids', newIds);
          setAnnDismissed(false);
        }
      }
    }).catch(() => {});
  }, []);

  const dismissAnn = () => {
    setAnnDismissed(true);
    try { localStorage.setItem('ann_dismissed', '1'); } catch { /* noop */ }
    if (annTimer.current) clearInterval(annTimer.current);
  };

  useEffect(() => {
    if (announcements.length <= 1) return;
    annTimer.current = setInterval(() => {
      setAnnVisible(false);
      setTimeout(() => {
        setAnnIdx(prev => (prev + 1) % announcements.length);
        setAnnVisible(true);
      }, 350);
    }, 4500);
    return () => { if (annTimer.current) clearInterval(annTimer.current); };
  }, [announcements.length]);

  const goAnn = (dir: 1 | -1) => {
    if (annTimer.current) clearInterval(annTimer.current);
    setAnnVisible(false);
    setTimeout(() => {
      setAnnIdx(prev => (prev + dir + announcements.length) % announcements.length);
      setAnnVisible(true);
    }, 250);
  };

  const current = announcements[annIdx] ?? DEFAULT_ANNOUNCEMENT;

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const cartCount = useSelector(selectCartCount);
  const wishlistCount = useSelector((state: RootState) => state.wishlist.items.length);

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      {/* ── Top announcement bar ── */}
      {!annDismissed && (current.image ? (
        /* ── IMAGE BANNER MODE ── */
        <div
          className={`relative w-full overflow-hidden transition-all duration-300 ${annVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: current.bgColor, height: '120px' }}
        >
          {current.link ? (
            <Link to={current.link} className="block w-full h-full">
              <img src={current.image} alt={current.text} className="w-full h-full object-cover" />
              {current.text && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <span className="text-white font-semibold drop-shadow px-4 text-center">{current.text}</span>
                </div>
              )}
            </Link>
          ) : (
            <>
              <img src={current.image} alt={current.text} className="w-full h-full object-cover" />
              {current.text && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <span className="text-white font-semibold drop-shadow px-4 text-center">{current.text}</span>
                </div>
              )}
            </>
          )}

          {/* Nav controls */}
          {announcements.length > 1 && (
            <>
              <button
                onClick={() => goAnn(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full text-white transition-colors z-10"
                style={{ width: '1.75rem', height: '1.75rem', backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', marginLeft: '0.5rem' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => goAnn(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full text-white transition-colors z-10"
                style={{ width: '1.75rem', height: '1.75rem', backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', marginRight: '2.5rem' }}
              >
                <ChevronRight size={14} />
              </button>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 pb-2">
                {announcements.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { if (annTimer.current) clearInterval(annTimer.current); setAnnIdx(i); }}
                    className="rounded-full transition-all duration-300 bg-white border-0"
                    style={{ width: i === annIdx ? 16 : 5, height: 5, opacity: i === annIdx ? 0.95 : 0.45 }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Dismiss button */}
          <button
            onClick={dismissAnn}
            aria-label="Fermer l'annonce"
            className="absolute top-2 right-2 flex items-center justify-center rounded-full z-20 border-0 transition-opacity opacity-75 hover:opacity-100"
            style={{ width: '1.5rem', height: '1.5rem', backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }}
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        /* ── TEXT BAR MODE ── */
        <div
          className="relative flex items-center justify-center py-2 transition-colors duration-500"
          style={{ backgroundColor: current.bgColor, minHeight: '34px', paddingLeft: '2.5rem', paddingRight: '5rem' }}
        >
          {announcements.length > 1 && (
            <button
              onClick={() => goAnn(-1)}
              className="absolute left-0 p-1 rounded border-0 opacity-75 transition-opacity"
              style={{ color: current.textColor, backgroundColor: 'transparent', marginLeft: '0.5rem' }}
            >
              <ChevronLeft size={14} />
            </button>
          )}

          <div
            className={`text-sm font-medium text-center transition-all duration-300 ${annVisible ? 'opacity-100 translate-y-0' : 'opacity-0'}`}
            style={{ color: current.textColor }}
          >
            {current.link ? (
              <Link to={current.link} className="transition-opacity no-underline" style={{ color: current.textColor }}>
                {current.text}
                {current.linkLabel && <span className="ml-2 underline font-semibold">{current.linkLabel}</span>}
              </Link>
            ) : (
              <span>{current.text}</span>
            )}
          </div>

          {/* Dots + next arrow + dismiss grouped on the right */}
          <div className="absolute right-0 flex items-center gap-1 pr-1">
            {announcements.length > 1 && (
              <>
                <div className="flex items-center gap-1 mr-1">
                  {announcements.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { if (annTimer.current) clearInterval(annTimer.current); setAnnIdx(i); }}
                      className="rounded-full transition-all duration-300 border-0"
                      style={{ width: i === annIdx ? 16 : 5, height: 5, backgroundColor: current.textColor, opacity: i === annIdx ? 0.9 : 0.35 }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => goAnn(1)}
                  className="p-1 rounded border-0 opacity-75 transition-opacity"
                  style={{ color: current.textColor, backgroundColor: 'transparent' }}
                >
                  <ChevronRight size={14} />
                </button>
              </>
            )}
            {/* Dismiss button */}
            <button
              onClick={dismissAnn}
              aria-label="Fermer l'annonce"
              className="p-1 rounded border-0 opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: current.textColor, backgroundColor: 'transparent', marginRight: '0.25rem' }}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ))}

      {/* ── Main header row: Logo + Search + Icons ── */}
      <div className="bg-white border-b">
        <div className="container-custom">
          <div className="flex items-center gap-3 py-3" style={{ minHeight: '4rem' }}>

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-1 shrink-0 border-0 bg-transparent">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 no-underline">
              <img src="/logo.svg" alt="TechAfrique" className="rounded-lg" style={{ height: '2.75rem', width: 'auto', maxWidth: '11rem' }} />
            </Link>

            {/* ── Search bar (prominent, centered) ── */}
            <SearchBar className="flex-1" />

            {/* ── Right icons ── */}
            <div className="flex items-center gap-1 shrink-0">

              {/* Language toggle */}
              <button
                onClick={toggleLanguage}
                title={i18n.language === 'fr' ? 'Switch to English' : 'Passer en Français'}
                className="hidden xl:flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-semibold text-gray-600 transition-all hover:border-primary hover:text-primary"
                style={{ fontSize: '0.75rem' }}
              >
                <Globe size={14} />
                {i18n.language === 'fr' ? 'EN' : 'FR'}
              </button>

              {/* Favorites */}
              <button
                onClick={() => user ? navigate('/favoris') : navigate('/connexion')}
                className="relative hidden sm:flex flex-col items-center justify-center rounded-lg border-0 bg-transparent text-gray-600 transition-all hover:bg-gray-100"
                style={{ width: '2.75rem', height: '2.75rem' }}
                title="Mes favoris"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span
                    className="absolute flex items-center justify-center rounded-full font-bold text-white"
                    style={{
                      top: '-2px', right: '-2px',
                      minWidth: '18px', height: '18px',
                      padding: '0 3px',
                      fontSize: '10px',
                      backgroundColor: '#E31B23',
                    }}
                  >
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button
                onClick={() => dispatch(openCartDrawer())}
                aria-label="Ouvrir le panier"
                className="relative flex flex-col items-center justify-center rounded-lg border-0 bg-transparent text-gray-600 transition-all hover:bg-gray-100"
                style={{ width: '2.75rem', height: '2.75rem' }}
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span
                    className="absolute flex items-center justify-center rounded-full font-bold text-white"
                    style={{
                      top: '-2px', right: '-2px',
                      minWidth: '18px', height: '18px',
                      padding: '0 3px',
                      fontSize: '10px',
                      backgroundColor: '#009A44',
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Profile — Headless UI Menu */}
              <div className="relative">
                {user ? (
                  <HMenu as="div" className="relative">
                    <HMenu.Button
                      className="flex items-center gap-2 rounded-full transition-all text-gray-900"
                      style={{ paddingLeft: '0.5rem', paddingRight: '0.75rem', paddingTop: '0.375rem', paddingBottom: '0.375rem', background: 'transparent', border: '1px solid #dee2e6' }}
                    >
                      <div
                        className="flex items-center justify-center rounded-full text-white text-sm font-bold shrink-0"
                        style={{ width: '1.75rem', height: '1.75rem', background: 'linear-gradient(135deg, #009A44, #007A35)', fontSize: '0.75rem' }}
                      >
                        {(user.firstName || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden lg:block text-sm font-semibold truncate" style={{ maxWidth: '4.5rem' }}>
                        {user.firstName || user.email?.split('@')[0]}
                      </span>
                      <ChevronDown size={12} className="hidden lg:block opacity-50" />
                    </HMenu.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-150"
                      enterFrom="transform opacity-0 scale-95 -translate-y-1"
                      enterTo="transform opacity-100 scale-100 translate-y-0"
                      leave="transition ease-in duration-100"
                      leaveFrom="transform opacity-100 scale-100 translate-y-0"
                      leaveTo="transform opacity-0 scale-95 -translate-y-1"
                    >
                      <HMenu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border z-50 overflow-hidden focus:outline-none" style={{ top: '100%' }}>
                        {/* Header */}
                        <div className="px-4 py-3 border-b" style={{ background: 'linear-gradient(135deg, #009A44, #007A35)' }}>
                          <p className="font-bold text-sm text-white mb-0">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-white truncate mb-0" style={{ opacity: 0.7 }}>{user.email}</p>
                        </div>
                        <HMenu.Item>
                          {({ active }) => (
                            <Link to="/mon-compte" className={`flex items-center gap-2 px-4 py-2 text-sm no-underline text-gray-800 transition-colors ${active ? 'bg-gray-50' : ''}`}>
                              <User size={14} className="opacity-50" /> Mon compte
                            </Link>
                          )}
                        </HMenu.Item>
                        <HMenu.Item>
                          {({ active }) => (
                            <Link to="/mon-compte/commandes" className={`flex items-center gap-2 px-4 py-2 text-sm no-underline text-gray-800 transition-colors ${active ? 'bg-gray-50' : ''}`}>
                              <ShoppingCart size={14} className="opacity-50" /> Mes commandes
                            </Link>
                          )}
                        </HMenu.Item>
                        <HMenu.Item>
                          {({ active }) => (
                            <Link to="/favoris" className={`flex items-center gap-2 px-4 py-2 text-sm no-underline text-gray-800 transition-colors ${active ? 'bg-gray-50' : ''}`}>
                              <Heart size={14} className="opacity-50" /> Ma wishlist
                            </Link>
                          )}
                        </HMenu.Item>
                        {(user.role === 'admin' || user.role === 'superadmin') && (
                          <HMenu.Item>
                            {({ active }) => (
                              <Link to="/admin" className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold no-underline transition-colors ${active ? 'bg-gray-50' : ''}`} style={{ color: '#009A44' }}>
                                <span className="flex items-center justify-center rounded" style={{ width: '0.875rem', height: '0.875rem', backgroundColor: '#009A44', opacity: 0.8 }}>
                                  <span className="text-white font-bold" style={{ fontSize: '8px' }}>A</span>
                                </span>
                                Administration
                              </Link>
                            )}
                          </HMenu.Item>
                        )}
                        <hr className="my-1 border-gray-100" />
                        <HMenu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => dispatch(logout())}
                              className={`w-full text-left flex items-center gap-2 px-4 py-2 text-sm border-0 bg-transparent transition-colors ${active ? 'bg-red-50' : ''}`}
                              style={{ color: '#E31B23' }}
                            >
                              <LogOut size={14} /> Déconnexion
                            </button>
                          )}
                        </HMenu.Item>
                      </HMenu.Items>
                    </Transition>
                  </HMenu>
                ) : (
                  <button
                    onClick={() => navigate('/connexion')}
                    className="flex items-center gap-2 rounded-full font-semibold text-sm text-white border-0 transition-all"
                    style={{ background: 'linear-gradient(135deg, #009A44, #007A35)', boxShadow: '0 4px 12px rgba(0,133,63,0.3)', padding: '0.5rem 1rem' }}
                  >
                    <User size={15} />
                    <span className="hidden sm:block">Connexion</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Nav row ── */}
      <nav className="hidden lg:block text-white" style={{ backgroundColor: '#E31B23' }}>
        <div className="container-custom">
          <div className="flex items-center">

            {/* All categories — Headless UI Popover */}
            <Popover className="relative shrink-0">
              {({ open }) => (
                <>
                  <Popover.Button
                    className="flex items-center gap-2 text-white border-0 px-4 py-3 text-sm font-semibold transition-colors focus:outline-none"
                    style={{ backgroundColor: '#009A44' }}
                    onMouseEnter={() => setCategoriesOpen(true)}
                    onMouseLeave={() => setCategoriesOpen(false)}
                  >
                    <Menu size={16} />
                    Toutes les catégories
                    <ChevronDown size={13} className={`transition-transform duration-200 ${open || categoriesOpen ? 'rotate-180' : ''}`} />
                  </Popover.Button>

                  <Transition
                    show={open || categoriesOpen}
                    as={Fragment}
                    enter="transition ease-out duration-150"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel
                      static
                      className="absolute bg-white text-gray-900 shadow-lg border rounded-b-xl z-50 py-1"
                      style={{ top: '100%', left: 0, width: '15rem' }}
                      onMouseEnter={() => setCategoriesOpen(true)}
                      onMouseLeave={() => setCategoriesOpen(false)}
                    >
                      {CATEGORIES_NAV.map((cat) => (
                        <Link
                          key={cat.slug}
                          to={`/boutique/${cat.slug}`}
                          className="flex items-center gap-3 px-4 py-2 text-sm font-medium no-underline text-gray-800 border-b border-gray-100 transition-colors hover:bg-gray-50"
                        >
                          <span className="text-base">{cat.icon}</span>
                          {cat.name}
                        </Link>
                      ))}
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>

            {/* Nav links */}
            <div className="flex items-center">
              <Link
                to="/boutique"
                className="text-sm font-medium no-underline px-4 py-2 mx-0.5 rounded-lg transition-colors hover:text-white hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                Boutique
              </Link>
              <Link
                to="/boutique?onSale=true"
                className="flex items-center gap-1 text-sm font-semibold no-underline px-4 py-2 mx-0.5 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: '#FCD116' }}
              >
                <Tag size={13} /> Promos
              </Link>
              <Link
                to="/boutique?sort=newest"
                className="text-sm font-medium no-underline px-4 py-2 mx-0.5 rounded-lg transition-colors hover:text-white hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                Nouveautés
              </Link>
              <Link
                to="/services"
                className="flex items-center gap-1 text-sm font-semibold no-underline px-4 py-2 mx-0.5 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: '#FCD116' }}
              >
                <Wrench size={13} /> Services
              </Link>
              <Link
                to="/contact"
                className="text-sm font-medium no-underline px-4 py-2 mx-0.5 rounded-lg transition-colors hover:text-white hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                Contact
              </Link>
            </div>

            {/* Right: free shipping info */}
            <div className="ml-auto text-sm hidden xl:block pr-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              🚚 Livraison gratuite dès {formatPrice(FREE_SHIPPING_THRESHOLD)}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t bg-white overflow-hidden"
          >
            {/* Mobile search */}
            <div className="container-custom pt-4 pb-2">
              <SearchBar
                placeholder="Rechercher un produit..."
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
            <nav className="container-custom pb-4">
              <div className="flex flex-col gap-1">
                {CATEGORIES_NAV.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/boutique/${cat.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium no-underline text-gray-800 rounded-xl transition-colors hover:bg-gray-50"
                  >
                    <span>{cat.icon}</span> {cat.name}
                  </Link>
                ))}
                <Link
                  to="/boutique?onSale=true"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm font-semibold no-underline rounded-xl transition-colors"
                  style={{ color: '#E31B23' }}
                >
                  <Tag size={15} /> Promotions
                </Link>
                <Link
                  to="/services"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm font-semibold no-underline rounded-xl transition-colors"
                  style={{ color: '#009A44' }}
                >
                  <Wrench size={15} /> Services Réparation
                </Link>
                <hr className="my-2" />
                {!user ? (
                  <>
                    <button onClick={() => { setMobileOpen(false); navigate('/connexion'); }} className="w-full text-left px-4 py-2 text-sm font-medium border-0 bg-transparent rounded-xl">
                      Connexion
                    </button>
                    <button onClick={() => { setMobileOpen(false); navigate('/inscription'); }} className="w-full text-left px-4 py-2 text-sm font-semibold border-0 bg-transparent rounded-xl" style={{ color: '#009A44' }}>
                      Créer un compte
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/mon-compte" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm no-underline text-gray-800 rounded-xl">
                      Mon compte
                    </Link>
                    <Link to="/favoris" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm no-underline text-gray-800 rounded-xl">
                      Favoris ({wishlistCount})
                    </Link>
                    <button
                      onClick={() => { dispatch(logout()); setMobileOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm border-0 bg-transparent rounded-xl flex items-center gap-2 text-red-500"
                    >
                      <LogOut size={15} /> Déconnexion
                    </button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
