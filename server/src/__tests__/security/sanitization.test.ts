import { escapeRegex, buildSearchRegex } from '../../utils/regex.utils';

describe('regex.utils', () => {
  describe('escapeRegex', () => {
    it('échappe les caractères spéciaux regex', () => {
      expect(escapeRegex('hello.world')).toBe('hello\\.world');
      expect(escapeRegex('(a+)+')).toBe('\\(a\\+\\)\\+');
      expect(escapeRegex('test$end')).toBe('test\\$end');
    });

    it('retourne la chaîne inchangée si pas de caractères spéciaux', () => {
      expect(escapeRegex('hello world')).toBe('hello world');
      expect(escapeRegex('TechAfrique123')).toBe('TechAfrique123');
    });

    it('échappe tous les métacaractères regex reconnus', () => {
      const special = '.*+?^${}()|[]\\';
      const escaped = escapeRegex(special);
      // Chaque caractère spécial doit être précédé d'un backslash
      expect(escaped).not.toContain('.*');
      expect(escaped).toMatch(/^\\\./);
    });

    it('gère une chaîne vide sans erreur', () => {
      expect(escapeRegex('')).toBe('');
    });
  });

  describe('buildSearchRegex', () => {
    it('tronque à 100 caractères maximum', () => {
      const longString = 'a'.repeat(150);
      const result = buildSearchRegex(longString);
      // "^" + 100 chars = 101 chars
      expect(result.$regex.length).toBeLessThanOrEqual(101);
    });

    it('ajoute l\'ancre ^ pour profiter des index MongoDB', () => {
      const result = buildSearchRegex('test');
      expect(result.$regex).toBe('^test');
    });

    it('échappe les patterns ReDoS dangereux', () => {
      const dangerous = '(a+)+b';
      const result = buildSearchRegex(dangerous);
      expect(result.$regex).toBe('^\\(a\\+\\)\\+b');
      expect(result.$options).toBe('i');
    });

    it('trim les espaces en début et en fin', () => {
      const result = buildSearchRegex('  hello  ');
      expect(result.$regex).toBe('^hello');
    });

    it('retourne $options "i" par défaut (insensible à la casse)', () => {
      const result = buildSearchRegex('test');
      expect(result.$options).toBe('i');
    });

    it('accepte des $options personnalisées', () => {
      const result = buildSearchRegex('test', 'm');
      expect(result.$options).toBe('m');
    });

    it('gère une chaîne vide', () => {
      const result = buildSearchRegex('');
      expect(result.$regex).toBe('^');
    });

    it('gère une chaîne de caractères unicode', () => {
      const result = buildSearchRegex('téléphone');
      expect(result.$regex).toBe('^téléphone');
    });
  });
});
