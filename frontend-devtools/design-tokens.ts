import { css } from 'lit'

export const designTokens = css`
  :host {
    /* ===== Color Tokens ===== */
    --fd-color-primary: #7361e6;
    --fd-color-primary-hover: #8571f0;
    --fd-color-primary-active: #6351d6;
    --fd-color-primary-muted: #8e61e3;
    --fd-color-primary-muted-hover: #9f7af0;

    --fd-color-black: #000;
    --fd-color-white: #fff;
    --fd-color-gray-900: #141414;
    --fd-color-gray-800: #1a1a1a;
    --fd-color-gray-700: #1f1f1f;
    --fd-color-gray-600: #525252;
    --fd-color-gray-500: #999;
    --fd-color-gray-400: #f0f0f0;
    --fd-color-gray-300: #888;
    --fd-color-gray-200: #232326;

    --fd-color-success: #22c55e;
    --fd-color-success-light: #4ade80;
    --fd-color-warning: #f59e0b;
    --fd-color-error: #ef4444;
    --fd-color-error-light: #f87171;

    --fd-color-fps-good: rgb(214, 132, 245);
    --fd-color-memory-healthy: #6ee7b7;

    --fd-color-inspect-stroke: rgba(142, 97, 227, 0.5);
    --fd-color-inspect-fill: rgba(173, 97, 230, 0.1);
    --fd-color-inspect-pill-bg: rgba(37, 37, 38, 0.75);
    --fd-color-inspect-pill-text: white;
    --fd-color-inspect-marked-stroke: rgba(79, 192, 255, 0.6);
    --fd-color-inspect-marked-fill: rgba(79, 192, 255, 0.1);
    --fd-color-inspect-marked-pill-bg: rgba(20, 60, 80, 0.85);
    --fd-color-inspect-marked-pill-text: #79c0ff;
    --fd-color-inspect-react-stroke: rgba(97, 218, 251, 0.6);
    --fd-color-inspect-react-fill: rgba(97, 218, 251, 0.1);
    --fd-color-inspect-react-pill-bg: rgba(20, 44, 52, 0.9);
    --fd-color-inspect-react-pill-text: #61dafb;

    --fd-color-text: #fff;
    --fd-color-text-muted: rgba(255, 255, 255, 0.5);
    --fd-color-text-muted-light: rgba(255, 255, 255, 0.3);
    --fd-color-text-muted-lighter: rgba(255, 255, 255, 0.6);
    --fd-color-text-muted-lightest: rgba(255, 255, 255, 0.9);
    --fd-color-border: rgba(255, 255, 255, 0.08);
    --fd-color-border-hover: rgba(255, 255, 255, 0.15);
    --fd-color-border-active: rgba(142, 97, 230, 0.4);
    --fd-color-bg-hover: rgba(255, 255, 255, 0.1);
    --fd-color-bg-bar: rgba(255, 255, 255, 0.06);

    /* ===== Font Tokens ===== */
    --fd-font: system-ui, -apple-system, sans-serif;
    --fd-font-mono: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;

    --fd-font-size-xs: 10px;
    --fd-font-size-sm: 11px;
    --fd-font-size-base: 12px;
    --fd-font-size-md: 13px;
    --fd-font-size-lg: 14px;
    --fd-font-size-xl: 16px;
    --fd-font-size-2xl: 28px;
    --fd-font-size-3xl: 3.2em;

    --fd-font-weight-normal: 400;
    --fd-font-weight-medium: 500;
    --fd-font-weight-semibold: 600;

    /* ===== Spacing Tokens ===== */
    --fd-spacing-xs: 2px;
    --fd-spacing-sm: 4px;
    --fd-spacing-md: 6px;
    --fd-spacing-lg: 8px;
    --fd-spacing-xl: 12px;
    --fd-spacing-2xl: 16px;
    --fd-spacing-3xl: 20px;

    /* ===== Border Radius Tokens ===== */
    --fd-radius-sm: 3px;
    --fd-radius-md: 4px;
    --fd-radius-lg: 6px;
    --fd-radius-xl: 8px;
    --fd-radius-full: 9999px;

    /* ===== Shadow Tokens ===== */
    --fd-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
    --fd-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
    --fd-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.08);
    --fd-shadow-inset: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    --fd-shadow-inset-hover: inset 0 0 0 1px rgba(255, 255, 255, 0.15);

    /* ===== Transition Tokens ===== */
    --fd-transition-fast: 0.15s;
    --fd-transition-base: 0.2s;
    --fd-transition-slow: 0.3s;
    --fd-transition-slower: 0.4s;
    --fd-transition-ease-out: ease-out;
    --fd-transition-ease-in-out: ease-in-out;
    --fd-transition-cubic: cubic-bezier(0.34, 1.56, 0.64, 1);

    /* ===== Size Tokens ===== */
    --fd-size-button-height: 28px;
    --fd-size-button-height-sm: 24px;
    --fd-size-button-padding-x: 12px;
    --fd-size-button-padding-y: 6px;
    --fd-size-button-icon: 16px;
    --fd-size-button-icon-sm: 14px;
    --fd-size-button-icon-lg: 18px;

    --fd-size-switch-width: 36px;
    --fd-size-switch-height: 20px;
    --fd-size-switch-thumb: 16px;

    --fd-size-icon-sm: 14px;
    --fd-size-icon-md: 16px;
    --fd-size-icon-lg: 18px;

    --fd-size-meter-height: 24px;
    --fd-size-meter-min-width: 24px;
    --fd-size-meter-memory-min-width: 38px;

    --fd-size-radar-legend-dot: 8px;

    /* ===== Opacity Tokens ===== */
    --fd-opacity-disabled: 0.5;
    --fd-opacity-hover: 0.1;
    --fd-opacity-muted: 0.3;
    --fd-opacity-semitransparent: 0.75;
    --fd-opacity-almost-opaque: 0.9;
    --fd-opacity-almost-transparent: 0.1;
  }
`