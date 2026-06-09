import { defineConfig } from 'vite'

import createVitePlugins from './plugins'

export default defineConfig({
  plugins: createVitePlugins(),
  resolve: {
    tsconfigPaths: true
  }
})
