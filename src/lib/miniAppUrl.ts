const TEMPLATE_ID_TOKEN = '{templateId}'
export const DEFAULT_MINI_APP_URL = 'momo://action=marketing&refId=cornerstone_sdui&featureCode=cornerstone_sdui'

export function buildMiniAppUrl(baseUrl: string, templateId: string): string {
  const base = baseUrl.trim()
  if (!base) throw new Error('Chưa cấu hình Mini App URL.')
  if (!templateId) throw new Error('Template chưa có ID.')

  if (base.includes(TEMPLATE_ID_TOKEN)) {
    return base.replaceAll(TEMPLATE_ID_TOKEN, encodeURIComponent(templateId))
  }

  // MoMo's action deep link is a legacy ampersand-delimited format rather
  // than a standard URL query. Mini App launch data belongs in `params`.
  if (/^momo:\/\/action=/i.test(base)) {
    const params = encodeURIComponent(JSON.stringify({ templateId }))
    const withoutExistingParams = base.replace(/&params=[^&]*/i, '')
    return `${withoutExistingParams}&params=${params}`
  }

  let url: URL
  try {
    url = new URL(base)
  } catch {
    throw new Error('Mini App URL phải là URL đầy đủ hoặc deep link hợp lệ.')
  }
  url.searchParams.set('templateId', templateId)
  return url.href
}
