import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'favicon.ico'],
      manifest: {
        name: 'Sunu Shop',
        short_name: 'Sunu Shop',
        description: 'Boutique tech en ligne — Sénégal, Mali, Guinée',
        theme_color: '#009A44',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        lang: 'fr',
        start_url: '/',
        icons: [
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        categories: ['shopping', 'business'],
      },
      workbox: {
        // Stratégie réseau d'abord pour les appels API (données toujours fraîches)
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              networkTimeoutSeconds: 10,
            },
          },
          // Cache statique des images Cloudinary (cache-first, longue durée)
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
              },
            },
          },
          // Cache polices Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
              },
            },
          },
        ],
        // Précacher les assets statiques générés par Vite
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Limiter la taille des fichiers précachés
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
      },
      devOptions: {
        enabled: false, // Désactivé en dev pour éviter les conflits avec le proxy Vite
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Admin pages — only loaded when user navigates to /admin
          'admin-ui': ['recharts'],
          // Heavy animation library
          'motion': ['framer-motion'],
          // React ecosystem core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // State management
          'store': ['@reduxjs/toolkit', 'react-redux'],
          // Data fetching
          'query': ['@tanstack/react-query'],
          // Stripe (only loaded on checkout)
          'stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
