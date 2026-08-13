import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /youcam-api/* requests are forwarded to the YouCam S2S server.
      // This bypasses browser CORS since the proxy runs server-side.
      '/youcam-api': {
        target:       'https://yce-api-01.makeupar.com',
        changeOrigin: true,
        secure:       true,
        rewrite:      (path) => path.replace(/^\/youcam-api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[YouCam proxy error]', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[YouCam proxy →]', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            let body = '';
            proxyRes.on('data', (chunk) => { body += chunk.toString(); });
            proxyRes.on('end', () => {
              console.log('[YouCam proxy ←]', proxyRes.statusCode, req.url);
              // Only log body for task status polls (not file uploads which are huge)
              if (req.url.includes('/task/')) {
                console.log('[YouCam response body]', body.substring(0, 500));
              }
            });
          });
        },
      },
    },
  },
})
