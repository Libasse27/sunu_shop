import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { toggleWishlistAsync } from '../features/wishlist/wishlistSlice';
import { Product } from '../types/product.types';
import toast from 'react-hot-toast';

export function useWishlist() {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: RootState) => state.wishlist.items);

  const toggle = (productId: string, product?: Product) => {
    const isInWishlist = items.includes(productId);
    dispatch(toggleWishlistAsync({ productId, product }))
      .unwrap()
      .then(() => toast.success(isInWishlist ? 'Retiré des favoris' : 'Ajouté aux favoris'))
      .catch(() => toast.error('Erreur, veuillez réessayer'));
  };

  const isWished = (productId: string) => items.includes(productId);

  return { items, count: items.length, toggle, isWished };
}
