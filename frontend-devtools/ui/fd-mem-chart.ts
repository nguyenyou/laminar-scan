import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

// Extend Performance interface for Chrome's memory API
interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory
}

const MAX_POINTS = 60
const SAMPLE_INTERVAL = 1000 // 1 second

@customElement('fd-mem-chart')
export class FdMemChart extends LitElement {
  @property({ type: Boolean, reflect: true })
  active = false

  @property({ type: Number })
  height = 80

  @state()
  private _dataPoints: number[] = []

  @state()
  private _currentMB = 0

  @state()
  private _width = 200

  private _intervalId: number | null = null
  private _resizeObserver: ResizeObserver | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this._initializeData()
    this._startSampling()
    this._setupResizeObserver()
  }

  disconnectedCallback(): void {
    this._stopSampling()
    this._cleanupResizeObserver()
    super.disconnectedCallback()
  }

  private _setupResizeObserver(): void {
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const borderBoxSize = entry.borderBoxSize[0]
        if(borderBoxSize) {
          const width = borderBoxSize.inlineSize
          this._width = width - 16 // Account for padding
        }
      }
    })
    this._resizeObserver.observe(this)
  }

  private _cleanupResizeObserver(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }
  }

  private _initializeData(): void {
    // Initialize with zeros
    this._dataPoints = new Array(MAX_POINTS).fill(0)
    // Take initial sample
    this._sampleMemory()
  }

  private _startSampling(): void {
    if (this._intervalId !== null) return
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
      // Fallback for browsers without memory API
      return
    }

    const usedMB = perf.memory.usedJSHeapSize / (1024 * 1024)
    this._currentMB = usedMB

    // Shift data and add new point
    const newData = [...this._dataPoints.slice(1), usedMB]
    this._dataPoints = newData
  }

  private _getPathData(): string {
    const data = this._dataPoints
    if (data.length === 0) return ''

    const padding = 2
    const chartWidth = this._width - padding * 2
    const chartHeight = this.height - padding * 2

    // Find min/max for scaling
    const validPoints = data.filter((v) => v > 0)
    if (validPoints.length === 0) return ''

    const min = Math.min(...validPoints) * 0.9
    const max = Math.max(...validPoints) * 1.1

    const range = max - min || 1

    // Generate path
    const points = data.map((value, index) => {
      const x = padding + (index / (MAX_POINTS - 1)) * chartWidth
      const y =
        value === 0
          ? chartHeight + padding
          : padding + chartHeight - ((value - min) / range) * chartHeight
      return { x, y }
    })

    // Create SVG path
    if (points.length === 0) return ''
    const firstPoint = points[0]!
    let path = `M ${firstPoint.x} ${firstPoint.y}`
    for (let i = 1; i < points.length; i++) {
      const point = points[i]!
      path += ` L ${point.x} ${point.y}`
    }

    return path
  }

  private _getAreaPath(): string {
    const linePath = this._getPathData()
    if (!linePath) return ''

    const padding = 2
    const chartWidth = this._width - padding * 2

    // Close the path to create a filled area
    return `${linePath} L ${padding + chartWidth} ${this.height - padding} L ${padding} ${this.height - padding} Z`
  }

  render() {
    return html`
      <div class="chart-container">
        <svg
          class="chart-svg"
          width="${this._width}"
          height="${this.height}"
          viewBox="0 0 ${this._width} ${this.height}"
        >
          <!-- Grid lines -->
          <line
            class="grid-line"
            x1="2"
            y1="${this.height / 2}"
            x2="${this._width - 2}"
            y2="${this.height / 2}"
          />
          <!-- Area fill -->
          <path class="chart-area" d="${this._getAreaPath()}" />
          <!-- Line -->
          <path class="chart-line" d="${this._getPathData()}" />
        </svg>
        <div class="chart-label">
          <span class="chart-value">${Math.round(this._currentMB)}</span>
          <span class="chart-unit">MB</span>
        </div>
      </div>
    `
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .chart-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px;
      background: #141414;
      border-radius: 6px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
      width: 100%;
      box-sizing: border-box;
    }

    .chart-svg {
      display: block;
    }

    .grid-line {
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 1;
      stroke-dasharray: 2 2;
    }

    .chart-area {
      fill: rgba(142, 97, 230, 0.2);
    }

    .chart-line {
      fill: none;
      stroke: rgba(142, 97, 230, 0.8);
      stroke-width: 1.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .chart-label {
      display: flex;
      align-items: baseline;
      gap: 2px;
      font-family: var(--fd-font-mono);
    }

    .chart-value {
      font-size: 12px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
    }

    .chart-unit {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-mem-chart': FdMemChart
  }
}

