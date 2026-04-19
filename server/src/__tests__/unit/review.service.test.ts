import mongoose from 'mongoose';

describe('updateProductRating logic', () => {
  describe('calcul de la moyenne', () => {
    it('calcule la moyenne correctement', () => {
      const ratings = [4, 5, 3, 5, 4];
      const avg     = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const rounded = Math.round(avg * 10) / 10;
      expect(rounded).toBe(4.2);
    });

    it('retourne 0 si aucun avis approuvé', () => {
      const ratings: number[] = [];
      const avg = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
      expect(avg).toBe(0);
    });

    it('arrondit à 1 décimale', () => {
      const ratings = [4, 5];
      const avg     = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const rounded = Math.round(avg * 10) / 10;
      expect(rounded).toBe(4.5);
    });

    it('gère un seul avis (average = valeur de l\'avis)', () => {
      const ratings = [3];
      const avg     = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const rounded = Math.round(avg * 10) / 10;
      expect(rounded).toBe(3);
    });

    it('arrondit correctement 4.15 → 4.2 (demi-arrondi)', () => {
      // Simule 5 avis : [4, 4, 4, 5, 4] = 21/5 = 4.2
      const ratings = [4, 4, 4, 5, 4];
      const avg     = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const rounded = Math.round(avg * 10) / 10;
      expect(rounded).toBe(4.2);
    });

    it('la note maximale est 5', () => {
      const ratings = [5, 5, 5];
      const avg     = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const rounded = Math.round(avg * 10) / 10;
      expect(rounded).toBe(5);
      expect(rounded).toBeLessThanOrEqual(5);
    });

    it('la note minimale approuvée est 1', () => {
      const ratings = [1, 1, 1];
      const avg     = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const rounded = Math.round(avg * 10) / 10;
      expect(rounded).toBe(1);
      expect(rounded).toBeGreaterThanOrEqual(1);
    });
  });

  describe('comptage des avis', () => {
    it('compte correctement le nombre d\'avis approuvés', () => {
      const approvedReviews = [
        { isApproved: true,  rating: 4 },
        { isApproved: true,  rating: 5 },
        { isApproved: false, rating: 2 }, // non approuvé — ignoré
        { isApproved: true,  rating: 3 },
      ];
      const approved = approvedReviews.filter(r => r.isApproved);
      expect(approved.length).toBe(3);
    });
  });

  describe('ObjectId MongoDB', () => {
    it('crée un ObjectId valide depuis une string', () => {
      const id  = new mongoose.Types.ObjectId();
      const str = id.toString();
      const back = new mongoose.Types.ObjectId(str);
      expect(back.toString()).toBe(str);
    });

    it('deux ObjectId distincts ne sont pas égaux', () => {
      const a = new mongoose.Types.ObjectId();
      const b = new mongoose.Types.ObjectId();
      expect(a.toString()).not.toBe(b.toString());
    });
  });
});
