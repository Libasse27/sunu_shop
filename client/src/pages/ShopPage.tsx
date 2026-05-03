import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/skeletons';
import api from '../services/api';
import { productApi } from '../services/product.api';
import { Category } from '../types/product.types';
import { SITE_URL } from '../utils/constants';

const sortOptions = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular', label: 'Popularité' },
  { value: 'rating', label: 'Meilleures notes' },
  { value: 'bestseller', label: 'Meilleures ventes' },
];

export default function ShopPage() {
  const { category: categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const onSale = searchParams.get('onSale') || '';
  const inStock = searchParams.get('inStock') || '';

  // Catégories cachées 10 min — changent rarement, pas besoin de refetch à chaque page
  const { data: categoriesData, isSuccess: categoriesReady } = useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) =>
      api.get('/categories', { signal }).then(r => r.data.data as Category[]),
    staleTime: 10 * 60 * 1000,
    placeholderData: [] as Category[],
  });
  const categories = categoriesData ?? [];

  // ID de catégorie dérivé (calculé à chaque render, pas d'état séparé)
  const categoryId = categories.find(c => c.slug === categorySlug)?._id;

  // N'envoie la requête produits que si les catégories sont prêtes quand un slug est demandé
  const filtersReady = !categorySlug || categoriesReady;

  const { data: productsData, isLoading, isFetching } = useQuery({
    queryKey: ['products', { page, sort, search, categoryId, minPrice, maxPrice, onSale, inStock }],
    queryFn: () =>
      productApi.getProducts({
        page,
        limit: 20,
        sort,
        ...(search ? { search } : {}),
        ...(categoryId ? { category: categoryId } : {}),
        ...(minPrice ? { minPrice: Number(minPrice) } : {}),
        ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
        ...(onSale ? { onSale: onSale === 'true' } : {}),
        ...(inStock ? { inStock: inStock === 'true' } : {}),
      }),
    enabled: filtersReady,
    placeholderData: (prev) => prev,
  });

  const products = productsData?.data ?? [];
  const total = productsData?.pagination.total ?? 0;
  const totalPages = productsData?.pagination.totalPages ?? 1;

  // Reset page to 1 whenever the category slug changes (navigating between categories)
  useEffect(() => {
    setPage(1);
  }, [categorySlug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, categorySlug]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
    setPage(1);
  };

  const currentCategory = categories.find(c => c.slug === categorySlug);

  return (
    <>
      <Helmet>
        <title>{search ? `Résultats pour « ${search} » — Sunu Shop` : currentCategory?.name ? `${currentCategory.name} — Sunu Shop` : 'Boutique — Sunu Shop'}</title>
        <meta name="description" content={
          search
            ? `${total} produit${total !== 1 ? 's' : ''} trouvé${total !== 1 ? 's' : ''} pour « ${search} » sur Sunu Shop. Laptops, smartphones, électronique en Afrique de l'Ouest.`
            : currentCategory
              ? `Découvrez nos ${currentCategory.name} au meilleur prix. ${total} références disponibles. Livraison Dakar et régions, paiement Orange Money et Wave.`
              : 'Toute notre sélection tech : laptops, smartphones, TV, électroménager, gaming. Livraison en Afrique de l\'Ouest. Prix en FCFA.'
        } />
        <link rel="canonical" href={
          categorySlug
            ? `${SITE_URL}/boutique/${categorySlug}`
            : `${SITE_URL}/boutique`
        } />

        {/* Open Graph */}
        <meta property="og:type"        content="website" />
        <meta property="og:site_name"   content="Sunu Shop" />
        <meta property="og:title"       content={currentCategory?.name ? `${currentCategory.name} — Sunu Shop` : 'Boutique — Sunu Shop'} />
        <meta property="og:description" content={currentCategory ? `Découvrez nos ${currentCategory.name} au meilleur prix.` : 'Toute la tech au meilleur prix en Afrique de l\'Ouest.'} />
        <meta property="og:url"         content={categorySlug ? `${SITE_URL}/boutique/${categorySlug}` : `${SITE_URL}/boutique`} />

        {/* Twitter Cards */}
        <meta name="twitter:card"  content="summary" />
        <meta name="twitter:site"  content="@sunushop" />
        <meta name="twitter:title" content={currentCategory?.name ? `${currentCategory.name} — Sunu Shop` : 'Boutique Tech — Sunu Shop'} />

        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Boutique', item: `${SITE_URL}/boutique` },
            ...(currentCategory ? [{
              '@type': 'ListItem',
              position: 3,
              name: currentCategory.name,
              item: `${SITE_URL}/boutique/${currentCategory.slug}`,
            }] : []),
          ],
        })}</script>
      </Helmet>

      {/* Hero sénégalais */}
      <section className="relative border-b py-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #003D1C 0%, #005C29 50%, #003D1C 100%)' }}>
        <div className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: '5px' }}>
          <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
        </div>
        <div className="container-custom relative z-10">
          <nav className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Link to="/" className="no-underline transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.5)' }}>Accueil</Link>
            {' '}/ <span style={{ color: 'rgba(255,255,255,0.9)' }}>{currentCategory?.name || 'Boutique'}</span>
          </nav>
          <h1 className="font-bold text-2xl text-white mb-0">
            {search ? `Résultats pour « ${search} »` : currentCategory?.name || 'Boutique'}
          </h1>
          <p className="text-sm mt-1 mb-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {search
              ? `${total} produit${total !== 1 ? 's' : ''} trouvé${total !== 1 ? 's' : ''}`
              : `${total} produit${total !== 1 ? 's' : ''} disponible${total !== 1 ? 's' : ''}`
            }
          </p>
          {search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border-0 transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
            >
              <X size={12} />
              Effacer la recherche
            </button>
          )}
        </div>
      </section>

      <div className="container-custom py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg mb-0 text-gray-900">
              {search ? `« ${search} »` : currentCategory?.name || 'Tous les produits'}
            </h2>
            {/* Indicateur discret de refetch lors de changements de page/filtres */}
            {isFetching && !isLoading && (
              <span className="inline-block w-3 h-3 rounded-full border-2 border-transparent border-t-[#009A44] animate-spin" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden btn-outline text-sm flex items-center gap-2 py-2 px-3"
            >
              <SlidersHorizontal size={16} /> Filtres
            </motion.button>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="input-field text-sm pr-8 py-2 cursor-pointer"
                style={{ appearance: 'none' }}
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 mr-3 pointer-events-none text-gray-500" />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Filters Sidebar — desktop */}
          <aside className="hidden lg:block shrink-0" style={{ width: '256px' }}>
            {/* desktop sidebar content inline */}
            <FiltersContent
              categories={categories}
              categorySlug={categorySlug}
              minPrice={minPrice}
              maxPrice={maxPrice}
              inStock={inStock}
              onSale={onSale}
              updateFilter={updateFilter}
            />
          </aside>

          {/* Mobile filter overlay */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                key="mobile-filter-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 lg:hidden"
                style={{ background: 'rgba(0,0,0,0.5)' }}
                onClick={() => setFiltersOpen(false)}
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.25 }}
                  className="absolute left-0 top-0 bottom-0 bg-white overflow-y-auto p-4"
                  style={{ width: '85%', maxWidth: '320px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg mb-0">Filtres</h3>
                    <button className="border-0 bg-transparent" onClick={() => setFiltersOpen(false)}>
                      <X size={24} />
                    </button>
                  </div>

                  <FiltersContent
                    categories={categories}
                    categorySlug={categorySlug}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    inStock={inStock}
                    onSale={onSale}
                    updateFilter={updateFilter}
                  />

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setFiltersOpen(false)}
                    className="btn-primary w-full mt-4"
                  >
                    Voir les résultats
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {(isLoading || !filtersReady) ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-10"
              >
                <p className="text-5xl mb-3">🔍</p>
                <h3 className="font-bold text-lg mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-500">Essayez de modifier vos filtres de recherche</p>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-1.5 mt-10 flex-wrap">
                    {paginationPages(page, totalPages).map((p, idx) =>
                      p === '...' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="flex items-center justify-center text-gray-400 text-sm select-none"
                          style={{ width: '40px', height: '40px' }}
                        >
                          …
                        </span>
                      ) : (
                        <motion.button
                          key={p}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPage(p as number)}
                          className={`rounded-lg text-sm font-medium border-0 transition-colors ${
                            p === page ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                          }`}
                          style={{
                            width: '40px',
                            height: '40px',
                            ...(p === page ? { backgroundColor: '#009A44' } : {}),
                          }}
                        >
                          {p}
                        </motion.button>
                      )
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function paginationPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const delta = 2;
  const pages: (number | '...')[] = [1];
  if (current - delta > 2) pages.push('...');
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    pages.push(i);
  }
  if (current + delta < total - 1) pages.push('...');
  pages.push(total);
  return pages;
}

/* Extracted filter content for reuse in desktop sidebar and mobile drawer */
function FiltersContent({
  categories,
  categorySlug,
  minPrice,
  maxPrice,
  inStock,
  onSale,
  updateFilter,
}: {
  categories: Category[];
  categorySlug?: string;
  minPrice: string;
  maxPrice: string;
  inStock: string;
  onSale: string;
  updateFilter: (key: string, value: string) => void;
}) {
  return (
    <>
      {/* Categories */}
      <div className="mb-4">
        <h4 className="font-medium mb-3 text-sm uppercase" style={{ letterSpacing: '0.05em' }}>Catégories</h4>
        <ul className="list-none p-0 flex flex-col gap-2 mb-0">
          {categories.map(cat => (
            <li key={cat._id}>
              <Link
                to={`/boutique/${cat.slug}`}
                className={`block text-sm py-1 no-underline transition-colors ${categorySlug === cat.slug ? 'font-semibold' : 'text-gray-500 hover:text-gray-800'}`}
                style={categorySlug === cat.slug ? { color: '#009A44' } : {}}
              >
                {cat.icon} {cat.name}
              </Link>
              {cat.children && cat.children.length > 0 && (
                <ul className="list-none ml-4 mt-1 flex flex-col gap-1 mb-0 p-0">
                  {cat.children.map(child => (
                    <li key={child._id}>
                      <Link to={`/boutique/${child.slug}`} className="text-sm text-gray-500 no-underline hover:text-gray-800">
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Price filter */}
      <div className="mb-4">
        <h4 className="font-medium mb-3 text-sm uppercase" style={{ letterSpacing: '0.05em' }}>Prix (FCFA)</h4>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} className="input-field text-sm py-2 w-full" />
          <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} className="input-field text-sm py-2 w-full" />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 cursor-pointer mb-0">
          <input type="checkbox" checked={inStock === 'true'} onChange={(e) => updateFilter('inStock', e.target.checked ? 'true' : '')} className="form-check-input" style={{ width: '1rem', height: '1rem' }} />
          <span className="text-sm">En stock uniquement</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer mb-0">
          <input type="checkbox" checked={onSale === 'true'} onChange={(e) => updateFilter('onSale', e.target.checked ? 'true' : '')} className="form-check-input" style={{ width: '1rem', height: '1rem' }} />
          <span className="text-sm">En promotion</span>
        </label>
      </div>
    </>
  );
}
