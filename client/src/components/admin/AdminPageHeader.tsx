import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: BreadcrumbItem[];
}

export default function AdminPageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: AdminPageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 mb-6 -mx-4 -mt-4 lg:-mx-6 lg:-mt-6 overflow-hidden">
      {/* Bandeau tricolore sénégalais */}
      <div className="flex" style={{ height: '3px' }}>
        <div className="flex-1" style={{ backgroundColor: '#009A44' }} />
        <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
        <div className="flex-1" style={{ backgroundColor: '#E31B23' }} />
      </div>
    <div className="px-6 py-4">
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 mb-2" aria-label="Fil d'Ariane">
          {breadcrumb.map((crumb, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight size={13} className="text-gray-400 shrink-0" />
                )}
                {crumb.href && !isLast ? (
                  <Link
                    to={crumb.href}
                    className="text-xs text-gray-400 hover:text-gray-600 no-underline transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={`text-xs ${isLast ? 'text-gray-600 font-medium' : 'text-gray-400'}`}
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      {/* Titre + actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 mb-0 truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5 mb-0">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
