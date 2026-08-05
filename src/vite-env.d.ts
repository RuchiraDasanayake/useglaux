/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MARKETS_URL?: string;
  /** When set, the hero loads this glTF/GLB instead of the procedural owl. */
  readonly VITE_OWL_MODEL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
