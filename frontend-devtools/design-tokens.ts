import { css } from 'lit'

export const designTokens = css`
  :host {
    /* Typography */
    --fd-font: system-ui, -apple-system, sans-serif;
    --fd-font-mono: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;

    /* Primary blue color */
    --fd-primary: rgb(56, 152, 255);
    --fd-primary-hover: rgb(100, 175, 255);
    --fd-primary-50: rgba(56, 152, 255, 0.5);
    --fd-primary-40: rgba(56, 152, 255, 0.4);
    --fd-primary-20: rgba(56, 152, 255, 0.2);
    --fd-primary-15: rgba(56, 152, 255, 0.15);
    --fd-primary-10: rgba(56, 152, 255, 0.1);

    /* Backgrounds */
    --fd-bg-solid: #000;
    --fd-bg-panel: #141414;
    --fd-bg-elevated: #1a1a1a;
    --fd-bg-hover: rgba(255, 255, 255, 0.1);

    /* Borders & Shadows */
    --fd-border-subtle: rgba(255, 255, 255, 0.08);
    --fd-border-medium: rgba(255, 255, 255, 0.15);
    --fd-shadow-panel: 0 4px 12px rgba(0, 0, 0, 0.3);
    --fd-inset-border-subtle: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    --fd-inset-border-medium: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
    --fd-inset-border-primary: inset 0 0 0 1px var(--fd-primary-40);

    /* Text colors */
    --fd-text-primary: #fff;
    --fd-text-secondary: #e0e0e0;
    --fd-text-muted: #999;
    --fd-text-faint: rgba(255, 255, 255, 0.3);

    /* Focus ring */
    --fd-focus-ring: 2px solid var(--fd-primary);

    /* Switch */
    --fd-switch-off: #525252;
    --fd-switch-knob: #fff;
    --fd-switch-knob-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

    /* Semantic colors */
    --fd-success: #81c784;
    --fd-info: #64b5f6;
    --fd-info-bg: rgba(100, 181, 246, 0.15);
    --fd-info-bg-hover: rgba(100, 181, 246, 0.25);

    /* Chart colors */
    --fd-chart-grid: rgba(255, 255, 255, 0.06);
    --fd-chart-grid-major: rgba(255, 255, 255, 0.15);
    --fd-chart-label: rgba(255, 255, 255, 0.4);
    --fd-chart-fill: var(--fd-primary-20);
    --fd-chart-stroke: rgba(56, 152, 255, 0.8);

    /* Radar */
    --fd-radar-stroke: rgba(255, 255, 255, 0.85);
  }
`