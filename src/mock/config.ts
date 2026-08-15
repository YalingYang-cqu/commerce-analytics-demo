/**
 * 前端 Mock 总开关。
 *
 * 作品集 Demo 在开发和构建产物中均使用本地 Mock，
 * 避免连接任何公司或外部业务服务。
 */
export const MOCK_ENABLED = import.meta.env.VITE_USE_MOCK !== 'false'
