import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Product } from '../../types/product.types';
import { formatPrice, getDiscountPercent } from '../../utils/formatPrice';
import { addToCart } from '../../features/cart/cartSlice';
import { toggleWishlistAsync } from '../../features/wishlist/wishlistSlice';
import { RootState, AppDispatch } from '../../store/store';
import toast from 'react-hot-toast';

interface Props {
  product: Product;
}

function getKeySpec(specs: { key: string; value: string }[], keys: string[]): string | null {
  for (const k of keys) {
    const found = specs.find(s => s.key.toLowerCase() === k.toLowerCase());
    if (found) return found.value;
  }
  return null;
}

export default function ProductCard({ product }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const wishlist = useSelector((state: RootState) => state.wishlist.items);
  const isWished = wishlist.includes(product._id);
  const discount = getDiscountPercent(product.price, product.compareAtPrice || 0);
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

  const ram = product.specifications ? getKeySpec(product.specifications, ['ram', 'RAM']) : null;
  const storage = product.specifications ? getKeySpec(product.specifications, ['stockage', 'storage', 'Stockage']) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // ProductCard n'expose pas les variantes — finalPrice = price de base
    dispatch(addToCart({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      finalPrice: product.price,
      compareAtPrice: product.compareAtPrice,
      image: primaryImage?.url || '',
      stock: product.stock,
      quantity: 1,
    }));
    toast.success('Ajouté au panier');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const label = isWished ? 'Retiré des favoris' : 'Ajouté aux favoris';
    dispatch(toggleWishlistAsync({ productId: product._id, product }))
      .unwrap()
      .then(() => toast.success(label))
      .catch(() => toast.error('Erreur, veuillez réessayer'));
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link
        to={`/produit/${product.slug}`}
        className="product-card group"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={primaryImage?.url || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute flex flex-col gap-1" style={{ top: '0.75rem', left: '0.75rem' }}>
            {discount > 0 && <span className="badge-sale">-{discount}%</span>}
            {product.isNewArrival && <span className="badge-new">NEW</span>}
          </div>

          {/* Wishlist button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleWishlist}
            className="absolute flex items-center justify-center rounded-full transition-all shadow-sm border-0 hover:scale-110"
            style={{
              top: '0.75rem',
              right: '0.75rem',
              width: '2rem',
              height: '2rem',
              backgroundColor: isWished ? '#ef4444' : 'white',
              color: isWished ? 'white' : '#6b7280',
            }}
          >
            <Heart size={14} fill={isWished ? 'currentColor' : 'none'} />
          </motion.button>

          {/* Quick actions — slide up on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 border-0 shadow transition-colors disabled:opacity-60"
                style={{ backgroundColor: product.stock === 0 ? '#9ca3af' : '#009A44' }}
              >
                <ShoppingBag size={14} />
                {product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
              </motion.button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/produit/${product.slug}`); }}
                className="flex items-center justify-center rounded-lg border-0 shadow-sm transition-colors hover:bg-white"
                style={{ width: '2.25rem', backgroundColor: 'rgba(255,255,255,0.9)', color: '#374151' }}
                title="Voir le produit"
              >
                <Eye size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-gray-500 font-medium uppercase mb-1" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
            {product.brand || product.category?.name}
          </p>
          <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2 text-gray-900">
            {product.name}
          </h3>

          {/* Tech specs badges */}
          {(ram || storage) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {ram && (
                <span className="rounded font-medium" style={{ fontSize: '10px', backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44', padding: '2px 6px' }}>
                  {ram} RAM
                </span>
              )}
              {storage && (
                <span className="rounded font-medium" style={{ fontSize: '10px', backgroundColor: '#f8fafc', color: '#475569', padding: '2px 6px' }}>
                  {storage}
                </span>
              )}
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-200'}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{ width: '0.75rem', height: '0.75rem' }}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-500" style={{ fontSize: '11px' }}>({product.numReviews})</span>
          </div>

          {/* Price + stock indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-price text-base text-gray-900">{formatPrice(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-gray-400 line-through" style={{ fontSize: '0.75rem' }}>{formatPrice(product.compareAtPrice)}</span>
              )}
            </div>
            {product.stock === 0 && (
              <span className="font-semibold text-red-500" style={{ fontSize: '10px' }}>Rupture</span>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <span className="inline-flex items-center gap-1 font-bold animate-pulse" style={{ fontSize: '10px', color: '#E31B23' }}>
                <span className="rounded-full inline-block" style={{ width: '6px', height: '6px', backgroundColor: '#E31B23' }} />
                Plus que {product.stock}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
