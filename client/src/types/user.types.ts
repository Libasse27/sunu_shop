// Source de vérité : shared/types/user.types.ts
// Ce fichier ré-exporte pour que les imports client restent stables.
export type { IUser, IAddress, UserRole } from '@shared/types/user.types';

// Alias locaux pour compatibilité avec le code existant
export type { IUser as User } from '@shared/types/user.types';
export type { IAddress as Address } from '@shared/types/user.types';
