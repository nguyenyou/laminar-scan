// Extend Performance interface for Chrome's memory API
interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory
}

export interface MemoryInfo {
  usedMB: number
  totalMB: number
  limitMB: number
}

export type MemoryListener = (info: MemoryInfo) => void

const SAMPLE_INTERVAL = 1000 // 1 second

/**
 * Singleton observer for memory usage.
 * Components can subscribe to receive memory updates.
 * The observer only runs when there are active subscribers.
 */
class FdMemObserverImpl {
  private _listeners = new Set<MemoryListener>()
  private _intervalId: number | null = null
  private _lastInfo: MemoryInfo = { usedMB: 0, totalMB: 0, limitMB: 0 }

  /**
   * Check if the memory API is supported in the current browser.
   */
  static isSupported(): boolean {
    const perf = performance as ExtendedPerformance
    return !!(perf.memory && typeof perf.memory.usedJSHeapSize === 'number')
  }

  /**
   * Subscribe to memory updates.
   * Returns an unsubscribe function.
   */
  subscribe(listener: MemoryListener): () => void {
    this._listeners.add(listener)

    // Start sampling if this is the first listener
    if (this._listeners.size === 1) {
      this._startSampling()
    }

    // Immediately notify with current value
    listener(this._lastInfo)

    return () => {
      this._listeners.delete(listener)

      // Stop sampling if no more listeners
      if (this._listeners.size === 0) {
        this._stopSampling()
      }
    }
  }

  /**
   * Get the current memory info without subscribing.
   */
  getCurrentInfo(): MemoryInfo {
    return this._lastInfo
  }

  private _startSampling(): void {
    if (this._intervalId !== null) return

    // Take initial sample
    this._sampleMemory()

    this._intervalId = window.setInterval(() => {
      this._sampleMemory()
    }, SAMPLE_INTERVAL)
  }

  private _stopSampling(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }
  }

  private _sampleMemory(): void {
    const perf = performance as ExtendedPerformance
    if (!perf.memory) {
      return
    }

    const bytesToMB = (bytes: number) => Math.floor(bytes / (1024 * 1024))

    this._lastInfo = {
      usedMB: bytesToMB(perf.memory.usedJSHeapSize),
      totalMB: bytesToMB(perf.memory.totalJSHeapSize),
      limitMB: bytesToMB(perf.memory.jsHeapSizeLimit),
    }

    // Notify all listeners
    for (const listener of this._listeners) {
      listener(this._lastInfo)
    }
  }
}

// Export singleton instance
export const FdMemObserver = new FdMemObserverImpl()