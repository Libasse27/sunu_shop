export interface CartItem {
  _id: string;
  name: string;
  slug: string;
  price: number;          // prix de base du produit
  finalPrice: number;     // prix effectif = price + priceModifier de la variante sélectionnée
  compareAtPrice?: number;
  image: string;
  stock: number;
  quantity: number;
  variant?: { name: string; value: string };
}
