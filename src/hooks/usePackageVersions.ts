import { useCallback, useEffect, useMemo, useState } from 'react'
import { CHANGELOG_PACKAGE, REGISTRY_API_URL } from '../config/api'

export interface PackageVersion {
  version: string
  release_date: string
  changelog: string
  created_at: string
}

interface VersionsResponse {
  success: boolean
  package_name: string
  total_versions: number
  versions: PackageVersion[]
  message?: string
}

/** Mới nhất lên đầu: theo release_date, tie-break bằng so sánh version numeric-aware */
const compareVersions = (a: PackageVersion, b: PackageVersion) => {
  const byDate = new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
  if (byDate) return byDate
  return b.version.localeCompare(a.version, undefined, { numeric: true })
}

/** Lấy danh sách version + changelog của package từ registry API */
export function usePackageVersions() {
  const [data, setData] = useState<VersionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { scope, name } = CHANGELOG_PACKAGE

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${REGISTRY_API_URL}/packages/${scope}/${name}/versions`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const json: VersionsResponse = await response.json()
      if (!json.success) {
        throw new Error(json.message || 'API trả về success = false')
      }
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu version')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [scope, name])

  useEffect(() => {
    reload()
  }, [reload])

  const versions = useMemo(
    () => (data ? [...data.versions].sort(compareVersions) : []),
    [data]
  )

  return {
    versions,
    latest: versions[0] ?? null,
    packageName: data?.package_name ?? '',
    totalVersions: data?.total_versions ?? versions.length,
    loading,
    error,
    reload,
  }
}
