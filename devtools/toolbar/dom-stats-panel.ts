// ============================================================================
// DOM STATS PANEL
// ============================================================================
// DOM statistics visualization with odometer animations.
// ============================================================================

import { TooltipManager } from "../ui";
import { StorageManager } from "../storage";

/**
 * Manages DOM statistics display with animated odometer counters.
 */
export class DomStatsPanel {
  #tooltipManager: TooltipManager;
  #prevDomCounts: Record<string, number> | null = null;
  #pinned = false;
  #intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(tooltipManager: TooltipManager) {
    this.#tooltipManager = tooltipManager;
  }

  /**
   * Check if DOM stats is pinned.
   */
  get isPinned(): boolean {
    return this.#pinned;
  }

  /**
   * Pin the DOM stats panel.
   */
  pin(): void {
    this.#pinned = true;
    StorageManager.setDomStatsPinned(true);
    const statsElement = this.#createDomStatsElement();
    this.#tooltipManager.pinElement(statsElement);

    // Update DOM stats every 500ms while pinned
    this.#intervalId = setInterval(() => {
      this.#updateDomStatsElement(statsElement);
    }, 500);
  }

  /**
   * Unpin the DOM stats panel.
   */
  unpin(): void {
    this.#pinned = false;
    StorageManager.setDomStatsPinned(false);
    this.#tooltipManager.unpin();

    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }

  /**
   * Get current DOM statistics data.
   * @private
   */
  #getDOMStatsData(): { total: number; counts: Record<string, number>; sorted: [string, number][] } {
    const body = document.body;
    if (!body) return { total: 0, counts: {}, sorted: [] };

    const allNodes = body.querySelectorAll("*");
    const totalNodes = allNodes.length;
    const counts: Record<string, number> = {};

    for (const el of allNodes) {
      const tag = el.tagName.toLowerCase();
      counts[tag] = (counts[tag] || 0) + 1;
    }

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6) as [string, number][];

    return { total: totalNodes, counts, sorted };
  }

  /**
   * Create odometer HTML for a number with digit-by-digit animation.
   * @private
   */
  #createOdometerHtml(newVal: number, oldVal: number | null): string {
    const newStr = String(newVal);
    const oldStr = oldVal !== null ? String(oldVal) : newStr;

    let direction = "";
    if (oldVal !== null) {
      if (newVal > oldVal) direction = "increasing";
      else if (newVal < oldVal) direction = "decreasing";
    }

    const maxLen = Math.max(newStr.length, oldStr.length);
    const paddedNew = newStr.padStart(maxLen, " ");
    const paddedOld = oldStr.padStart(maxLen, " ");

    let digits = "";
    for (let i = 0; i < maxLen; i++) {
      const oldDigit = paddedOld[i] ?? " ";
      const newDigit = paddedNew[i] ?? " ";

      let digitAnim = "";
      if (oldDigit !== newDigit && oldVal !== null) {
        const oldNum = oldDigit === " " ? -1 : parseInt(oldDigit, 10);
        const newNum = newDigit === " " ? -1 : parseInt(newDigit, 10);

        if (newNum > oldNum || (oldDigit === " " && newDigit !== " ")) {
          digitAnim = "roll-up";
        } else {
          digitAnim = "roll-down";
        }
      }

      if (digitAnim) {
        const displayOld = oldDigit === " " ? "&nbsp;" : oldDigit;
        const displayNew = newDigit === " " ? "&nbsp;" : newDigit;

        if (digitAnim === "roll-up") {
          digits += `<span class="odometer-digit"><span class="odometer-digit-inner ${digitAnim}"><span class="odometer-digit-old">${displayOld}</span><span class="odometer-digit-new">${displayNew}</span></span></span>`;
        } else {
          digits += `<span class="odometer-digit"><span class="odometer-digit-inner ${digitAnim}"><span class="odometer-digit-new">${displayNew}</span><span class="odometer-digit-old">${displayOld}</span></span></span>`;
        }
      } else {
        const displayDigit = newDigit === " " ? "" : newDigit;
        digits += `<span class="odometer-digit"><span class="odometer-digit-inner"><span class="odometer-digit-new">${displayDigit}</span></span></span>`;
      }
    }

    return `<span class="odometer ${direction}">${digits}</span>`;
  }

  /**
   * Create the DOM stats visual element.
   * @private
   */
  #createDomStatsElement(): HTMLElement {
    const { total, sorted } = this.#getDOMStatsData();
    const maxCount = sorted.length > 0 ? (sorted[0]?.[1] ?? 1) : 1;

    const container = document.createElement("div");
    container.className = "devtools-dom-stats";

    const header = document.createElement("div");
    header.className = "devtools-dom-stats-header";

    const totalEl = document.createElement("span");
    totalEl.className = "devtools-dom-stats-total";
    totalEl.innerHTML = this.#createOdometerHtml(total, null);
    totalEl.dataset["value"] = String(total);

    const labelEl = document.createElement("span");
    labelEl.className = "devtools-dom-stats-label";
    labelEl.textContent = "DOM Nodes";

    header.appendChild(totalEl);
    header.appendChild(labelEl);
    container.appendChild(header);

    const chart = document.createElement("div");
    chart.className = "devtools-dom-stats-chart";

    for (const [tag, count] of sorted) {
      const row = document.createElement("div");
      row.className = "devtools-dom-stats-row";
      row.dataset["tag"] = tag;

      const tagEl = document.createElement("span");
      tagEl.className = "devtools-dom-stats-tag";
      tagEl.textContent = tag;

      const barContainer = document.createElement("div");
      barContainer.className = "devtools-dom-stats-bar-container";

      const bar = document.createElement("div");
      bar.className = "devtools-dom-stats-bar";
      bar.style.width = `${(count / maxCount) * 100}%`;
      bar.dataset["count"] = String(count);

      const countEl = document.createElement("span");
      countEl.className = "devtools-dom-stats-count";
      countEl.textContent = count.toLocaleString();

      barContainer.appendChild(bar);
      barContainer.appendChild(countEl);
      row.appendChild(tagEl);
      row.appendChild(barContainer);
      chart.appendChild(row);
    }

    container.appendChild(chart);
    this.#prevDomCounts = Object.fromEntries(sorted);

    return container;
  }

  /**
   * Update the DOM stats element with new data.
   * @private
   */
  #updateDomStatsElement(container: HTMLElement): void {
    const { total, sorted } = this.#getDOMStatsData();
    const maxCount = sorted.length > 0 ? (sorted[0]?.[1] ?? 1) : 1;

    const totalEl = container.querySelector(".devtools-dom-stats-total") as HTMLElement | null;
    if (totalEl) {
      const prevTotal = parseInt(totalEl.dataset["value"] ?? "0", 10) || 0;
      if (total !== prevTotal) {
        totalEl.innerHTML = this.#createOdometerHtml(total, prevTotal);
        totalEl.dataset["value"] = String(total);
      }
    }

    const chart = container.querySelector(".devtools-dom-stats-chart");
    if (!chart) return;

    const rows = chart.querySelectorAll(".devtools-dom-stats-row");

    sorted.forEach(([tag, count], index) => {
      const row = rows[index] as HTMLElement | undefined;
      if (!row) return;

      const prevCount = this.#prevDomCounts?.[tag] ?? count;
      const hasChanged = count !== prevCount;

      const tagEl = row.querySelector(".devtools-dom-stats-tag");
      if (tagEl && tagEl.textContent !== tag) {
        tagEl.textContent = tag;
      }
      row.dataset["tag"] = tag;

      const bar = row.querySelector(".devtools-dom-stats-bar") as HTMLElement | null;
      if (bar) {
        bar.style.width = `${(count / maxCount) * 100}%`;

        if (hasChanged) {
          bar.classList.remove("increasing", "decreasing");
          void bar.offsetWidth;
          bar.classList.add(count > prevCount ? "increasing" : "decreasing");
        }
        bar.dataset["count"] = String(count);
      }

      const countEl = row.querySelector(".devtools-dom-stats-count");
      if (countEl) {
        countEl.textContent = count.toLocaleString();
      }
    });

    this.#prevDomCounts = Object.fromEntries(sorted);
  }
}

