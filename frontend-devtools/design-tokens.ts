import { css } from 'lit'

export const designTokens = css`
  :host {
    /* ===== Color Tokens ===== */
    --dt-color-primary: #7361e6;
    --dt-color-primary-hover: #8571f0;
    --dt-color-primary-active: #6351d6;
    --dt-color-primary-muted: #8e61e3;
    --dt-color-primary-muted-hover: #9f7af0;

    --dt-color-black: #000;
    --dt-color-white: #fff;
    --dt-color-gray-900: #141414;
    --dt-color-gray-800: #1a1a1a;
    --dt-color-gray-700: #1f1f1f;
    --dt-color-gray-600: #525252;
    --dt-color-gray-500: #999;
    --dt-color-gray-400: #f0f0f0;
    --dt-color-gray-300: #888;
    --dt-color-gray-200: #232326;

    --dt-color-success: #22c55e;
    --dt-color-success-light: #4ade80;
    --dt-color-warning: #f59e0b;
    --dt-color-error: #ef4444;
    --dt-color-error-light: #f87171;

    --dt-color-fps-good: rgb(214, 132, 245);
    --dt-color-memory-healthy: #6ee7b7;

    --dt-color-inspect-stroke: rgba(142, 97, 227, 0.5);
    --dt-color-inspect-fill: rgba(173, 97, 230, 0.1);
    --dt-color-inspect-pill-bg: rgba(37, 37, 38, 0.75);
    --dt-color-inspect-pill-text: white;
    --dt-color-inspect-marked-stroke: rgba(79, 192, 255, 0.6);
    --dt-color-inspect-marked-fill: rgba(79, 192, 255, 0.1);
    --dt-color-inspect-marked-pill-bg: rgba(20, 60, 80, 0.85);
    --dt-color-inspect-marked-pill-text: #79c0ff;
    --dt-color-inspect-react-stroke: rgba(97, 218, 251, 0.6);
    --dt-color-inspect-react-fill: rgba(97, 218, 251, 0.1);
    --dt-color-inspect-react-pill-bg: rgba(20, 44, 52, 0.9);
    --dt-color-inspect-react-pill-text: #61dafb;

    --dt-color-text: #fff;
    --dt-color-text-muted: rgba(255, 255, 255, 0.5);
    --dt-color-text-muted-light: rgba(255, 255, 255, 0.3);
    --dt-color-text-muted-lighter: rgba(255, 255, 255, 0.6);
    --dt-color-text-muted-lightest: rgba(255, 255, 255, 0.9);
    --dt-color-border: rgba(255, 255, 255, 0.08);
    --dt-color-border-hover: rgba(255, 255, 255, 0.15);
    --dt-color-border-active: rgba(142, 97, 230, 0.4);
    --dt-color-bg-hover: rgba(255, 255, 255, 0.1);
    --dt-color-bg-bar: rgba(255, 255, 255, 0.06);

    /* ===== Font Tokens ===== */
    --dt-font-ui: system-ui, -apple-system, sans-serif;
    --dt-font-mono: 11px Menlo, Consolas, Monaco, Liberation Mono,
      Lucida Console, monospace;
    --dt-font-mono-family: ui-monospace, monospace;

    --dt-font-size-xs: 10px;
    --dt-font-size-sm: 11px;
    --dt-font-size-base: 12px;
    --dt-font-size-md: 13px;
    --dt-font-size-lg: 14px;
    --dt-font-size-xl: 16px;
    --dt-font-size-2xl: 28px;
    --dt-font-size-3xl: 3.2em;

    --dt-font-weight-normal: 400;
    --dt-font-weight-medium: 500;
    --dt-font-weight-semibold: 600;

    /* ===== Spacing Tokens ===== */
    --dt-spacing-xs: 2px;
    --dt-spacing-sm: 4px;
    --dt-spacing-md: 6px;
    --dt-spacing-lg: 8px;
    --dt-spacing-xl: 12px;
    --dt-spacing-2xl: 16px;
    --dt-spacing-3xl: 20px;

    /* ===== Border Radius Tokens ===== */
    --dt-radius-sm: 3px;
    --dt-radius-md: 4px;
    --dt-radius-lg: 6px;
    --dt-radius-xl: 8px;
    --dt-radius-full: 9999px;

    /* ===== Shadow Tokens ===== */
    --dt-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
    --dt-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
    --dt-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.08);
    --dt-shadow-inset: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    --dt-shadow-inset-hover: inset 0 0 0 1px rgba(255, 255, 255, 0.15);

    /* ===== Transition Tokens ===== */
    --dt-transition-fast: 0.15s;
    --dt-transition-base: 0.2s;
    --dt-transition-slow: 0.3s;
    --dt-transition-slower: 0.4s;
    --dt-transition-ease-out: ease-out;
    --dt-transition-ease-in-out: ease-in-out;
    --dt-transition-cubic: cubic-bezier(0.34, 1.56, 0.64, 1);

    /* ===== Size Tokens ===== */
    --dt-size-button-height: 28px;
    --dt-size-button-height-sm: 24px;
    --dt-size-button-padding-x: 12px;
    --dt-size-button-padding-y: 6px;
    --dt-size-button-icon: 16px;
    --dt-size-button-icon-sm: 14px;
    --dt-size-button-icon-lg: 18px;

    --dt-size-switch-width: 36px;
    --dt-size-switch-height: 20px;
    --dt-size-switch-thumb: 16px;

    --dt-size-icon-sm: 14px;
    --dt-size-icon-md: 16px;
    --dt-size-icon-lg: 18px;

    --dt-size-meter-height: 24px;
    --dt-size-meter-min-width: 24px;
    --dt-size-meter-memory-min-width: 38px;

    --dt-size-radar-legend-dot: 8px;

    /* ===== Opacity Tokens ===== */
    --dt-opacity-disabled: 0.5;
    --dt-opacity-hover: 0.1;
    --dt-opacity-muted: 0.3;
    --dt-opacity-semitransparent: 0.75;
    --dt-opacity-almost-opaque: 0.9;
    --dt-opacity-almost-transparent: 0.1;
  }
`