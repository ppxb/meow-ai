import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default function createVitePlugins() {
  const vitePlugins: (PluginOption | PluginOption[])[] = [react(), tailwindcss()]

  return vitePlugins
}
