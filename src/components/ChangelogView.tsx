import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { usePackageVersions } from '../hooks/usePackageVersions'

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function ChangelogView() {
  const { versions, packageName, totalVersions, loading, error, reload } = usePackageVersions()

  if (loading) {
    return <div className="docs-loading">Đang tải changelog...</div>
  }

  if (error) {
    return (
      <div className="changelog-error">
        <p>❌ Không tải được changelog: {error}</p>
        <button className="changelog-refresh" onClick={reload}>
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="changelog-view">
      <div className="changelog-toolbar">
        <div className="changelog-meta">
          <span className="changelog-package">{packageName}</span>
          <span className="changelog-count">{totalVersions} versions</span>
        </div>
        <button className="changelog-refresh" onClick={reload}>
          ↻ Làm mới
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="docs-loading">Chưa có version nào.</div>
      ) : (
        <ol className="changelog-timeline">
          {versions.map((item, index) => (
            <li key={item.version} className="changelog-item">
              <span className="changelog-dot" />
              <div className="changelog-card">
                <div className="changelog-card-header">
                  <h3 className="changelog-version">{item.version}</h3>
                  {index === 0 && <span className="changelog-badge">🆕 mới nhất</span>}
                  <span className="changelog-date">{formatDate(item.release_date)}</span>
                </div>
                <div className="markdown-body changelog-md">
                  {item.changelog?.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.changelog}</ReactMarkdown>
                  ) : (
                    <p>🧹 Bảo trì nội bộ, không có thay đổi tính năng.</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
