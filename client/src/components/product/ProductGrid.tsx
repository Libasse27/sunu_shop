import ProductCard from './ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { PackageSearch } from 'lucide-react';
import { Product } from '../../types/product.types';

interface Props {
  products: Product[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  emptyMessage?: string;
}

export default function ProductGrid({ products, isLoading, columns = 4, emptyMessage = 'Aucun produit trouvé' }: Props) {
  if (isLoading) return <LoadingSpinner />;

  if (!products.length) {
    return (
      <EmptyState
        icon={PackageSearch}
        title={emptyMessage}
        description="Essayez de modifier vos filtres ou explorez nos catégories."
        actionLabel="Voir la boutique"
        actionHref="/boutique"
      />
    );
  }

  const gridColsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridColsClass[columns]} gap-3 md:gap-4`}>
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
