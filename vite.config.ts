import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const ROUTE_DEFINITIONS = [
  {
    path: 'json-formatter',
    canonicalPath: '/json-formatter',
    title: 'JSON Formatter & Validator — Best Free Online JSON Beautifier & Viewer',
    description: 'Format, beautify, validate, minify, sort, and repair JSON online. Dual-pane Monaco editor with real-time error detection, 2/4-space indentation, and 100% browser-based security.'
  },
  {
    path: 'json-diff-checker',
    canonicalPath: '/json-diff-checker',
    title: 'JSON Diff Checker — Compare JSON Online | Best Free Diff Tool',
    description: 'Compare two JSON files or strings online with Diffchecker-style side-by-side & unified views. Real-time visual comparison with additions, removals, line stats, and key-normalized sorting.'
  },
  {
    path: 'json-diff',
    canonicalPath: '/json-diff-checker',
    title: 'JSON Diff Checker — Compare JSON Online | Best Free Diff Tool',
    description: 'Compare two JSON files or strings online with Diffchecker-style side-by-side & unified views. Real-time visual comparison with additions, removals, line stats, and key-normalized sorting.'
  },
  {
    path: 'json-tree',
    canonicalPath: '/json-tree',
    title: 'JSON Tree Viewer — Interactive JSON Hierarchy Visualizer & JSONPath Query',
    description: 'Explore, traverse, and query nested JSON structures with an interactive collapsible tree viewer. Search with JSONPath expressions, type badges, and one-click path extraction.'
  },
  {
    path: 'json-converter',
    canonicalPath: '/json-converter',
    title: 'JSON Converter — Convert JSON to YAML, CSV & XML Online',
    description: 'Free online JSON converter to transform JSON to YAML, YAML to JSON, JSON to CSV spreadsheet, JSON to XML, and XML to JSON with zero server uploads.'
  }
]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const customDomain = (env.VITE_CUSTOM_DOMAIN || 'jsontools.mohammedrishad.com').trim()
  const siteUrl = (env.VITE_SITE_URL || (customDomain.startsWith('http') ? customDomain : `https://${customDomain}`)).replace(/\/+$/, '')

  return {
    plugins: [
      react(),
      {
        name: 'gh-pages-cname-and-spa-plugin',
        closeBundle() {
          const distDir = path.resolve(__dirname, 'dist')
          if (!fs.existsSync(distDir)) return

          // 1. Write CNAME from env if specified
          if (customDomain) {
            const domainHost = customDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '')
            fs.writeFileSync(path.join(distDir, 'CNAME'), `${domainHost}\n`, 'utf-8')
          }

          // 2. Read base index.html
          const indexPath = path.join(distDir, 'index.html')
          if (!fs.existsSync(indexPath)) return
          const baseHtml = fs.readFileSync(indexPath, 'utf-8')

          // 3. Write 404.html fallback for client-side deep routing
          fs.writeFileSync(path.join(distDir, '404.html'), baseHtml, 'utf-8')

          // 4. Generate static HTML files for all SEO routes with domain from .env
          for (const route of ROUTE_DEFINITIONS) {
            const routeDir = path.join(distDir, route.path)
            if (!fs.existsSync(routeDir)) {
              fs.mkdirSync(routeDir, { recursive: true })
            }

            const canonicalUrl = `${siteUrl}${route.canonicalPath}`

            let routeHtml = baseHtml
              .replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`)
              .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${route.description}" />`)
              .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
              .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${route.title}" />`)
              .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${route.description}" />`)
              .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`)

            fs.writeFileSync(path.join(routeDir, 'index.html'), routeHtml, 'utf-8')
          }
        }
      }
    ]
  }
})
