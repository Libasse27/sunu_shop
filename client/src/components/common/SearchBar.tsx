import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp, Loader2 } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';

interface SearchResult {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images: { url: string }[];
  category?: { name: string };
}

const POPULAR_SEARCHES = [
  'Laptop ASUS',
  'Samsung Galaxy',
  'JBL',
  'iPhone',
  'Écran PC',
  'Clavier gaming',
];

interface SearchBarProps {
  /** Classe CSS additionnelle sur le wrapper */
  className?: string;
  /** Appelé après navigation (pour fermer un menu mobile par ex.) */
  onNavigate?: () => void;
  placeholder?: string;
}

export default function SearchBar({
  className = '',
  onNavigate,
  placeholder = 'Rechercher laptops, smartphones, TV, accessoires...',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  /* ── Fermer si clic en dehors ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Appel API lors de la frappe ── */
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const doSearch = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/products', {
          params: { search: debouncedQuery, limit: 6 },
        });
        if (!cancelled) setResults(data.data?.products || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    doSearch();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const goTo = useCallback(
    (path: string) => {
      navigate(path);
      setQuery('');
      setResults([]);
      setIsOpen(false);
      onNavigate?.();
    },
    [navigate, onNavigate]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      goTo(`/boutique?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && (query.length >= 2 || query.length === 0);
  const showResults = query.length >= 2;

  return (
    <div ref={wrapperRef} className={`relative flex-1 ${className}`} style={{ maxWidth: '42rem', margin: '0 auto' }}>
      {/* ── Barre de recherche ── */}
      <form onSubmit={handleSubmit}>
        <div
          className="flex w-full overflow-hidden transition-shadow"
          style={{
            borderRadius: '50rem',
            border: '2px solid #009A44',
            boxShadow: isOpen ? '0 0 0 3px rgba(0,133,63,0.15)' : '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              autoComplete="off"
              className="flex-1 px-4 py-2 text-sm border-0 bg-white text-gray-900"
              style={{ outline: 'none', borderRadius: '50rem 0 0 50rem' }}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 p-1 border-0 bg-transparent text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 shrink-0 font-semibold text-sm border-0 transition-colors"
            style={{ background: 'linear-gradient(135deg, #009A44, #007A35)', color: '#fff', borderRadius: '0 50rem 50rem 0' }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            <span className="hidden md:block">Rechercher</span>
          </button>
        </div>
      </form>

      {/* ── Dropdown de résultats ── */}
      {showDropdown && (
        <div
          className="absolute left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
          style={{ top: 'calc(100% + 8px)' }}
        >
          {/* Recherches populaires si champ vide */}
          {!showResults && (
            <div className="p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                <TrendingUp size={13} /> Recherches populaires
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setQuery(s); setIsOpen(true); inputRef.current?.focus(); }}
                    className="rounded-full px-3 py-1 text-sm font-medium border-0 transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'rgba(0,133,63,0.08)', color: '#005a2b' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chargement */}
          {showResults && isLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Recherche en cours…
            </div>
          )}

          {/* Résultats */}
          {showResults && !isLoading && results.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Produits
                </p>
              </div>
              <ul className="divide-y divide-gray-50">
                {results.map((product) => (
                  <li key={product._id}>
                    <button
                      type="button"
                      onClick={() => goTo(`/produit/${product.slug}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left border-0 bg-transparent transition-colors hover:bg-gray-50"
                    >
                      <img
                        src={product.images?.[0]?.url || '/placeholder.jpg'}
                        alt={product.name}
                        className="rounded-xl object-cover shrink-0"
                        style={{ width: '44px', height: '44px' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.jpg'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate mb-0">{product.name}</p>
                        {product.category?.name && (
                          <p className="text-xs text-gray-400 mb-0">{product.category.name}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold shrink-0" style={{ color: '#009A44' }}>
                        {formatPrice(product.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {/* Voir tous */}
              <button
                type="button"
                onClick={handleSubmit as unknown as React.MouseEventHandler}
                className="w-full px-4 py-3 text-sm font-semibold border-0 border-t border-gray-100 bg-gray-50 transition-colors hover:bg-gray-100 text-left"
                style={{ color: '#009A44' }}
              >
                Voir tous les résultats pour &laquo;&nbsp;{query}&nbsp;&raquo; →
              </button>
            </>
          )}

          {/* Aucun résultat */}
          {showResults && !isLoading && results.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-500">
              <Search size={28} className="mx-auto mb-2 opacity-30" />
              Aucun résultat pour &laquo;&nbsp;{debouncedQuery}&nbsp;&raquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
