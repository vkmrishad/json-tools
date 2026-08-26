import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'gh-pages-cname-and-spa-plugin',
        closeBundle() {
          const distDir = path.resolve(__dirname, 'dist')
          if (!fs.existsSync(distDir)) return

          // 1. Write CNAME from env if specified
          const customDomain = env.VITE_CUSTOM_DOMAIN || 'jsontools.mohammedrishad.com'
          if (customDomain) {
            fs.writeFileSync(path.join(distDir, 'CNAME'), `${customDomain.trim()}\n`, 'utf-8')
          }

          // 2. Write 404.html fallback for GitHub Pages SPA routing
          const indexPath = path.join(distDir, 'index.html')
          const fallbackPath = path.join(distDir, '404.html')
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, fallbackPath)
          }
        }
      }
    ]
  }
})
