import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { User, Package, MapPin, Lock, Heart, LogOut, Star, Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store/store';
import { logout } from '../features/auth/authSlice';
import api from '../services/api';
import ProfileTab       from '../components/account/ProfileTab';
import OrdersTab        from '../components/account/OrdersTab';
import AddressesTab     from '../components/account/AddressesTab';
import PasswordTab      from '../components/account/PasswordTab';
import NotificationsTab from '../components/account/NotificationsTab';
import { SN, getInitials } from '../components/account/accountConstants';

const MENU_ITEMS = [
  { path: '/mon-compte',                  label: 'Profil',         icon: User,    end: true },
  { path: '/mon-compte/commandes',        label: 'Commandes',      icon: Package },
  { path: '/mon-compte/adresses',         label: 'Adresses',       icon: MapPin },
  { path: '/mon-compte/notifications',    label: 'Notifications',  icon: Bell },
  { path: '/mon-compte/mot-de-passe',     label: 'Mot de passe',   icon: Lock },
  { path: '/favoris',                     label: 'Favoris',        icon: Heart },
];

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState({ orders: 0, addresses: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/orders/my-orders').catch(() => ({ data: { data: [] } })),
      api.get('/users/me/addresses').catch(() => ({ data: { data: [] } })),
    ]).then(([ordRes, adrRes]) => {
      setStats({
        orders:    (ordRes.data.data || []).length,
        addresses: (adrRes.data.data || []).length,
      });
    });
  }, []);

  const isActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <>
      <Helmet><title>Mon Compte — Sunu Shop</title></Helmet>
      <div className="bg-gray-50 min-h-screen">
        <div className="container-custom py-8">

          <div className="rounded-2xl overflow-hidden mb-6 relative" style={{ background: `linear-gradient(135deg, ${SN.green} 0%, ${SN.greenDark} 100%)` }}>
            <div className="absolute -top-12 -right-12 rounded-full opacity-10" style={{ width: 200, height: 200, background: 'white' }} />
            <div className="absolute -bottom-8 -left-8 rounded-full opacity-10" style={{ width: 140, height: 140, background: 'white' }} />

            <div className="relative px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 shrink-0"
                style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)' }}>
                {getInitials(user?.firstName, user?.lastName)}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white mb-0.5">{user?.firstName} {user?.lastName}</h1>
                <p className="text-sm text-white/75 mb-0 truncate">{user?.email}</p>
                {user?.role !== 'client' && (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                    <Star size={10} /> {user?.role}
                  </span>
                )}
              </div>

              <div className="flex gap-4 sm:gap-6 shrink-0">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white mb-0" style={{ fontFamily: 'DM Sans, sans-serif' }}>{stats.orders}</p>
                  <p className="text-xs text-white/70 mb-0">Commande{stats.orders !== 1 ? 's' : ''}</p>
                </div>
                <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.2)' }} />
                <div className="text-center">
                  <p className="text-2xl font-bold text-white mb-0" style={{ fontFamily: 'DM Sans, sans-serif' }}>{stats.addresses}</p>
                  <p className="text-xs text-white/70 mb-0">Adresse{stats.addresses !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            <div className="pan-strip-h" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
                <nav className="p-2">
                  {MENU_ITEMS.map(item => {
                    const active = isActive(item.path, item.end);
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} to={item.path}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm no-underline mb-0.5 transition-all"
                        style={{ background: active ? 'rgba(0,154,68,0.08)' : '', color: active ? SN.green : '#4b5563', fontWeight: active ? 600 : 400 }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: active ? 'rgba(0,154,68,0.15)' : '#f3f4f6' }}>
                          <Icon size={14} style={{ color: active ? SN.green : '#9ca3af' }} />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {active && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: SN.green }} />}
                      </Link>
                    );
                  })}
                  <div className="mx-3 my-2 border-t border-gray-100" />
                  <button onClick={() => dispatch(logout())}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-red-50 border-0 bg-transparent cursor-pointer text-left"
                    style={{ color: '#E31B23' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50">
                      <LogOut size={14} style={{ color: '#E31B23' }} />
                    </div>
                    Déconnexion
                  </button>
                </nav>
              </div>
            </div>

            <div className="lg:col-span-3">
              <Routes>
                <Route index               element={<ProfileTab />} />
                <Route path="commandes"    element={<OrdersTab />} />
                <Route path="adresses"     element={<AddressesTab />} />
                <Route path="notifications" element={<NotificationsTab />} />
                <Route path="mot-de-passe" element={<PasswordTab />} />
              </Routes>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
