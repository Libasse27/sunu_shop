import { useState, ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Box, ClipboardList, Users, FolderTree,
  Ticket, Star, Wrench, Menu, ArrowUpRight, LogOut, X,
  Megaphone, Bell, Zap, Mail, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import { RootState } from '../../store/store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// ─── Config navigation ────────────────────────────────────────────────────────

const navGroups: NavGroup[] = [
  {
    label: 'GESTION',
    items: [
      { path: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
      { path: '/admin/produits', label: 'Produits', icon: Box },
      { path: '/admin/commandes', label: 'Commandes', icon: ClipboardList },
      { path: '/admin/clients', label: 'Clients', icon: Users },
      { path: '/admin/categories', label: 'Catégories', icon: FolderTree },
      { path: '/admin/coupons', label: 'Coupons', icon: Ticket },
      { path: '/admin/avis', label: 'Avis clients', icon: Star },
      { path: '/admin/services', label: 'Services', icon: Wrench },
    ],
  },
  {
    label: 'CONTENU',
    items: [
      { path: '/admin/bannieres', label: 'Hero Slider', icon: Megaphone },
      { path: '/admin/promo-banner', label: 'Bannière Promo', icon: Zap },
      { path: '/admin/annonces', label: "Barre d'annonces", icon: Bell },
    ],
  },
  {
    label: 'COMMUNICATION',
    items: [
      { path: '/admin/newsletter', label: 'Newsletter', icon: Mail },
    ],
  },
];

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 68;
const SIDEBAR_BG = '#111827'; // gray-900
const ACCENT_GREEN = '#009A44';

// ─── Tooltip simple pour mode collapsed ──────────────────────────────────────

function NavTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="admin-tooltip-wrapper">
      {children}
      <div className="admin-tooltip">{label}</div>
    </div>
  );
}

// ─── Item de navigation ───────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  collapsed,
  onClose,
}: {
  item: NavItem;
  collapsed: boolean;
  onClose?: () => void;
}) {
  const Icon = item.icon;

  const navLink = (
    <NavLink
      to={item.path}
      end={item.exact}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg my-0.5 text-sm font-medium no-underline transition-colors relative
        ${collapsed ? 'justify-center px-0 py-3 mx-1' : 'px-4 py-2.5 mx-0'}
        ${isActive
          ? 'text-white'
          : 'text-white/65 hover:text-white'
        }`
      }
      style={({ isActive }) => ({
        backgroundColor: isActive ? ACCENT_GREEN : undefined,
      })}
      onMouseEnter={(e) => {
        const target = e.currentTarget;
        const isActive = target.getAttribute('aria-current') === 'page';
        if (!isActive) target.style.backgroundColor = 'rgba(255,255,255,0.07)';
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget;
        const isActive = target.getAttribute('aria-current') === 'page';
        if (!isActive) target.style.backgroundColor = '';
      }}
    >
      <Icon size={17} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {/* Badge de notification */}
      {!collapsed && item.badge !== undefined && item.badge > 0 && (
        <span
          className="ml-auto text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#ef4444', minWidth: 18, height: 18, padding: '0 5px' }}
        >
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
      {/* Badge compact en mode collapsed */}
      {collapsed && item.badge !== undefined && item.badge > 0 && (
        <span
          className="absolute top-1.5 right-1.5 rounded-full"
          style={{ width: 7, height: 7, backgroundColor: '#ef4444' }}
        />
      )}
    </NavLink>
  );

  if (collapsed) {
    return <NavTooltip label={item.label}>{navLink}</NavTooltip>;
  }

  return navLink;
}

// ─── Contenu sidebar ──────────────────────────────────────────────────────────

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onClose,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}) {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      {/* Logo + bouton collapse */}
      <div
        className="flex items-center justify-between border-b shrink-0"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          padding: collapsed ? '12px 0' : '12px 16px',
          minHeight: 56,
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <Link to="/admin" className="flex flex-col gap-1 no-underline" onClick={onClose}>
            <div
              className="inline-flex items-center rounded-xl px-2.5 py-1.5"
              style={{ background: 'rgba(255,255,255,0.96)' }}
            >
              <img
                src="/logo.svg"
                alt="Sunu Shop"
                style={{ height: '1.85rem', width: 'auto', maxWidth: '136px', display: 'block' }}
              />
            </div>
            <p className="mb-0 px-0.5" style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.06em' }}>
              ADMINISTRATION
            </p>
          </Link>
        )}

        {collapsed && (
          <Link to="/admin" className="no-underline" onClick={onClose}>
            <div
              className="rounded-xl flex items-center justify-center shadow"
              style={{ width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.96)' }}
            >
              {/* Panier minimal — icône seule du logo */}
              <svg width="20" height="20" viewBox="8 6 50 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 31 Q16 9 28.5 9" stroke="#111" strokeWidth="2.4" strokeLinecap="round"/>
                <path d="M48 31 Q48 9 35.5 9" stroke="#111" strokeWidth="2.4" strokeLinecap="round"/>
                <circle cx="32" cy="9" r="3" fill="#009A44"/>
                <path d="M8 31 L12.5 57 Q13 61 17 61 L47 61 Q51 61 51.5 57 L56 31 Z" stroke="#111" strokeWidth="2.2" fill="white"/>
                <path d="M37 33 L27 47 L33 47 L26 59 L40 43 L34 43 Z" fill="#FDEF42" stroke="#C47A00" strokeWidth="0.7" strokeLinejoin="round"/>
                <circle cx="8" cy="31" r="3.2" fill="#009A44"/>
                <circle cx="56" cy="31" r="3.2" fill="#E31B23"/>
              </svg>
            </div>
          </Link>
        )}

        {/* Bouton toggle collapse — desktop seulement */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center rounded-lg border-0 cursor-pointer transition-colors"
            style={{
              width: 28,
              height: 28,
              backgroundColor: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.55)',
              marginLeft: collapsed ? 0 : 8,
            }}
            title={collapsed ? 'Développer' : 'Réduire'}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.07)';
            }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        {/* Bouton fermer — mobile uniquement */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 lg:hidden border-0 bg-transparent cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden" style={{ paddingLeft: collapsed ? 0 : 0 }}>
        {navGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
            {/* Label de groupe — masqué en mode collapsed */}
            {!collapsed && (
              <p
                className="px-4 mb-1 font-bold uppercase"
                style={{
                  fontSize: 9.5,
                  letterSpacing: '0.09em',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div
                className="mx-3 mb-2"
                style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }}
              />
            )}
            {group.items.map((item) => (
              <SidebarNavItem
                key={item.path}
                item={item}
                collapsed={collapsed}
                onClose={onClose}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bas de sidebar : user info + liens */}
      <div
        className="shrink-0 border-t"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          padding: collapsed ? '8px 4px' : '8px',
        }}
      >
        {/* Info utilisateur */}
        {user && !collapsed && (
          <div
            className="px-3 py-2 mb-1 rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                style={{ width: 28, height: 28, backgroundColor: ACCENT_GREEN }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium text-sm mb-0 truncate leading-none">
                  {user.firstName} {user.lastName}
                </p>
                <span
                  className="capitalize font-medium"
                  style={{ fontSize: 10, color: ACCENT_GREEN }}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Avatar seul en mode collapsed */}
        {user && collapsed && (
          <NavTooltip label={`${user.firstName} ${user.lastName}`}>
            <div className="flex justify-center mb-1">
              <div
                className="rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ width: 32, height: 32, backgroundColor: ACCENT_GREEN }}
              >
                {initials}
              </div>
            </div>
          </NavTooltip>
        )}

        {/* Voir le site */}
        {collapsed ? (
          <NavTooltip label="Voir le site">
            <Link
              to="/"
              target="_blank"
              className="flex justify-center items-center py-2 rounded-lg no-underline transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.9)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '';
                (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              <ArrowUpRight size={17} />
            </Link>
          </NavTooltip>
        ) : (
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm no-underline transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '';
              (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            <ArrowUpRight size={17} className="shrink-0" />
            Voir le site
          </Link>
        )}

        {/* Déconnexion */}
        {collapsed ? (
          <NavTooltip label="Déconnexion">
            <button
              onClick={() => dispatch(logout())}
              className="flex justify-center items-center w-full py-2 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
              style={{ color: 'rgba(239,68,68,0.75)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.75)';
              }}
            >
              <LogOut size={17} />
            </button>
          </NavTooltip>
        ) : (
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left border-0 bg-transparent cursor-pointer transition-colors mt-0.5"
            style={{ color: 'rgba(239,68,68,0.8)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.08)';
              (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.8)';
            }}
          >
            <LogOut size={17} className="shrink-0" />
            Déconnexion
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Persistance locale du mode collapsed
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const location = useLocation();

  // Titre de page par défaut depuis la navigation
  const currentTitle = title ?? (() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.exact) {
          if (location.pathname === item.path) return item.label;
        } else {
          if (location.pathname.startsWith(item.path)) return item.label;
        }
      }
    }
    return 'Administration';
  })();

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  function handleToggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('admin_sidebar_collapsed', String(next));
  }

  return (
    <>
      <div className="flex min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>

        {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 shadow-xl admin-sidebar"
          style={{ width: sidebarWidth, zIndex: 30 }}
        >
          <SidebarContent
            collapsed={collapsed}
            onToggleCollapse={handleToggleCollapse}
          />
        </aside>

        {/* ── Mobile Sidebar Drawer ────────────────────────────────────────── */}
        {sidebarOpen && (
          <div className="fixed inset-0 lg:hidden" style={{ zIndex: 50 }}>
            <div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
              onClick={() => setSidebarOpen(false)}
            />
            <aside
              className="absolute top-0 left-0 bottom-0 shadow-2xl"
              style={{ width: SIDEBAR_WIDTH }}
            >
              <SidebarContent
                collapsed={false}
                onClose={() => setSidebarOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* ── Zone principale ──────────────────────────────────────────────── */}
        <div
          className="flex-1 flex flex-col min-h-screen admin-main-content"
          style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
        >
          {/* Header sticky */}
          <header
            className="bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 shadow-sm"
            style={{ height: 56, zIndex: 20 }}
          >
            <div className="flex items-center gap-3">
              {/* Burger mobile */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg border-0 bg-gray-100 text-gray-500 cursor-pointer"
              >
                <Menu size={20} />
              </button>
              <h1 className="font-bold text-gray-900 text-base mb-0 truncate">{currentTitle}</h1>
            </div>

            {/* Actions header droite */}
            <div className="flex items-center gap-2">
              <Link
                to="/"
                target="_blank"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 no-underline transition-colors"
              >
                <ArrowUpRight size={14} />
                Voir le site
              </Link>
            </div>
          </header>

          {/* Contenu de la page */}
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>

      <style>{`
        /* Transition smooth du collapse sidebar */
        .admin-sidebar {
          transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        /* Décalage du contenu principal en fonction de la sidebar */
        @media (min-width: 1024px) {
          .admin-main-content {
            margin-left: var(--sidebar-width, ${SIDEBAR_WIDTH}px);
            transition: margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }

        /* Tooltip pour items en mode collapsed */
        .admin-tooltip-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
        }

        .admin-tooltip {
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          background-color: #1f2937;
          color: #f9fafb;
          font-size: 12px;
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .admin-tooltip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #1f2937;
        }

        .admin-tooltip-wrapper:hover .admin-tooltip {
          opacity: 1;
        }
      `}</style>
    </>
  );
}
