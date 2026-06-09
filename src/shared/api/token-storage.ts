const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const REDIRECT_AFTER_LOGIN_KEY = 'redirect_after_login'

function getStorageValue(storage: Storage | undefined, key: string) {
  return storage?.getItem(key) ?? null
}

function setStorageValue(storage: Storage | undefined, key: string, value: string) {
  storage?.setItem(key, value)
}

function removeStorageValue(storage: Storage | undefined, key: string) {
  storage?.removeItem(key)
}

function getLocalStorage() {
  return typeof window === 'undefined' ? undefined : window.localStorage
}

function getSessionStorage() {
  return typeof window === 'undefined' ? undefined : window.sessionStorage
}

export function getAccessToken() {
  return getStorageValue(getLocalStorage(), ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return getStorageValue(getLocalStorage(), REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken?: string) {
  const storage = getLocalStorage()
  setStorageValue(storage, ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) {
    setStorageValue(storage, REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearTokens() {
  const storage = getLocalStorage()
  removeStorageValue(storage, ACCESS_TOKEN_KEY)
  removeStorageValue(storage, REFRESH_TOKEN_KEY)
}

export function isSafeRedirectPath(path: string) {
  return path.startsWith('/') && path !== '/' && !path.startsWith('/login')
}

export function saveRedirectPath(path: string) {
  if (isSafeRedirectPath(path)) {
    setStorageValue(getSessionStorage(), REDIRECT_AFTER_LOGIN_KEY, path)
  }
}

export function getRedirectPath() {
  const storage = getSessionStorage()
  const path = getStorageValue(storage, REDIRECT_AFTER_LOGIN_KEY)
  if (!path) return null

  if (!isSafeRedirectPath(path)) {
    removeStorageValue(storage, REDIRECT_AFTER_LOGIN_KEY)
    return null
  }

  return path
}

export function clearRedirectPath() {
  removeStorageValue(getSessionStorage(), REDIRECT_AFTER_LOGIN_KEY)
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export function isTokenExpired(token: string) {
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp
  return typeof exp !== 'number' || exp * 1000 < Date.now()
}
