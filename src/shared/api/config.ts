const configuredApiBase = import.meta.env.VITE_API_BASE ?? ''

export const API_BASE = configuredApiBase.replace(/\/+$/, '')

export function buildApiUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath
}
