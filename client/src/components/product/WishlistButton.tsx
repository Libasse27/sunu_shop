import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { RootState, AppDispatch } from '../../store/store';
import { toggleWishlistAsync } from '../../features/wishlist/wishlistSlice';
import { Product } from '../../types/product.types';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props {
  productId: string;
  product?: Product;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

export default function WishlistButton({
  productId,
  product,
  size = 20,
  className = '',
  showLabel = false,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const items = useSelector((state: RootState) => state.wishlist.items);
  const user = useSelector((state: RootState) => state.auth.user);
  const isInWishlist = items.includes(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/connexion');
      return;
    }
    dispatch(toggleWishlistAsync({ productId, product }))
      .unwrap()
      .then(() => toast.success(isInWishlist ? 'Retiré des favoris' : 'Ajouté aux favoris'))
      .catch(() => toast.error('Erreur, veuillez réessayer'));
  };

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={handleClick}
      className={`flex items-center gap-2 transition-all border-0 bg-transparent p-0 ${className}`}
      title={isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart
        size={size}
        style={{
          color: isInWishlist ? '#ef4444' : '#adb5bd',
          fill: isInWishlist ? '#ef4444' : 'none',
        }}
      />
      {showLabel && (
        <span className="text-sm">
          {isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        </span>
      )}
    </motion.button>
  );
}
