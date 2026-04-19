import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Trash2, Minus, Plus, ShoppingCart, ArrowLeft, Shield, Truck, Tag } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { removeFromCart, updateQuantity, selectCartTotal } from '../features/cart/cartSlice';
import { formatPrice } from '../utils/formatPrice';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../utils/constants';
import CouponInput from '../components/cart/CouponInput';

export default function CartPage() {
  const dispatch = useDispatch();
  const { items, coupon } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);
  const subtotal = useSelector(selectCartTotal);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const discount = coupon?.discount || 0;
  const total = subtotal + shippingCost - discount;
  const freeShippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  if (items.length === 0) {
    return (
      <>
        <Helmet><title>Panier — Sunu Shop</title></Helmet>
        <div className="container-custom py-12 text-center">
          <div
            className="rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ width: 96, height: 96, background: 'linear-gradient(135deg, #009A44, #007A35)' }}
          >
            <ShoppingCart size={40} className="text-white" />
          </div>
          <h2 className="font-bold text-2xl mb-3 text-gray-900">Votre panier est vide</h2>
          <p className="text-gray-500 mb-6">Découvrez notre collection et ajoutez vos articles favoris</p>
          <Link to="/boutique" className="btn-primary">Découvrir la boutique</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Panier ({items.length}) — Sunu Shop</title></Helmet>

      {/* Pan-African strip */}
      <div className="flex" style={{ height: 4 }}>
        <div className="flex-1" style={{ background: '#009A44' }} />
        <div className="flex-1" style={{ background: '#FCD116' }} />
        <div className="flex-1" style={{ background: '#E31B23' }} />
      </div>

      <div className="container-custom py-6">
        <h1 className="font-bold text-3xl mb-1 text-gray-900">Mon Panier</h1>
        <p className="text-gray-500 text-sm mb-6">{items.length} article{items.length > 1 ? 's' : ''}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Cart Items ── */}
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={`${item._id}-${item.variant?.value}`}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3"
                >
                  <Link
                    to={`/produit/${item.slug}`}
                    className="shrink-0 rounded-lg overflow-hidden border border-gray-100 block"
                    style={{ width: 80, height: 80, background: '#f9fafb' }}
                  >
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <Link
                      to={`/produit/${item.slug}`}
                      className="font-semibold text-sm text-gray-900 line-clamp-2 no-underline hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                    {item.variant && (
                      <span className="inline-block bg-gray-50 text-gray-500 rounded-full text-xs mt-1 px-2 py-0.5">
                        {item.variant.name}: {item.variant.value}
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      {/* Quantity */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => dispatch(updateQuantity({ id: item._id, variant: item.variant?.value, quantity: item.quantity - 1 }))}
                          className="flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                          style={{ width: 32, height: 32 }}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-center text-sm font-semibold border-l border-r border-gray-200" style={{ width: 36, lineHeight: '32px' }}>{item.quantity}</span>
                        <button
                          onClick={() => dispatch(updateQuantity({ id: item._id, variant: item.variant?.value, quantity: item.quantity + 1 }))}
                          className="flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                          style={{ width: 32, height: 32 }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch(removeFromCart({ id: item._id, variant: item.variant?.value }))}
                    className="text-gray-400 hover:text-red-500 self-start p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}

              <Link to="/boutique" className="inline-flex items-center gap-2 text-sm text-primary mt-2 no-underline hover:underline">
                <ArrowLeft size={15} /> Continuer mes achats
              </Link>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 mt-1">
                {[
                  { icon: Shield,  text: 'Paiement sécurisé',   color: '#009A44' },
                  { icon: Truck,   text: 'Livraison rapide',     color: '#FCD116' },
                  { icon: Tag,     text: 'Prix garantis',        color: '#E31B23' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 border border-gray-100 text-center">
                    <Icon size={18} style={{ color }} />
                    <span className="text-gray-500 font-medium" style={{ fontSize: '11px' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Summary ── */}
          <div>
            <div className="sticky top-28">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Strip */}
                <div className="flex" style={{ height: 4 }}>
                  <div className="flex-1" style={{ background: '#009A44' }} />
                  <div className="flex-1" style={{ background: '#FCD116' }} />
                  <div className="flex-1" style={{ background: '#E31B23' }} />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-6 text-gray-900">Récapitulatif</h3>

                  {/* Free shipping progress */}
                  {subtotal < FREE_SHIPPING_THRESHOLD && (
                    <div className="mb-6 p-4 rounded-lg border" style={{ background: 'rgba(0,154,68,0.08)', borderColor: 'rgba(0,154,68,0.2)' }}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold" style={{ color: '#007A35' }}>🚚 Livraison gratuite</span>
                        <span className="text-gray-500">{formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} restant</span>
                      </div>
                      <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: '#e5e7eb' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${freeShippingProgress}%`, background: 'linear-gradient(90deg, #009A44, #00C756)' }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Sous-total</span><span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Livraison</span>
                      <span className="font-medium">
                        {shippingCost === 0
                          ? <span className="font-semibold" style={{ color: '#009A44' }}>Gratuite 🎉</span>
                          : formatPrice(shippingCost)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between font-medium" style={{ color: '#009A44' }}>
                        <span>Réduction {coupon?.code && <span className="rounded px-1 py-0.5 text-xs" style={{ background: 'rgba(0,154,68,0.1)', color: '#009A44' }}>{coupon.code}</span>}</span>
                        <span>−{formatPrice(discount)}</span>
                      </div>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-600">
                      <Tag size={14} style={{ color: '#FCD116' }} /> Code promo
                    </p>
                    {user ? (
                      <CouponInput />
                    ) : (
                      <p className="text-sm text-gray-500">
                        <Link to="/connexion" className="text-primary">Connectez-vous</Link> pour utiliser un code promo
                      </p>
                    )}
                  </div>

                  <Link to="/commande" className="btn-primary w-full mt-6 block text-center">
                    Passer la commande →
                  </Link>

                  <div className="flex items-center justify-center gap-3 mt-4 text-sm text-gray-500">
                    <span>🟠 Orange Money</span>
                    <span>🌊 Wave</span>
                    <span>💳 Visa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
