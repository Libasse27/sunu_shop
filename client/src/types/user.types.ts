export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'client' | 'admin' | 'superadmin';
  isVerified: boolean;
}

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region?: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  label: 'domicile' | 'bureau' | 'autre';
}
