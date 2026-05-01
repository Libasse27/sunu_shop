import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store/store';
import { syncWishlist } from './features/wishlist/wishlistSlice';
import { restoreSession } from './features/auth/authSlice';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';
import CartDrawer from './components/cart/CartDrawer';
import PWAUpdatePrompt from './components/common/PWAUpdatePrompt';
import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';

// Lazy loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentFailedPage = lazy(() => import('./pages/PaymentFailedPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const SocialAuthCallbackPage = lazy(() => import('./pages/SocialAuthCallbackPage'));
const NewsletterUnsubscribePage = lazy(() => import('./pages/NewsletterUnsubscribePage'));

// Admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'));
const AdminServicesPage = lazy(() => import('./pages/admin/AdminServicesPage'));
const AdminBannersPage = lazy(() => import('./pages/admin/AdminBannersPage'));
const AdminAnnouncementsPage = lazy(() => import('./pages/admin/AdminAnnouncementsPage'));
const AdminPromoBannerPage = lazy(() => import('./pages/admin/AdminPromoBannerPage'));
const AdminNewsletterPage = lazy(() => import('./pages/admin/AdminNewsletterPage'));
const AdminPaymentSettingsPage = lazy(() => import('./pages/admin/AdminPaymentSettingsPage'));
const AdminRevenuePage = lazy(() => import('./pages/admin/AdminRevenuePage'));

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  // Initialisé avec la valeur courante pour que le watcher ne se déclenche pas au montage
  const prevUserRef = useRef<typeof user>(user);

  // Montage : restaure le token silencieusement si l'utilisateur est déjà en localStorage.
  // dispatch est stable (Redux garantie), user est lu via ref pour un effet one-shot.
  const dispatchRef = useRef(dispatch);
  const userRef = useRef(user);
  useEffect(() => {
    if (userRef.current) {
      dispatchRef.current(restoreSession()).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          dispatchRef.current(syncWishlist());
        }
      });
    }
  }, []);

  // Connexion ultérieure (user null → non-null) : le token est déjà en mémoire
  useEffect(() => {
    if (user && prevUserRef.current === null) {
      dispatch(syncWishlist());
    }
    prevUserRef.current = user;
  }, [user, dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PWAUpdatePrompt />
      {!isAdmin && <Header />}
      <main className="flex-1">
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/boutique" element={<ShopPage />} />
            <Route path="/boutique/:category" element={<ShopPage />} />
            <Route path="/produit/:slug" element={<ProductPage />} />
            <Route path="/panier" element={<CartPage />} />
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/inscription" element={<RegisterPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/politique-de-confidentialite" element={<PrivacyPolicyPage />} />
            <Route path="/conditions-generales" element={<TermsPage />} />
            <Route path="/suivi-commande" element={<OrderTrackingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/auth/social/callback" element={<SocialAuthCallbackPage />} />
            <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribePage />} />

            {/* Payment result pages (accessible without auth for external redirects) */}
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/failed" element={<PaymentFailedPage />} />
            <Route path="/payment/orange-money/return" element={<PaymentSuccessPage />} />
            <Route path="/payment/orange-money/cancel" element={<PaymentFailedPage />} />
            <Route path="/payment/wave/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/wave/error" element={<PaymentFailedPage />} />

            {/* Checkout — accessible sans compte (auth wall intégré) */}
            <Route path="/commande" element={<CheckoutPage />} />

            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/mon-compte/*" element={<AccountPage />} />
              <Route path="/favoris" element={<WishlistPage />} />
            </Route>

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/produits" element={<AdminProductsPage />} />
              <Route path="/admin/commandes" element={<AdminOrdersPage />} />
              <Route path="/admin/clients" element={<AdminUsersPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/coupons" element={<AdminCouponsPage />} />
              <Route path="/admin/avis" element={<AdminReviewsPage />} />
              <Route path="/admin/services" element={<AdminServicesPage />} />
              <Route path="/admin/bannieres" element={<AdminBannersPage />} />
              <Route path="/admin/annonces" element={<AdminAnnouncementsPage />} />
              <Route path="/admin/promo-banner" element={<AdminPromoBannerPage />} />
              <Route path="/admin/newsletter" element={<AdminNewsletterPage />} />
              <Route path="/admin/paiements" element={<AdminPaymentSettingsPage />} />
              <Route path="/admin/chiffre-affaires" element={<AdminRevenuePage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdmin && <CartDrawer />}
      {!isAdmin && <Footer />}
    </div>
  );
}

export default App;
