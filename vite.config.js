import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { fileURLToPath } from 'url'
import tailwindcss from "@tailwindcss/vite"
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    wasm(),
    topLevelAwait(),
    nodePolyfills({
      // Include all necessary polyfills
      include: ['buffer', 'process', 'util', 'stream', 'events', 'crypto', 'path', 'os'],
      // Don't exclude anything
      exclude: [],
      // Enable protocol imports
      protocolImports: true,
      // Override specific modules
      overrides: {
        // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
        fs: 'memfs',
      },
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'util', 'stream', 'events'],
    exclude: ['tiny-secp256k1'],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  worker: {
    format: 'es'
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'crypto-libs': ['bitcoinjs-lib', 'bip32', 'ecpair']
        }
      }
    }
  },
  assetsInclude: ['**/*.wasm'],
  server: {
    fs: {
      allow: ['..']
    }
  }
})