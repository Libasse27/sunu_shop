import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { X, ShoppingBag, Trash2, Plus, Minus, Truck } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { RootState } from '../../store/store';
import {
  removeFromCart,
  updateQuantity,
  selectCartTotal,
  selectCartCount,
  selectCartDrawerOpen,
  closeCartDrawer,
} from '../../features/cart/cartSlice';
import { formatPrice } from '../../utils/formatPrice';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../../utils/constants';
import EmptyState from '../common/EmptyState';

export default function CartDrawer() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectCartDrawerOpen);
  const { items } = useSelector((state: RootState) => state.cart);
  const subtotal = useSelector(selectCartTotal);
  const count = useSelector(selectCartCount);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;

  const handleClose = () => dispatch(closeCartDrawer());

  const progressPercent = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen bg-white shadow-lg flex flex-col" style={{ maxWidth: '28rem' }}>
                  {/* Tricolor strip */}
                  <div className="flex shrink-0" style={{ height: '4px' }}>
                    <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
                    <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
                    <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center justify-center rounded-lg"
                        style={{ width: '2rem', height: '2rem', background: 'linear-gradient(135deg, #009A44, #007A35)' }}
                      >
                        <ShoppingBag size={16} className="text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-0">
                        Mon Panier
                        {count > 0 && (
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({count} article{count !== 1 ? 's' : ''})
                          </span>
                        )}
                      </h2>
                    </div>
                    <button
                      onClick={handleClose}
                      className="flex items-center justify-center rounded-xl border-0 bg-transparent text-gray-500 transition-colors"
                      style={{ padding: '0.375rem' }}
                      aria-label="Fermer le panier"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Items */}
                  {items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <EmptyState
                        icon={ShoppingBag}
                        title="Votre panier est vide"
                        description="Découvrez nos produits et ajoutez vos favoris."
                        actionLabel="Voir la boutique"
                        actionHref="/boutique"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto p-6">
                        <div className="flex flex-col gap-4">
                          <AnimatePresence>
                            {items.map((item) => (
                              <motion.div
                                key={`${item._id}-${item.variant?.value || ''}`}
                                layout
                                exit={{ opacity: 0, x: 50 }}
                                className="flex gap-3 rounded-xl p-4 border transition-colors"
                                style={{ backgroundColor: '#f9fafb' }}
                              >
                                <img
                                  src={item.image || '/placeholder.jpg'}
                                  alt={item.name}
                                  className="rounded-lg object-cover shrink-0 border"
                                  style={{ width: '4rem', height: '4rem' }}
                                />
                                <div className="flex-1" style={{ minWidth: 0 }}>
                                  <h4 className="text-sm font-semibold text-gray-900 truncate leading-tight mb-0">{item.name}</h4>
                                  {item.variant && (
                                    <span
                                      className="inline-block mt-1 rounded-full text-gray-500"
                                      style={{ fontSize: '11px', backgroundColor: '#e5e7eb', padding: '2px 6px' }}
                                    >
                                      {item.variant.name}: {item.variant.value}
                                    </span>
                                  )}
                                  <p className="text-sm font-bold mt-1 mb-0" style={{ color: '#009A44' }}>
                                    {formatPrice(item.price)}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    {/* Quantity controls */}
                                    <div className="flex items-center border rounded-lg overflow-hidden">
                                      <button
                                        onClick={() =>
                                          dispatch(updateQuantity({ id: item._id, variant: item.variant?.value, quantity: item.quantity - 1 }))
                                        }
                                        disabled={item.quantity <= 1}
                                        className="flex items-center justify-center border-0 bg-transparent transition-colors disabled:opacity-25"
                                        style={{ width: '1.75rem', height: '1.75rem' }}
                                      >
                                        <Minus size={13} />
                                      </button>
                                      <span className="text-center text-sm font-semibold border-l border-r" style={{ width: '2rem' }}>{item.quantity}</span>
                                      <button
                                        onClick={() =>
                                          dispatch(updateQuantity({ id: item._id, variant: item.variant?.value, quantity: item.quantity + 1 }))
                                        }
                                        disabled={item.quantity >= (item.stock || 99)}
                                        className="flex items-center justify-center border-0 bg-transparent transition-colors disabled:opacity-25"
                                        style={{ width: '1.75rem', height: '1.75rem' }}
                                      >
                                        <Plus size={13} />
                                      </button>
                                    </div>
                                    <button
                                      onClick={() =>
                                        dispatch(removeFromCart({ id: item._id, variant: item.variant?.value }))
                                      }
                                      className="flex items-center justify-center rounded-lg border-0 bg-transparent text-gray-500 transition-all"
                                      style={{ padding: '0.375rem' }}
                                      aria-label="Supprimer"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="border-t p-6 flex flex-col gap-4" style={{ backgroundColor: 'rgba(249,250,251,0.5)' }}>
                        {/* Free shipping progress */}
                        {subtotal < FREE_SHIPPING_THRESHOLD ? (
                          <div
                            className="rounded-xl p-4 flex flex-col gap-2"
                            style={{ backgroundColor: 'rgba(0,154,68,0.06)', border: '1px solid rgba(0,154,68,0.15)' }}
                          >
                            <div className="flex items-center justify-between" style={{ fontSize: '0.75rem' }}>
                              <span className="flex items-center gap-1 font-semibold" style={{ color: '#007A35' }}>
                                <Truck size={13} /> Livraison gratuite
                              </span>
                              <span className="text-gray-500">encore {formatPrice(remaining)}</span>
                            </div>
                            <div
                              className="w-full rounded-full overflow-hidden"
                              style={{ height: '6px', backgroundColor: 'white', border: '1px solid rgba(0,154,68,0.2)' }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #009A44, #00C756)' }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-2 rounded-xl p-4 text-sm font-semibold"
                            style={{ color: '#009A44', backgroundColor: 'rgba(0,154,68,0.06)' }}
                          >
                            <Truck size={14} /> Livraison gratuite offerte !
                          </div>
                        )}

                        {/* Totals */}
                        <div className="flex flex-col gap-2 text-sm">
                          <div className="flex justify-between text-gray-500">
                            <span>Sous-total</span>
                            <span className="font-medium">{formatPrice(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Livraison</span>
                            <span className="font-medium">
                              {shippingCost === 0 ? (
                                <span className="font-semibold" style={{ color: '#009A44' }}>Gratuite</span>
                              ) : (
                                formatPrice(shippingCost)
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold pt-2 border-t" style={{ fontSize: '1rem' }}>
                            <span className="text-gray-900">Total</span>
                            <span style={{ color: '#009A44' }}>{formatPrice(total)}</span>
                          </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <Link
                            to="/panier"
                            onClick={handleClose}
                            className="btn-outline text-center text-sm block"
                          >
                            Voir le panier
                          </Link>
                          <Link
                            to="/commande"
                            onClick={handleClose}
                            className="btn-primary text-center text-sm block"
                          >
                            Commander →
                          </Link>
                        </div>

                        <div className="flex items-center justify-center gap-4 text-gray-500" style={{ fontSize: '0.75rem' }}>
                          <span>🟠 Orange Money</span>
                          <span>🌊 Wave</span>
                          <span>💳 Visa</span>
                        </div>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
