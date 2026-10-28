import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// GitHub Pages serves this site from /say-it/, so every link needs that prefix.
const base = '/say-it/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Say it',
        short_name: 'Say it',
        description: 'Listen for what they need, pick how you want them to feel, then get kind, honest words to use.',
        theme_color: '#f8f4ee',
        background_color: '#f8f4ee',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'My lines', short_name: 'My lines', description: 'Lines you starred', url: base + '?view=favourites', icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Prep card', short_name: 'Prep', description: 'Three lines and a tip before you go in', url: base + '?view=prep', icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }] },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,json,woff2,webmanifest}'], navigateFallback: base + 'index.html' },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
