/**
 * Utilitaires regex — protection ReDoS
 *
 * Toujours utiliser buildSearchRegex() au lieu d'interpoler directement
 * une chaîne utilisateur dans un $regex MongoDB.
 */

/**
 * Échappe les caractères spéciaux d'une chaîne pour utilisation dans un regex.
 * Évite les injections regex (ReDoS).
 * @param str - Chaîne brute provenant de l'utilisateur
 */
export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Construit un objet de requête MongoDB $regex sécurisé à partir d'une saisie utilisateur.
 * - La chaîne est tronquée à 100 caractères maximum (anti-ReDoS)
 * - Les caractères spéciaux regex sont échappés
 * - Le ^ ancre au début pour profiter des index MongoDB
 *
 * @param search  - Valeur brute de la recherche (input utilisateur)
 * @param options - Options regex MongoDB (défaut: 'i' pour insensible à la casse)
 */
export const buildSearchRegex = (
  search: string,
  options = 'i',
): { $regex: string; $options: string } => ({
  $regex: `^${escapeRegex(search.trim().substring(0, 100))}`,
  $options: options,
});
