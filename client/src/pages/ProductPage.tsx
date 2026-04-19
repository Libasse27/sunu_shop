import { useState, useEffect, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShoppingBag, Heart, Share2, Truck, Shield, RotateCcw, Minus, Plus, Star, ChevronRight } from 'lucide-react';
import { Tab } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice';
import { toggleWishlistAsync } from '../features/wishlist/wishlistSlice';
import { RootState, AppDispatch } from '../store/store';
import ProductCard from '../components/product/ProductCard';
import ProductReviews from '../components/product/ProductReviews';
import { ProductDetailSkeleton } from '../components/skeletons';
import api from '../services/api';
import { Product } from '../types/product.types';
import { formatPrice, getDiscountPercent } from '../utils/formatPrice';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { slug } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const wishlist = useSelector((state: RootState) => state.wishlist.items);
  const isWished = product ? wishlist.includes(product._id) : false;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/slug/${slug}`);
        setProduct(data.data);

        const defaults: Record<string, string> = {};
        data.data?.variants?.forEach((v: any) => {
          if (v.options?.length) defaults[v.name] = v.options[0].value;
        });
        setSelectedVariants(defaults);

        if (data.data?._id) {
          const r = await api.get(`/products/${data.data._id}/related`);
          setRelated(r.data.data || []);
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    setQuantity(1);
    setSelectedImage(0);
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return (
    <div className="container-custom py-10 text-center">
      <h2 className="font-bold text-2xl mb-3">Produit non trouvé</h2>
      <Link to="/boutique" className="btn-primary">Retour à la boutique</Link>
    </div>
  );

  const discount = getDiscountPercent(product.price, product.compareAtPrice || 0);
  const primaryImage = product.images?.[selectedImage] || product.images?.[0];

  const handleAddToCart = () => {
    const variant = Object.entries(selectedVariants).length > 0
      ? { name: Object.keys(selectedVariants).join(', '), value: Object.values(selectedVariants).join(', ') }
      : undefined;

    // Calcule le priceModifier cumulé de toutes les options sélectionnées
    const totalModifier = product.variants.reduce((acc, v) => {
      const selectedValue = selectedVariants[v.name];
      const option = v.options.find(o => o.value === selectedValue);
      return acc + (option?.priceModifier || 0);
    }, 0);

    dispatch(addToCart({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      finalPrice: product.price + totalModifier,
      compareAtPrice: product.compareAtPrice,
      image: primaryImage?.url || '',
      stock: product.stock,
      quantity,
      variant,
    }));
    toast.success('Ajouté au panier');
  };

  const tabs = [
    { label: 'Description' },
    { label: 'Caractéristiques' },
    { label: `Avis (${product.numReviews})` },
  ];

  // ─── JSON-LD Structured Data (Google Product schema) ──────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description.substring(0, 500),
    image: product.images?.[0]?.url,
    sku: product.sku,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    ...(product.rating && product.numReviews && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.numReviews,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'XOF',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'TechAfrique',
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>{product.seoTitle || `${product.name} — TechAfrique`}</title>
        <meta name="description" content={product.seoDescription || product.shortDescription || product.description.substring(0, 160)} />
        {product.seoKeywords && product.seoKeywords.length > 0 && (
          <meta name="keywords" content={product.seoKeywords.join(', ')} />
        )}
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.shortDescription || product.description.substring(0, 160)} />
        {product.images?.[0]?.url && <meta property="og:image" content={product.images[0].url} />}
        <meta property="og:type" content="product" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Pan-African breadcrumb strip */}
      <div className="border-b" style={{ background: 'linear-gradient(135deg, #003D1C 0%, #005C29 50%, #003D1C 100%)' }}>
        <div className="absolute left-0 flex flex-col" style={{ width: '5px', height: '100%' }}>
          <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
        </div>
        <div className="container-custom py-3">
          <nav className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <Link to="/" className="no-underline hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>Accueil</Link>
            <ChevronRight size={14} />
            <Link to="/boutique" className="no-underline hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>Boutique</Link>
            <ChevronRight size={14} />
            {product.category && (
              <>
                <Link to={`/boutique/${product.category.slug}`} className="no-underline hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>{product.category.name}</Link>
                <ChevronRight size={14} />
              </>
            )}
            <span className="text-white truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-custom py-4">
        {/* Breadcrumb desktop (masqué — déjà dans le header hero) */}
        <nav className="hidden items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="no-underline text-gray-500">Accueil</Link>
          <ChevronRight size={14} />
          <Link to="/boutique" className="no-underline text-gray-500">Boutique</Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={primaryImage?.url || '/placeholder.jpg'}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {product.images.map((img, idx) => (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(idx)}
                    className="border-2 rounded-lg overflow-hidden shrink-0 p-0 bg-transparent"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderColor: idx === selectedImage ? '#009A44' : 'transparent',
                    }}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {product.brand && <p className="text-sm text-gray-500 mb-1">{product.brand}</p>}
            <h1 className="font-bold text-3xl mb-2">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={18} className={star <= Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating}/5</span>
              <span className="text-sm text-gray-500">({product.numReviews} avis)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-bold text-3xl">{formatPrice(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className="text-lg text-gray-400 line-through">{formatPrice(product.compareAtPrice)}</span>
                  <span className="badge-sale text-sm">-{discount}%</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="mb-4">
              {product.stock > 0 ? (
                <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#009A44' }}>
                  En stock ({product.stock} disponibles)
                </span>
              ) : (
                <span className="text-sm font-medium text-red-500">Rupture de stock</span>
              )}
              <p className="text-sm text-gray-500 mt-1 mb-0 flex items-center gap-1">
                <Truck size={14} /> Livraison gratuite dès 25 000 FCFA
              </p>
            </div>

            {/* Variants */}
            {product.variants.map(variant => (
              <div key={variant.name} className="mb-3">
                <p className="text-sm font-medium mb-2">
                  {variant.name} : <span style={{ color: '#009A44' }}>{selectedVariants[variant.name]}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {variant.options.map(opt => (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.name]: opt.value }))}
                      className="px-3 py-2 rounded-lg text-sm border transition-all bg-transparent"
                      style={
                        selectedVariants[variant.name] === opt.value
                          ? { borderColor: '#009A44', color: '#009A44', fontWeight: 500, backgroundColor: 'rgba(0,154,68,0.1)' }
                          : { borderColor: '#e5e7eb', color: '#111827' }
                      }
                    >
                      {opt.value}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity & Actions */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="border-0 bg-transparent flex items-center justify-center"
                  style={{ width: '40px', height: '40px' }}
                >
                  <Minus size={16} />
                </button>
                <span className="text-center font-medium" style={{ width: '48px' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="border-0 bg-transparent flex items-center justify-center"
                  style={{ width: '40px', height: '40px' }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mb-10">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 btn-primary flex items-center justify-center gap-2 text-lg disabled:opacity-50"
              >
                <ShoppingBag size={20} /> Ajouter au panier
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const label = isWished ? 'Retiré des favoris' : 'Ajouté aux favoris';
                  dispatch(toggleWishlistAsync({ productId: product._id, product }))
                    .unwrap()
                    .then(() => toast.success(label))
                    .catch(() => toast.error('Erreur, veuillez réessayer'));
                }}
                className="border rounded-lg flex items-center justify-center transition-colors bg-transparent"
                style={{
                  width: '48px',
                  height: '48px',
                  borderColor: isWished ? '#ef4444' : '#e5e7eb',
                  color: isWished ? '#ef4444' : '#111827',
                  backgroundColor: isWished ? 'rgba(239,68,68,0.05)' : undefined,
                }}
              >
                <Heart size={20} fill={isWished ? 'currentColor' : 'none'} />
              </motion.button>
              <button
                className="border rounded-lg flex items-center justify-center transition-colors bg-transparent text-gray-900"
                style={{ width: '48px', height: '48px', borderColor: '#e5e7eb' }}
              >
                <Share2 size={20} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 border-t pt-4">
              {[
                { icon: Truck, text: 'Livraison rapide' },
                { icon: Shield, text: 'Paiement sécurisé' },
                { icon: RotateCcw, text: 'Retours 14 jours' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="text-center">
                  <Icon size={20} className="mx-auto mb-1" style={{ color: '#009A44' }} />
                  <span className="text-sm text-gray-500">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tabs — Headless UI */}
        <div className="mt-10">
          <Tab.Group>
            <Tab.List className="flex border-b gap-4">
              {tabs.map((tab) => (
                <Tab key={tab.label} as={Fragment}>
                  {({ selected }) => (
                    <button
                      className={`pb-3 text-sm font-medium border-b-2 bg-transparent transition-colors outline-none ${
                        selected
                          ? 'border-[#009A44] text-[#009A44]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels className="py-4">
              {/* Description */}
              <Tab.Panel>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-gray-500 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{product.description}</p>
                </motion.div>
              </Tab.Panel>

              {/* Specs */}
              <Tab.Panel>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {product.specifications && product.specifications.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border">
                      <table className="w-full text-sm">
                        <tbody>
                          {product.specifications.map((spec, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="px-4 py-3 font-medium text-gray-900 border-r" style={{ width: '12rem' }}>{spec.key}</td>
                              <td className="px-4 py-3 text-gray-500">{spec.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucune spécification disponible.</p>
                  )}
                </motion.div>
              </Tab.Panel>

              {/* Reviews */}
              <Tab.Panel>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductReviews productId={product._id} />
                </motion.div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full shrink-0" style={{ width: 4, height: 24, backgroundColor: '#009A44' }} />
              <h2 className="font-bold text-xl text-gray-900 mb-0">Produits similaires</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {related.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </>
  );
}
