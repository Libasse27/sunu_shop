import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { loginUser, registerUser, logout, clearError } from '../features/auth/authSlice';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    login: (email: string, password: string) => dispatch(loginUser({ email, password })),
    register: (data: { firstName: string; lastName: string; email: string; password: string; phone?: string }) => dispatch(registerUser(data)),
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
  };
}
