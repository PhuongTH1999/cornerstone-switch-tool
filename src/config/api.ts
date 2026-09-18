const PROD_API_URL = 'https://yepswakp3nxo4qoeynn74xhnt40wqlia.lambda-url.us-east-1.on.aws/api'
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

/** Debug gọi Vite proxy `/api` → localhost:3000; production gọi backend AWS Lambda. */
const API_BASE_URL = import.meta.env.DEV
  ? configuredApiUrl || '/api'
  : configuredApiUrl && configuredApiUrl !== '/api'
    ? configuredApiUrl
    : PROD_API_URL

/** Registry API phục vụ danh sách version + changelog của package */
export const REGISTRY_API_URL =
  import.meta.env.VITE_REGISTRY_API_URL || API_BASE_URL

/** Package mặc định hiển thị ở tab ChangeLog */
export const CHANGELOG_PACKAGE = {
  scope: 'momo-platform',
  name: 'cornerstone-native',
}

export default API_BASE_URL
