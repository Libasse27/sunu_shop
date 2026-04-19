import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { productApi, ProductFilters } from '../services/product.api';

/**
 * Hook principal pour la liste de produits avec filtres.
 * keepPreviousData maintient les résultats précédents pendant la pagination
 * pour éviter les flash de contenu vide entre les pages.
 */
export const useProducts = (filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.getProducts(filters),
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook pour récupérer un produit par son slug.
 * Désactivé si le slug est absent pour éviter un appel inutile.
 */
export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productApi.getProductBySlug(slug),
    enabled: Boolean(slug),
  });
};
