import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze'
  
  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'Clip Flow - Smart Video Clipper',
          short_name: 'Clip Flow',
          description: 'AI-powered video clipping with offline support',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'any',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/icons/icon-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icons/icon-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /.*\.(mp4|webm|mov|avi|mkv)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'video-assets',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 7 * 24 * 60 * 60
                },
                rangeRequests: true
              }
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 24 * 60 * 60
                },
                networkTimeoutSeconds: 10
              }
            }
          ],
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true
        },
        devOptions: {
          enabled: false
        }
      }),
      // Bundle analyzer plugin for analyze mode
      ...(isAnalyze ? [
        {
          name: 'bundle-analyzer',
          generateBundle() {
            console.log('📊 Bundle analysis mode enabled')
          }
        }
      ] : [])
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    base: '/',
    server: {
      port: 5173,
      host: true,
      hmr: {
        overlay: true,
        port: 5173,
        clientPort: 5173,
        host: 'localhost'
      },
      watch: {
        usePolling: false,
        interval: 100
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.warn', 'console.error'],
          passes: 2,
          unsafe: true,
          unsafe_comps: true,
          unsafe_Function: true,
          unsafe_math: true,
          unsafe_proto: true,
          unsafe_regexp: true,
          dead_code: true,
          conditionals: true,
          evaluate: true,
          booleans: true,
          loops: true,
          keep_fargs: false,
          keep_fnames: false,
          hoist_funs: true,
          hoist_vars: true,
          join_vars: true,
          collapse_vars: true,
          reduce_vars: true,
          side_effects: true,
          switches: true,
          typeofs: true
        },
        mangle: {
          safari10: true,
          toplevel: true,
          properties: {
            regex: /^_/,
            reserved: []
          }
        },
        format: {
          comments: false,
          semicolons: false,
          quote_keys: false,
          keep_numbers: true
        }
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Split vendor chunks more granularly
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('@supabase')) {
              // Split Supabase into smaller chunks
              if (id.includes('auth-js')) {
                return 'supabase-auth';
              }
              if (id.includes('realtime-js')) {
                return 'supabase-realtime';
              }
              return 'supabase-core';
            }
            if (id.includes('vite-plugin-pwa')) {
              return 'pwa';
            }
            // Split large utility libraries
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            // App chunks - split by feature
            if (id.includes('src/components')) {
              if (id.includes('ColorGrader')) {
                return 'feature-color-grading';
              }
              if (id.includes('VideoEditor')) {
                return 'feature-video-editor';
              }
              if (id.includes('PWA')) {
                return 'feature-pwa';
              }
              return 'components';
            }
            if (id.includes('src/hooks')) {
              return 'hooks';
            }
            if (id.includes('src/utils')) {
              return 'utils';
            }
            // Dynamic imports will be automatically split
            return undefined;
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false
        },
        external: () => {
          // Don't bundle development-only dependencies
          return false;
        }
      },
      chunkSizeWarningLimit: 200, // Lower threshold for better chunking
      cssCodeSplit: true,
      cssMinify: true,
      assetsInlineLimit: 4096,
      treeShaking: true
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    esbuild: {
      drop: ['console', 'debugger']
    }
  }
})