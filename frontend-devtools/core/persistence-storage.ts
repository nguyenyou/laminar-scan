export const StorageKeys = {
  DEVTOOLS_ENABLED: 'FRONTEND_DEVTOOLS_ENABLED',
  ACTIVE_WIDGETS: 'FRONTEND_DEVTOOLS_ACTIVE_WIDGETS',
  MUTATION_SCAN_ACTIVE: 'FRONTEND_DEVTOOLS_MUTATION_SCAN_ACTIVE',
  PANEL_POSITION: 'FRONTEND_DEVTOOLS_PANEL_POSITION',
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

  getArray<T>(key: StorageKey): T[] {
    const value = this.get(key)
    if (!value) return []
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }

  setArray<T>(key: StorageKey, value: T[]): void {
    this.set(key, JSON.stringify(value))
  }
}

export const persistenceStorage = new PersistenceStorage()