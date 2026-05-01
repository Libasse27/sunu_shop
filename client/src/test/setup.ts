import '@testing-library/jest-dom';
import { server } from './msw/server';

// ─── MSW lifecycle ─────────────────────────────────────────────────────────────
// Démarre le serveur MSW avant tous les tests et ferme-le proprement après.
// onUnhandledRequest: 'warn' avertit sans bloquer si une requête n'a pas de handler.
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
