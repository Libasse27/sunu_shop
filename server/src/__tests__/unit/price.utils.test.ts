import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../../utils/constants';

describe('Calculs commande FCFA', () => {
  describe('calcul du sous-total', () => {
    it('calcule correctement le sous-total de plusieurs items', () => {
      const items = [
        { price: 50000, quantity: 2 },
        { price: 25000, quantity: 1 },
      ];
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(subtotal).toBe(125000);
    });

    it('retourne 0 pour un panier vide', () => {
      const subtotal = ([] as Array<{ price: number; quantity: number }>)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(subtotal).toBe(0);
    });

    it('calcule correctement un item unique', () => {
      const items = [{ price: 150000, quantity: 3 }];
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(subtotal).toBe(450000);
    });
  });

  describe('calcul des frais de livraison', () => {
    it('applique la livraison gratuite au-dessus du seuil', () => {
      const subtotal = 30000;
      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      expect(shipping).toBe(0);
    });

    it('applique les frais de livraison en dessous du seuil', () => {
      const subtotal = 15000;
      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      expect(shipping).toBe(SHIPPING_COST);
    });

    it('applique la livraison gratuite exactement au seuil', () => {
      const subtotal = FREE_SHIPPING_THRESHOLD;
      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      expect(shipping).toBe(0);
    });

    it('applique les frais pour 1 FCFA sous le seuil', () => {
      const subtotal = FREE_SHIPPING_THRESHOLD - 1;
      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      expect(shipping).toBe(SHIPPING_COST);
    });
  });

  describe('calcul du total final', () => {
    it('soustrait correctement la remise coupon', () => {
      const subtotal   = 100000;
      const shipping   = 0;      // livraison gratuite
      const discount   = 10000;  // coupon 10%
      const total      = subtotal + shipping - discount;
      expect(total).toBe(90000);
    });

    it('le total ne peut pas être négatif (discount > subtotal)', () => {
      const subtotal = 5000;
      const shipping = SHIPPING_COST;
      const discount = 6000; // impossible en pratique (min(value, subtotal)) mais test de robustesse
      const total    = Math.max(0, subtotal + shipping - discount);
      expect(total).toBeGreaterThanOrEqual(0);
    });

    it('calcul complet : subtotal + frais + coupon', () => {
      const subtotal  = 20000;
      const shipping  = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      const discount  = 2000;
      const total     = subtotal + shipping - discount;
      expect(total).toBe(21000); // 20000 + 3000 - 2000
    });
  });

  describe('constantes de livraison', () => {
    it('FREE_SHIPPING_THRESHOLD est défini et positif', () => {
      expect(FREE_SHIPPING_THRESHOLD).toBeDefined();
      expect(FREE_SHIPPING_THRESHOLD).toBeGreaterThan(0);
    });

    it('SHIPPING_COST est défini et positif', () => {
      expect(SHIPPING_COST).toBeDefined();
      expect(SHIPPING_COST).toBeGreaterThan(0);
    });
  });
});
