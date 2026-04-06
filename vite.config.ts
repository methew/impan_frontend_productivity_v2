import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

const config = defineConfig({
  plugins: [
    TanStackRouterVite(),
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    viteReact(),
  ],
  server: {
    port: 3002,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将大型库拆分为单独的 chunks
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui')) return 'radix-ui'
            if (id.includes('lucide-react')) return 'icons'
            if (id.includes('@tanstack/react-query')) return 'query'
            if (id.includes('react') || id.includes('react-dom')) return 'react'
            if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n'
            if (id.includes('recharts')) return 'charts'
            if (id.includes('date-fns')) return 'date-fns'
            return 'vendor'
          }
          // 按功能模块拆分 routes
          if (id.includes('/routes/')) {
            if (id.includes('/task')) return 'tasks'
            if (id.includes('/project')) return 'projects'
            if (id.includes('/habit')) return 'habits'
            if (id.includes('/gantt')) return 'gantt'
            if (id.includes('/focus')) return 'focus'
            if (id.includes('/time')) return 'timetrack'
            if (id.includes('/folder')) return 'folders'
            if (id.includes('/perspective')) return 'perspectives'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})

export default config
