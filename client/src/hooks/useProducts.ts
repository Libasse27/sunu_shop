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
    queryFn: ({ signal }) => productApi.getProducts(filters, signal),
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
    queryFn: ({ signal }) => productApi.getProductBySlug(slug, signal),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000, // 5 min — fiche produit rarement modifiée
  });
};

/**
 * Hook pour les produits similaires d'une fiche produit.
 * Dépend de l'ID du produit affiché — désactivé tant qu'il n'est pas connu.
 */
export const useRelatedProducts = (productId: string) => {
  return useQuery({
    queryKey: ['related', productId],
    queryFn: ({ signal }) => productApi.getRelated(productId, signal),
    enabled: Boolean(productId),
    staleTime: 5 * 60 * 1000,
  });
};
