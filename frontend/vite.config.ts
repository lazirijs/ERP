// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Local dev mirrors production: the app calls the API same-origin at /api, and Vite proxies
  // that to the real API host. Keeping it same-origin makes the auth cookie first-party, so it
  // is never dropped as a third-party cookie. Set VITE_DEV_API_TARGET in .env to your API host
  // (the ngrok tunnel, or http://localhost:8787 for `bun dev:local`).
  const target = env.VITE_DEV_API_TARGET

  return {
    plugins: [
      vue(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      proxy: target
        ? {
            '/api': {
              target,
              changeOrigin: true,
              secure: false,
              rewrite: (p) => p.replace(/^\/api/, ''),
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq) => {
                  // Skip ngrok's HTML interstitial so the proxy gets JSON, not the warning page.
                  proxyReq.setHeader('ngrok-skip-browser-warning', 'true')
                })
                proxy.on('proxyRes', (proxyRes) => {
                  // The dev server is plain http, so a Secure cookie would be silently dropped.
                  // Strip Secure (and pin SameSite=Lax) so the first-party cookie is stored locally.
                  const cookies = proxyRes.headers['set-cookie']
                  if (cookies) {
                    proxyRes.headers['set-cookie'] = cookies.map((c) =>
                      c.replace(/;\s*Secure/gi, '').replace(/SameSite=None/gi, 'SameSite=Lax'),
                    )
                  }
                })
              },
            },
          }
        : undefined,
    },
  }
})
