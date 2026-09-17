const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://be-platform-bincountit1.fly.dev/api'

/** Registry API phục vụ danh sách version + changelog của package */
export const REGISTRY_API_URL =
  import.meta.env.VITE_REGISTRY_API_URL || API_BASE_URL

/** Package mặc định hiển thị ở tab ChangeLog */
export const CHANGELOG_PACKAGE = {
  scope: 'momo-platform',
  name: 'cornerstone-native',
}

export default API_BASE_URL
