/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the embeddable Vantage Pro desk (Grok Build app). */
  readonly VITE_VANTAGE_DESK_URL?: string;
  /** Comma-separated origin allowlist for the postMessage bus. Defaults to the desk URL origin. */
  readonly VITE_VANTAGE_DESK_ORIGINS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
