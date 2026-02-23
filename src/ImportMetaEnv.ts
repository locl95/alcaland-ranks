interface ImportMetaEnv {
  readonly VITE_API_HOST: string
  readonly VITE_SERVICE_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}