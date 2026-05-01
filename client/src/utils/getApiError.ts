/**
 * Extrait le message d'erreur d'une réponse Axios.
 * Remplace le boilerplate `(err as any)?.response?.data?.message` répété partout.
 */
export function getApiError(err: unknown, fallback = 'Une erreur est survenue'): string {
  if (err instanceof Error) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message ?? err.message ?? fallback;
  }
  const raw = err as { response?: { data?: { message?: string } }; message?: string };
  return raw?.response?.data?.message ?? raw?.message ?? fallback;
}
