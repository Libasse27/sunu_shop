import { useState, useEffect, Fragment } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StarRating from '../common/StarRating';
import api from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';

interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: string;
  children?: Category[];
}

export interface FilterState {
  category: string;
  minPrice: string;
  maxPrice: string;
  rating: string;
  inStock: boolean;
  onSale: boolean;
  sort: string;
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export const defaultFilters: FilterState = {
  category: '',
  minPrice: '',
  maxPrice: '',
  rating: '',
  inStock: false,
  onSale: false,
  sort: '-createdAt',
};

export default function ProductFilter({ filters, onChange, onReset, isMobile, onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get('/categories/tree').then(({ data }) => setCategories(data.data || [])).catch(() => {});
  }, []);

  const update = (key: keyof FilterState, value: any) => onChange({ ...filters, [key]: value });

  const activeCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.rating,
    filters.inStock,
    filters.onSale,
  ].filter(Boolean).length;

  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} style={{ color: '#009A44' }} />
          <span className="font-semibold text-gray-900">Filtres</span>
          {activeCount > 0 && (
            <span
              className="flex items-center justify-center rounded-full text-white"
              style={{ width: 20, height: 20, fontSize: 11, background: '#009A44' }}
            >
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-sm border-0 bg-transparent p-0" style={{ color: '#009A44' }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* Categories */}
      <Disclosure defaultOpen as="div" className="border-b pb-3 mb-3">
        {({ open }) => (
          <>
            <Disclosure.Button className="flex items-center justify-between w-full text-left border-0 bg-transparent p-0 mb-2">
              <span className="font-semibold text-sm text-gray-900">Catégories</span>
              <ChevronDown
                size={16}
                className="text-gray-400 transition-transform duration-200"
                style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </Disclosure.Button>
            <Transition
              as={Fragment}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-y-95 opacity-0"
              enterTo="transform scale-y-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-y-100 opacity-100"
              leaveTo="transform scale-y-95 opacity-0"
            >
              <Disclosure.Panel>
                <div className="flex flex-col gap-1" style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {categories.map((cat) => (
                    <div key={cat._id}>
                      <button
                        onClick={() => update('category', filters.category === cat.slug ? '' : cat.slug)}
                        className="w-full text-left text-sm py-1 px-2 rounded border-0"
                        style={{
                          background: filters.category === cat.slug ? 'rgba(0,154,68,0.1)' : 'transparent',
                          color: filters.category === cat.slug ? '#009A44' : '#555',
                          fontWeight: filters.category === cat.slug ? 600 : 400,
                        }}
                      >
                        {cat.name}
                      </button>
                      {cat.children?.map((sub) => (
                        <button
                          key={sub._id}
                          onClick={() => update('category', filters.category === sub.slug ? '' : sub.slug)}
                          className="w-full text-left text-sm py-1 rounded border-0"
                          style={{
                            paddingLeft: 24,
                            paddingRight: 8,
                            background: filters.category === sub.slug ? 'rgba(0,154,68,0.1)' : 'transparent',
                            color: filters.category === sub.slug ? '#009A44' : '#666',
                            fontWeight: filters.category === sub.slug ? 600 : 400,
                          }}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>

      {/* Price */}
      <Disclosure defaultOpen as="div" className="border-b pb-3 mb-3">
        {({ open }) => (
          <>
            <Disclosure.Button className="flex items-center justify-between w-full text-left border-0 bg-transparent p-0 mb-2">
              <span className="font-semibold text-sm text-gray-900">Prix</span>
              <ChevronDown
                size={16}
                className="text-gray-400 transition-transform duration-200"
                style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </Disclosure.Button>
            <Transition
              as={Fragment}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-y-95 opacity-0"
              enterTo="transform scale-y-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-y-100 opacity-100"
              leaveTo="transform scale-y-95 opacity-0"
            >
              <Disclosure.Panel>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => update('minPrice', e.target.value)}
                    placeholder="Min"
                    className="input-field text-sm py-2"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => update('maxPrice', e.target.value)}
                    placeholder="Max"
                    className="input-field text-sm py-2"
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[
                    { label: `< ${formatPrice(10000)}`, min: '', max: '10000' },
                    { label: `${formatPrice(10000)} - ${formatPrice(25000)}`, min: '10000', max: '25000' },
                    { label: `> ${formatPrice(25000)}`, min: '25000', max: '' },
                  ].map((range) => (
                    <button
                      key={range.label}
                      onClick={() => onChange({ ...filters, minPrice: range.min, maxPrice: range.max })}
                      className="rounded-full border px-2 py-1"
                      style={{
                        fontSize: 11,
                        background: filters.minPrice === range.min && filters.maxPrice === range.max ? 'rgba(0,154,68,0.1)' : 'transparent',
                        borderColor: filters.minPrice === range.min && filters.maxPrice === range.max ? '#009A44' : '#dee2e6',
                        color: filters.minPrice === range.min && filters.maxPrice === range.max ? '#009A44' : '#666',
                      }}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>

      {/* Rating */}
      <Disclosure as="div" className="border-b pb-3 mb-3">
        {({ open }) => (
          <>
            <Disclosure.Button className="flex items-center justify-between w-full text-left border-0 bg-transparent p-0 mb-2">
              <span className="font-semibold text-sm text-gray-900">Note minimum</span>
              <ChevronDown
                size={16}
                className="text-gray-400 transition-transform duration-200"
                style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </Disclosure.Button>
            <Transition
              as={Fragment}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-y-95 opacity-0"
              enterTo="transform scale-y-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-y-100 opacity-100"
              leaveTo="transform scale-y-95 opacity-0"
            >
              <Disclosure.Panel>
                <div className="flex flex-col gap-2">
                  {[4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => update('rating', filters.rating === String(r) ? '' : String(r))}
                      className="flex items-center gap-2 w-full py-1 px-2 rounded border-0"
                      style={{
                        background: filters.rating === String(r) ? 'rgba(0,154,68,0.1)' : 'transparent',
                      }}
                    >
                      <StarRating rating={r} size={14} />
                      <span className="text-sm text-gray-500">& plus</span>
                    </button>
                  ))}
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>

      {/* Options */}
      <Disclosure as="div" className="border-b pb-3 mb-3">
        {({ open }) => (
          <>
            <Disclosure.Button className="flex items-center justify-between w-full text-left border-0 bg-transparent p-0 mb-2">
              <span className="font-semibold text-sm text-gray-900">Options</span>
              <ChevronDown
                size={16}
                className="text-gray-400 transition-transform duration-200"
                style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </Disclosure.Button>
            <Transition
              as={Fragment}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-y-95 opacity-0"
              enterTo="transform scale-y-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-y-100 opacity-100"
              leaveTo="transform scale-y-95 opacity-0"
            >
              <Disclosure.Panel>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => update('inStock', e.target.checked)}
                    className="form-check-input"
                  />
                  <span className="text-sm text-gray-500">En stock uniquement</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onSale}
                    onChange={(e) => update('onSale', e.target.checked)}
                    className="form-check-input"
                  />
                  <span className="text-sm text-gray-500">En promotion</span>
                </label>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>

      {isMobile && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="btn-primary w-full mt-3"
        >
          Appliquer les filtres
        </motion.button>
      )}
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="ml-auto bg-white h-full overflow-auto p-4"
            style={{ width: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-lg">Filtres</span>
              <button onClick={onClose} className="border-0 bg-transparent p-0"><X size={20} /></button>
            </div>
            {content}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return <div>{content}</div>;
}
