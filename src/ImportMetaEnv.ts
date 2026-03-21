interface ImportMetaEnv {
  readonly VITE_API_HOST: string
  readonly VITE_SERVICE_TOKEN: string
  readonly FEATURE_FLAG_POLLING_ENABLED: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}