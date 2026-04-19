import slugifyLib from 'slugify';

export const createSlug = (text: string): string => {
  return slugifyLib(text, { lower: true, strict: true, locale: 'fr' });
};
