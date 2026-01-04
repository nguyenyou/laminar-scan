import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'

interface TagCount {
  tag: string
  count: number
}

@customElement('fd-dom-stats')
export class FdDomStats extends LitElement {
  @state()
  private _tagCounts: TagCount[] = []

  private _interval: number = 1000

  private _updateIntervalId: ReturnType<typeof setInterval> | null = null

  connectedCallback() {
    super.connectedCallback()
    this._calculateDomStats()
    this._startUpdateInterval()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._stopUpdateInterval()
  }

  private _startUpdateInterval() {
    this._updateIntervalId = setInterval(() => {
      this._calculateDomStats()
    }, this._interval)
  }

  private _stopUpdateInterval() {
    if (this._updateIntervalId) {
      clearInterval(this._updateIntervalId)
      this._updateIntervalId = null
    }
  }

  private _calculateDomStats() {
    const tagMap = new Map<string, number>()

    document.querySelectorAll('*').forEach((el) => {
      const tagName = el.tagName.toLowerCase()
      tagMap.set(tagName, (tagMap.get(tagName) || 0) + 1)
    })

    // Convert to array and sort by count (descending)
    this._tagCounts = Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  }

  render() {
    return html`
      <div class="dom-stats-container">
        ${this._tagCounts.map(
          (item) => html`
            <div class="dom-stats-row">
              <span class="tag-name">${item.tag}</span>
              <span class="tag-count">${item.count}</span>
            </div>
          `
        )}
      </div>
    `
  }

  static styles = css`
    :host {
      display: block;
      max-height: 400px;
    }

    .dom-stats-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: #1a1a1a;
      border-radius: 8px;
      padding: 12px;
      color: #e0e0e0;
      max-height: 100%;
      overflow-y: auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .dom-stats-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.4;
    }

    .dom-stats-row:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .tag-name {
      color: #64b5f6;
      font-weight: 500;
      flex: 1;
    }

    .tag-count {
      color: #81c784;
      font-weight: 600;
      min-width: 40px;
      text-align: right;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'fd-dom-stats': FdDomStats
  }
}

