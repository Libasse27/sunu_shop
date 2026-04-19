import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, RefreshCw, ShoppingBag } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/product/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { RootState, AppDispatch } from '../store/store';
import { syncWishlist, clearWishlist } from '../features/wishlist/wishlistSlice';

export default function WishlistPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, products, syncing } = useSelector((state: RootState) => state.wishlist);

  // Les produits disponibles : ceux dont l'ID est encore dans items
  // (filtre les produits inactifs éventuellement renvoyés par le serveur)
  const visibleProducts = products.filter((p) => items.includes(p._id));

  // Si items > 0 mais products vide, l'utilisateur est arrivé avant syncWishlist
  const needsSync = items.length > 0 && products.length === 0 && !syncing;

  return (
    <>
      <Helmet>
        <title>{`Mes Favoris (${items.length}) — Sunu Shop`}</title>
      </Helmet>

      {/* Hero sénégalais */}
      <section className="relative border-b py-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #003D1C 0%, #005C29 50%, #003D1C 100%)' }}>
        <div className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: '5px' }}>
          <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
        </div>
        <div className="container-custom relative z-10 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl text-white mb-0">
              Mes Favoris
              {items.length > 0 && (
                <span className="ml-2 text-base font-normal" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  ({items.length} produit{items.length > 1 ? 's' : ''})
                </span>
              )}
            </h1>
            <p className="text-sm mt-1 mb-0" style={{ color: 'rgba(255,255,255,0.5)' }}>Vos coups de cœur sauvegardés</p>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => dispatch(clearWishlist())}
              className="text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors"
              style={{ color: '#FCD116', borderColor: 'rgba(252,209,22,0.3)', background: 'rgba(252,209,22,0.1)' }}
            >
              Tout effacer
            </button>
          )}
        </div>
      </section>

      <div className="container-custom py-6 md:py-8">

        {/* Loading initial */}
        {syncing && (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Besoin d'un sync (arrivée directe sur la page) */}
        {!syncing && needsSync && (
          <div className="text-center py-16">
            <RefreshCw size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Chargement de vos favoris…</p>
            <button
              onClick={() => dispatch(syncWishlist())}
              className="btn-primary"
            >
              Charger mes favoris
            </button>
          </div>
        )}

        {/* Wishlist vide */}
        {!syncing && !needsSync && items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Heart
              size={72}
              className="mx-auto mb-6 text-gray-200"
              strokeWidth={1.5}
            />
            <h2 className="font-bold text-2xl mb-2 text-gray-800">
              Aucun favori pour l'instant
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Explorez notre boutique et cliquez sur{' '}
              <Heart size={14} className="inline text-red-400" fill="currentColor" />{' '}
              pour sauvegarder vos coups de cœur.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/boutique" className="btn-primary">
                Découvrir la boutique
              </Link>
              <Link
                to="/boutique?sort=bestseller"
                className="btn-outline flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} />
                Meilleures ventes
              </Link>
            </div>
          </motion.div>
        )}

        {/* Grille de produits */}
        {!syncing && !needsSync && visibleProducts.length > 0 && (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4"
            >
              {visibleProducts.map((p) => (
                <motion.div
                  key={p._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* items > 0 mais aucun produit visible après sync (produits supprimés/inactifs) */}
        {!syncing && !needsSync && items.length > 0 && visibleProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">
              Certains produits de votre liste ne sont plus disponibles.
            </p>
            <Link to="/boutique" className="btn-primary">
              Voir la boutique
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
