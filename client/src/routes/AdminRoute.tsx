import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export default function AdminRoute() {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return <Navigate to="/connexion" replace />;
  if (user.role !== 'admin' && user.role !== 'superadmin') return <Navigate to="/" replace />;

  return <Outlet />;
}
