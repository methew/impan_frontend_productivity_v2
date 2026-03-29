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
})

export default config
