import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils';
import CheckoutPage from '../../pages/CheckoutPage';
import { CartItem } from '../../types/cart.types';

// ── Mocks ────────────────────────────────────────────────────────────────────
// vi.mock() est hoisted au-dessus des imports par vitest.
// Toute variable référencée dans une factory doit elle-même être déclarée
// via vi.hoisted() pour être initialisée avant ce hoisting.

const { apiPost, toastError, toastSuccess } = vi.hoisted(() => ({
  apiPost: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-hot-toast', () => ({
  default: { error: toastError, success: toastSuccess },
  __esModule: true,
}));

vi.mock('../../services/api', () => ({
  default: {
    get:    vi.fn().mockResolvedValue({ data: { data: [] } }),
    post:   apiPost,
    delete: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request:  { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  tokenStore: { get: vi.fn(), set: vi.fn(), clear: vi.fn() },
}));

vi.mock('../../components/payment/StripePaymentForm', () => ({
  default: () => <div data-testid="stripe-form">Formulaire Stripe</div>,
}));

vi.mock('../../components/payment/WaveLogo', () => ({
  default: () => <span data-testid="wave-logo">WaveLogo</span>,
}));

vi.mock('../../components/payment/OrangeMoneyLogo', () => ({
  default: () => <span data-testid="om-logo">OrangeMoneyLogo</span>,
}));

// ── Données de test ──────────────────────────────────────────────────────────

const cartItems: CartItem[] = [
  {
    _id: 'prod-laptop-001',
    name: 'HP 15s Intel Core i5',
    slug: 'hp-15s-intel-core-i5',
    price: 450000,
    image: '/images/laptop.jpg',
    stock: 10,
    quantity: 1,
  },
  {
    _id: 'prod-phone-002',
    name: 'Samsung Galaxy A54',
    slug: 'samsung-galaxy-a54',
    price: 185000,
    image: '/images/phone.jpg',
    stock: 5,
    quantity: 2,
  },
];

const initialCartState = {
  cart: {
    items: cartItems,
    coupon: null,
    drawerOpen: false,
  },
};

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── Panier vide ──────────────────────────────────────────────────────────────
  describe('panier vide', () => {
    it('se monte sans erreur si le panier est vide (useEffect redirige)', () => {
      renderWithProviders(<CheckoutPage />, {
        initialState: { cart: { items: [], coupon: null, drawerOpen: false } },
      });
      expect(document.body).toBeTruthy();
    });
  });

  // ── Étape 1 : Adresse ────────────────────────────────────────────────────────
  describe('étape adresse (step 1)', () => {
    it('affiche le formulaire d\'adresse de livraison', () => {
      renderWithProviders(<CheckoutPage />, { initialState: initialCartState });
      expect(screen.getByText('Adresse de livraison')).toBeInTheDocument();
    });

    it('affiche les étapes de progression : Adresse et Paiement', () => {
      renderWithProviders(<CheckoutPage />, { initialState: initialCartState });
      expect(screen.getByText('Adresse')).toBeInTheDocument();
      expect(screen.getByText('Paiement')).toBeInTheDocument();
    });

    it('affiche les champs obligatoires : Nom complet, Téléphone, Adresse', () => {
      renderWithProviders(<CheckoutPage />, { initialState: initialCartState });
      expect(screen.getByPlaceholderText('Prénom Nom')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+221 77 123 45 67')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Rue, quartier, numéro')).toBeInTheDocument();
    });

    it('affiche le bouton "Continuer vers le paiement"', () => {
      renderWithProviders(<CheckoutPage />, { initialState: initialCartState });
      expect(
        screen.getByRole('button', { name: /choisir le paiement/i })
      ).toBeInTheDocument();
    });

    it('pré-remplit la ville avec "Dakar"', () => {
      renderWithProviders(<CheckoutPage />, { initialState: initialCartState });
      expect(screen.getByDisplayValue('Dakar')).toBeInTheDocument();
    });

    it('bloque la progression et appelle toast.error si champs obligatoires vides', async () => {
      renderWithProviders(<CheckoutPage />, { initialState: initialCartState });

      // Les inputs ont l'attribut required — on soumet le formulaire directement
      // pour contourner la validation HTML5 native (non déclenchée en jsdom)
      // et forcer l'exécution du handler React handleCreateOrder
      const form = document.querySelector('form') as HTMLFormElement;
      // On dispatch un submit sans remplir les champs (fullName est vide)
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await waitFor(() => {
        expect(toastError).toHaveBeenCalledWith(
          'Veuillez remplir tous les champs obligatoires'
        );
      });
    });

    it('passe à l\'étape paiement quand les champs requis sont remplis', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CheckoutPage />, { initialState: initialCartState });

      await user.type(screen.getByPlaceholderText('Prénom Nom'), 'Fatou Sow');
      await user.type(screen.getByPlaceholderText('+221 77 123 45 67'), '+221771234567');
      await user.type(screen.getByPlaceholderText('Rue, quartier, numéro'), 'Rue Félix Faure, Plateau');

      await user.click(screen.getByRole('button', { name: /choisir le paiement/i }));

      await waitFor(() => {
        expect(screen.getByText('Méthode de paiement')).toBeInTheDocument();
      });
    });
  });

  // ── Étape 2 : Paiement ───────────────────────────────────────────────────────
  describe('étape paiement (step 2)', () => {
    async function goToPaymentStep() {
      const user = userEvent.setup();
      renderWithProviders(<CheckoutPage />, { initialState: initialCartState });

      await user.type(screen.getByPlaceholderText('Prénom Nom'), 'Fatou Sow');
      await user.type(screen.getByPlaceholderText('+221 77 123 45 67'), '+221771234567');
      await user.type(screen.getByPlaceholderText('Rue, quartier, numéro'), 'Rue Félix Faure');

      await user.click(screen.getByRole('button', { name: /choisir le paiement/i }));
      await waitFor(() => screen.getByText('Méthode de paiement'));
      return user;
    }

    it('affiche les 4 radios de méthodes de paiement', async () => {
      await goToPaymentStep();
      expect(screen.getByDisplayValue('stripe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('wave')).toBeInTheDocument();
      expect(screen.getByDisplayValue('orange_money')).toBeInTheDocument();
      expect(screen.getByDisplayValue('cash_on_delivery')).toBeInTheDocument();
    });

    it('affiche les noms des méthodes de paiement', async () => {
      await goToPaymentStep();
      expect(screen.getByText('Carte bancaire')).toBeInTheDocument();
      expect(screen.getByText('Orange Money')).toBeInTheDocument();
      // "À la livraison" peut être dans un nœud séparé ou scindé
      expect(screen.getAllByText(/livraison/i).length).toBeGreaterThan(0);
      // Wave peut apparaître plusieurs fois (badge + WaveLogo mock)
      expect(screen.getAllByText(/wave/i).length).toBeGreaterThan(0);
    });

    it('wave est sélectionné par défaut', async () => {
      await goToPaymentStep();
      expect(screen.getByDisplayValue('wave')).toBeChecked();
    });

    it('permet de sélectionner Wave', async () => {
      const user = await goToPaymentStep();
      await user.click(screen.getByDisplayValue('wave'));
      expect(screen.getByDisplayValue('wave')).toBeChecked();
    });

    it('permet de sélectionner Orange Money', async () => {
      const user = await goToPaymentStep();
      await user.click(screen.getByDisplayValue('orange_money'));
      expect(screen.getByDisplayValue('orange_money')).toBeChecked();
    });

    it('permet de sélectionner Paiement à la livraison', async () => {
      const user = await goToPaymentStep();
      await user.click(screen.getByDisplayValue('cash_on_delivery'));
      expect(screen.getByDisplayValue('cash_on_delivery')).toBeChecked();
    });

    it('affiche le formulaire Stripe quand stripe est sélectionné et l\'intent chargé', async () => {
      // 1er appel : fetchIntent (wave par défaut quand step=payment)
      // 2ème appel : POST /orders (fetchStripeIntent)
      // 3ème appel : POST /payments/stripe/create-intent (fetchStripeIntent)
      apiPost
        .mockResolvedValueOnce({ data: { data: { token: 'wave-tok', amount: 450_000 } } })
        .mockResolvedValueOnce({ data: { data: { _id: 'order-abc' } } })
        .mockResolvedValueOnce({
          data: { data: { clientSecret: 'cs_test_123', paymentId: 'pay-123' } },
        });

      const user = await goToPaymentStep();
      await user.click(screen.getByDisplayValue('stripe'));

      await waitFor(() => {
        expect(screen.getByTestId('stripe-form')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('affiche "Confirmer la commande" pour le paiement à la livraison', async () => {
      const user = await goToPaymentStep();
      await user.click(screen.getByDisplayValue('cash_on_delivery'));
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /confirmer la commande/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Soumission paiement ──────────────────────────────────────────────────────
  describe('soumission paiement', () => {
    async function goToPaymentStep() {
      const user = userEvent.setup();
      renderWithProviders(<CheckoutPage />, { initialState: initialCartState });

      await user.type(screen.getByPlaceholderText('Prénom Nom'), 'Fatou Sow');
      await user.type(screen.getByPlaceholderText('+221 77 123 45 67'), '+221771234567');
      await user.type(screen.getByPlaceholderText('Rue, quartier, numéro'), 'Rue Félix Faure');

      await user.click(screen.getByRole('button', { name: /choisir le paiement/i }));
      await waitFor(() => screen.getByText('Méthode de paiement'));
      return user;
    }

    it('sélectionner stripe affiche la section de paiement Stripe', async () => {
      apiPost
        .mockResolvedValueOnce({ data: { data: { token: 'wave-tok', amount: 450_000 } } })
        .mockResolvedValueOnce({ data: { data: { _id: 'order-xyz' } } })
        .mockResolvedValueOnce({
          data: { data: { clientSecret: 'cs_test_xyz', paymentId: 'pay-xyz' } },
        });

      const user = await goToPaymentStep();
      await user.click(screen.getByDisplayValue('stripe'));

      await waitFor(() => {
        expect(screen.getByTestId('stripe-form')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('appelle POST /orders avec cash_on_delivery après acceptation des conditions', async () => {
      const user = await goToPaymentStep();

      apiPost.mockResolvedValueOnce({
        data: { data: { _id: 'order-cod-001' } },
      });

      await user.click(screen.getByDisplayValue('cash_on_delivery'));
      await waitFor(() => screen.getByRole('button', { name: /confirmer la commande/i }));

      // Cocher toutes les checkboxes non cochées (les 2 cases de confirmation COD)
      const checkboxes = screen.getAllByRole('checkbox');
      for (const cb of checkboxes) {
        if (!(cb as HTMLInputElement).checked) {
          await user.click(cb);
        }
      }

      await user.click(screen.getByRole('button', { name: /confirmer la commande/i }));

      await waitFor(() => {
        expect(apiPost).toHaveBeenCalledWith(
          '/orders',
          expect.objectContaining({ payment: { method: 'cash_on_delivery' } })
        );
      });
    });

    it('affiche un toast d\'erreur avec le message serveur si /orders échoue (COD)', async () => {
      const user = await goToPaymentStep();

      await user.click(screen.getByDisplayValue('cash_on_delivery'));
      await waitFor(() => screen.getByRole('button', { name: /confirmer la commande/i }));

      // Cocher les cases COD pour activer le bouton
      const checkboxes = screen.getAllByRole('checkbox');
      for (const cb of checkboxes) {
        if (!(cb as HTMLInputElement).checked) await user.click(cb);
      }

      apiPost.mockRejectedValueOnce({
        response: { data: { message: 'Stock insuffisant' } },
      });

      await user.click(screen.getByRole('button', { name: /confirmer la commande/i }));

      await waitFor(() => {
        expect(toastError).toHaveBeenCalledWith('Stock insuffisant');
      });
    });

    it('affiche un toast d\'erreur générique si pas de message serveur (COD)', async () => {
      const user = await goToPaymentStep();

      await user.click(screen.getByDisplayValue('cash_on_delivery'));
      await waitFor(() => screen.getByRole('button', { name: /confirmer la commande/i }));

      const checkboxes = screen.getAllByRole('checkbox');
      for (const cb of checkboxes) {
        if (!(cb as HTMLInputElement).checked) await user.click(cb);
      }

      apiPost.mockRejectedValueOnce(new Error('Network'));

      await user.click(screen.getByRole('button', { name: /confirmer la commande/i }));

      await waitFor(() => {
        expect(toastError).toHaveBeenCalled();
      });
    });
  });

  // ── Récapitulatif commande ────────────────────────────────────────────────────
  describe('récapitulatif commande', () => {
    it('affiche les noms des produits du panier', () => {
      renderWithProviders(<CheckoutPage />, { initialState: initialCartState });
      expect(screen.getByText('HP 15s Intel Core i5')).toBeInTheDocument();
      expect(screen.getByText('Samsung Galaxy A54')).toBeInTheDocument();
    });

    it('affiche "Gratuite" pour la livraison quand le sous-total dépasse 25 000 FCFA', () => {
      // subtotal = 450 000 + (185 000 × 2) = 820 000 FCFA > 25 000 → gratuite
      renderWithProviders(<CheckoutPage />, { initialState: initialCartState });
      expect(screen.getByText(/gratuite/i)).toBeInTheDocument();
    });

    it('affiche les frais de livraison si le sous-total est inférieur à 25 000 FCFA', () => {
      const cheapItem: CartItem = {
        _id: 'prod-cable-001',
        name: 'Câble USB-C 2m',
        slug: 'cable-usbc-2m',
        price: 3000,
        image: '/images/cable.jpg',
        stock: 50,
        quantity: 1,
      };
      renderWithProviders(<CheckoutPage />, {
        initialState: { cart: { items: [cheapItem], coupon: null, drawerOpen: false } },
      });
      // SHIPPING_COST = 3 000 FCFA — toLocaleString('fr-FR') produit "3 000" avec espace insécable
      // On utilise une regex flexible pour matcher le séparateur quel qu'il soit
      expect(document.body.textContent).toMatch(/3.000/);
    });

    it('affiche la remise du coupon dans le récapitulatif', () => {
      renderWithProviders(<CheckoutPage />, {
        initialState: {
          cart: {
            items: cartItems,
            coupon: { code: 'SUNU10', discount: 10000, type: 'fixed' },
            drawerOpen: false,
          },
        },
      });
      // formatPrice(10000) → "10 000 FCFA"
      expect(document.body.textContent).toMatch(/10.000/);
    });
  });
});
