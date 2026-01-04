import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { FdMemObserver } from '../core/fd-mem-observer'
import type { MemoryInfo } from '../core/fd-mem-observer'

const MAX_POINTS = 120
const Y_AXIS_WIDTH = 48 // Width reserved for Y-axis labels (supports up to 9999MB)
const CHART_PADDING = 2
const CHART_TOP_MARGIN = 10 // Extra top margin for axis label visibility

@customElement('fd-mem-chart')
export class FdMemChart extends LitElement {
  @property({ type: Boolean, reflect: true })
  active = false

  @property({ type: Number })
  height = 184

  @state()
  private _dataPoints: number[] = []

  @state()
  private _width = 200

  private _unsubscribe: (() => void) | null = null
  private _resizeObserver: ResizeObserver | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this._initializeData()
    this._unsubscribe = FdMemObserver.subscribe((info) => {
      this._handleMemoryUpdate(info)
    })
    this._setupResizeObserver()
  }

  disconnectedCallback(): void {
    this._unsubscribe?.()
    this._unsubscribe = null
    this._cleanupResizeObserver()
    super.disconnectedCallback()
  }

  private _setupResizeObserver(): void {
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const borderBoxSize = entry.borderBoxSize[0]
        if (borderBoxSize) {
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
    this._dataPoints = Array.from({ length: MAX_POINTS }, () => 0)
  }

  private _handleMemoryUpdate(info: MemoryInfo): void {
    // Shift data and add new point
    const newData = [...this._dataPoints.slice(1), info.usedMB]
    this._dataPoints = newData
  }

  private _getMinMax(): { min: number; max: number } {
    const validPoints = this._dataPoints.filter((v) => v > 0)
    if (validPoints.length === 0) return { min: 0, max: 100 }

    const min = Math.min(...validPoints) * 0.9
    const max = Math.max(...validPoints) * 1.1
    return { min, max }
  }

  private _getChartDimensions(): { chartWidth: number; chartHeight: number; chartLeft: number; chartTop: number } {
    const chartLeft = Y_AXIS_WIDTH
    const chartTop = CHART_TOP_MARGIN
    const chartWidth = this._width - chartLeft - CHART_PADDING
    const chartHeight = this.height - chartTop - CHART_PADDING
    return { chartWidth, chartHeight, chartLeft, chartTop }
  }

  private _getPathData(): string {
    const data = this._dataPoints
    if (data.length === 0) return ''

    const { chartWidth, chartHeight, chartLeft, chartTop } = this._getChartDimensions()
    const { min, max } = this._getMinMax()
    const range = max - min || 1

    // Generate path
    const points = data.map((value, index) => {
      const x = chartLeft + (index / (MAX_POINTS - 1)) * chartWidth
      const y = value === 0 ? chartTop + chartHeight : chartTop + chartHeight - ((value - min) / range) * chartHeight
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

    const { chartWidth, chartHeight, chartLeft, chartTop } = this._getChartDimensions()
    const bottom = chartTop + chartHeight

    // Close the path to create a filled area
    return `${linePath} L ${chartLeft + chartWidth} ${bottom} L ${chartLeft} ${bottom} Z`
  }

  private _formatMB(value: number): string {
    if (value >= 10000) {
      return `${(value / 1000).toFixed(1)}G`
    }
    return `${Math.round(value)}`
  }

  render() {
    const { min, max } = this._getMinMax()
    const { chartLeft, chartTop, chartHeight } = this._getChartDimensions()
    const mid = (min + max) / 2
    const bottom = chartTop + chartHeight
    const middle = chartTop + chartHeight / 2

    return html`
      <div class="chart-container">
        <svg
          class="chart-svg"
          width="${this._width}"
          height="${this.height}"
          viewBox="0 0 ${this._width} ${this.height}"
        >
          <!-- Y-axis labels -->
          <text class="axis-label" x="${chartLeft - 4}" y="${chartTop + 4}" text-anchor="end">
            ${this._formatMB(max)}
          </text>
          <text class="axis-label" x="${chartLeft - 4}" y="${middle + 3}" text-anchor="end">
            ${this._formatMB(mid)}
          </text>
          <text class="axis-label" x="${chartLeft - 4}" y="${bottom}" text-anchor="end">
            ${this._formatMB(min)}
          </text>

          <!-- Grid lines -->
          <line
            class="grid-line"
            x1="${chartLeft}"
            y1="${chartTop}"
            x2="${this._width - CHART_PADDING}"
            y2="${chartTop}"
          />
          <line
            class="grid-line"
            x1="${chartLeft}"
            y1="${middle}"
            x2="${this._width - CHART_PADDING}"
            y2="${middle}"
          />
          <line
            class="grid-line"
            x1="${chartLeft}"
            y1="${bottom}"
            x2="${this._width - CHART_PADDING}"
            y2="${bottom}"
          />

          <!-- Y-axis line -->
          <line
            class="axis-line"
            x1="${chartLeft}"
            y1="${chartTop}"
            x2="${chartLeft}"
            y2="${bottom}"
          />

          <!-- Area fill -->
          <path class="chart-area" d="${this._getAreaPath()}" />
          <!-- Line -->
          <path class="chart-line" d="${this._getPathData()}" />
        </svg>
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
      stroke: rgba(255, 255, 255, 0.06);
      stroke-width: 1;
      stroke-dasharray: 2 2;
    }

    .axis-line {
      stroke: rgba(255, 255, 255, 0.15);
      stroke-width: 1;
    }

    .axis-label {
      font-family: var(--fd-font-mono);
      font-size: 9px;
      fill: rgba(255, 255, 255, 0.4);
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
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-mem-chart': FdMemChart
  }
}