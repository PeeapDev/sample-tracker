import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pre-bundle the big deps once on startup so the first page render isn't
  // blocked transforming them on demand.
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'recharts', 'gsap', 'lucide-react'],
  },
  server: {
    // Warm up the route modules in the background right after the dev server
    // boots, so navigating to a page during the demo feels instant.
    warmup: {
      clientFiles: [
        './src/pages/Dashboard.tsx',
        './src/pages/Samples.tsx',
        './src/pages/Dispatches.tsx',
        './src/pages/Users.tsx',
      ],
    },
  },
  build: {
    // Split heavy vendor libs into their own cacheable chunks for prod builds.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('gsap')) return 'motion'
          if (id.includes('react')) return 'react'
        },
      },
    },
  },
})
