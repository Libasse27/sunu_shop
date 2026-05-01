export type UserRole = 'client' | 'admin' | 'superadmin';

export interface IAddress {
  _id?: string;
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

/**
 * IUser — représentation sérialisée (sans password ni refreshTokenHash).
 * Correspond au shape renvoyé par l'API après sélection des champs publics.
 */
export interface IUser {
  id: string;          // alias _id sérialisé via toJSON
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  isActive?: boolean;
  addresses?: IAddress[];
  preferences?: {
    language: 'fr' | 'en';
    currency: 'XOF' | 'EUR' | 'USD';
    newsletter: boolean;
    notifications: { email: boolean; sms: boolean };
  };
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}
