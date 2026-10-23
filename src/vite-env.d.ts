/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 是否启用前端 mock（Mirage JS，见 src/mocks）。
   * 开发环境默认开启（设为 'false' 关闭）；生产构建设为 'true' 启用。
   */
  readonly VITE_ENABLE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
