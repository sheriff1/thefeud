import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// Build-time values for error monitoring (#27). Vercel exposes these as system env vars.
const release = process.env.VERCEL_GIT_COMMIT_SHA || '';
const appEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || 'production';

// Source maps are uploaded only when all three are set (SENTRY_AUTH_TOKEN stays in the build
// environment, e.g. Vercel project settings; it is never read from or written to the repo).
const uploadSourceMaps = !!(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT
);

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_RELEASE': JSON.stringify(release),
    'import.meta.env.VITE_APP_ENV': JSON.stringify(appEnv),
  },
  // 'hidden' emits .map files without a sourceMappingURL comment; the plugin uploads and then
  // deletes them, so they are never served publicly.
  build: { sourcemap: uploadSourceMaps ? 'hidden' : false },
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    ...(uploadSourceMaps
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: release || undefined },
            sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
            telemetry: false,
            silent: true,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true, // Allow external access
    allowedHosts: [
      '9c57-2600-4040-225a-9800-f1cb-d38d-7816-e06f.ngrok-free.app', // Add the ngrok domain
    ],
    headers: {
      'Cache-Control': 'no-store', // Disable caching
    },
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
