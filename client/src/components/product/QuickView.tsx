import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShoppingBag, Heart, ExternalLink, X } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion } from 'framer-motion';
import StarRating from '../common/StarRating';
import PriceDisplay from '../common/PriceDisplay';
import QuantitySelector from '../common/QuantitySelector';
import { addToCart } from '../../features/cart/cartSlice';
import { toggleWishlistAsync } from '../../features/wishlist/wishlistSlice';
import { AppDispatch } from '../../store/store';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt?: string }[];
  rating?: number;
  reviewCount?: number;
  shortDescription?: string;
  stock: number;
}

interface Props {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickView({ product, isOpen, onClose }: Props) {
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch<AppDispatch>();

  if (!product) return null;

  const handleAddToCart = () => {
    // QuickView n'expose pas les variantes — finalPrice = price de base
    dispatch(addToCart({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      finalPrice: product.price,
      image: product.images?.[0]?.url || '',
      quantity,
      stock: product.stock,
    }));
    toast.success('Ajouté au panier !');
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="relative bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 shadow-sm border-0 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Image */}
                  <div className="aspect-square rounded-xl overflow-hidden bg-green-50">
                    <img
                      src={product.images?.[0]?.url || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col">
                    <Dialog.Title as="h2" className="text-lg font-semibold text-gray-900 mb-2">
                      {product.name}
                    </Dialog.Title>

                    {product.rating !== undefined && (
                      <div className="mb-3">
                        <StarRating rating={product.rating} showValue count={product.reviewCount} size={16} />
                      </div>
                    )}

                    <PriceDisplay price={product.price} comparePrice={product.compareAtPrice} size="lg" className="mb-3" />

                    {product.shortDescription && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-3">{product.shortDescription}</p>
                    )}

                    <div className="flex items-center gap-2 mb-3 text-sm">
                      {product.stock > 0 ? (
                        <span className="text-green-600 font-semibold">En stock ({product.stock})</span>
                      ) : (
                        <span className="text-red-500 font-semibold">Rupture de stock</span>
                      )}
                    </div>

                    {product.stock > 0 && (
                      <div className="flex items-center gap-3 mb-4">
                        <QuantitySelector quantity={quantity} onChange={setQuantity} max={product.stock} />
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleAddToCart}
                          className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <ShoppingBag size={18} /> Ajouter au panier
                        </motion.button>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-auto">
                      <button
                        onClick={() => dispatch(toggleWishlistAsync({ productId: product._id }))}
                        className="btn-outline flex items-center gap-2 text-sm"
                      >
                        <Heart size={16} /> Wishlist
                      </button>
                      <Link
                        to={`/produit/${product.slug}`}
                        onClick={onClose}
                        className="btn-outline flex items-center gap-2 text-sm no-underline"
                      >
                        <ExternalLink size={16} /> Voir détails
                      </Link>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
