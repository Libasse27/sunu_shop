import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: Props) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6 overflow-hidden scrollbar-hide">
      <Link to="/" className="shrink-0 flex items-center gap-1 transition-colors no-underline text-gray-500" style={{ color: 'inherit' }}>
        <Home size={14} /> Accueil
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0">
          <ChevronRight size={14} className="text-gray-500" style={{ opacity: 0.4 }} />
          {item.href ? (
            <Link to={item.href} className="no-underline transition-colors" style={{ color: '#009A44' }}>{item.label}</Link>
          ) : (
            <span className="text-gray-900 font-semibold truncate" style={{ maxWidth: '200px' }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
