import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 컴퓨터에게 @가 src 폴더라는 걸 알려주는 마법의 설정
export default defineConfig({
  // Relative asset paths make static deployment safer (subpath / file hosting).
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'pwa-icon.svg', 'pwa-icon-maskable.svg'],
      manifest: {
        name: '간디 링크',
        short_name: '간디 링크',
        description: '연대와 성장의 리듬을 만드는 Gandhi Link',
        theme_color: '#5B7C68',
        background_color: '#FAF7F2',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})