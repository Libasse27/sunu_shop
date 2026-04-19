import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/cart/cartSlice';
import wishlistReducer from '../features/wishlist/wishlistSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
});

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & { initialState?: any }
) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: options?.initialState,
  });

  const { initialState: _ignored, ...renderOptions } = options ?? {};

  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
    renderOptions
  );
}
