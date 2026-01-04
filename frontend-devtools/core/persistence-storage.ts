export const StorageKeys = {
  DEVTOOLS_ENABLED: 'FRONTEND_DEVTOOLS_ENABLED',
} as const

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys]

class PersistenceStorage {
  get(key: StorageKey): string | null {
    return localStorage.getItem(key)
  }

  set(key: StorageKey, value: string): void {
    localStorage.setItem(key, value)
  }

  remove(key: StorageKey): void {
    localStorage.removeItem(key)
  }

  getBoolean(key: StorageKey): boolean {
    return this.get(key) === 'true'
  }

  setBoolean(key: StorageKey, value: boolean): void {
    this.set(key, String(value))
  }
}

export const persistenceStorage = new PersistenceStorage()

