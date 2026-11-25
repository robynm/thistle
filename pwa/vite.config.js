import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Production is served from GitHub Pages at /thistle/; the dev server (and so the
// Cypress suite) runs at the root. Manifest URLs are relative so they work under both.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/thistle/" : "/",
  build: { outDir: "dist", emptyOutDir: true },
  server: { port: 5173, strictPort: true },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png", "icons/*.svg"],
      manifest: {
        name: "Thistle",
        short_name: "Thistle",
        description: "Interval timers for work, rest and reps.",
        id: "./", start_url: "./", scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#FFFFFF",
        theme_color: "#FFFFFF",
        lang: "en",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff,woff2}"],
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "google-fonts",
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        }],
      },
    }),
  ],
}));
