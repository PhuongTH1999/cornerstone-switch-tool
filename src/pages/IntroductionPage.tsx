import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import '../styles/introduction.css'

interface TemplateItem {
  icon: string
  name: string
  desc: string
  file: string | null
  folder: string | null
}

export default function IntroductionPage() {
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null)

  const handleFeatureClick = (feature: string) => {
    const routes: Record<string, string> = {
      integrate: '/docs?doc=introduction',
      api: '/docs?doc=api',
      sdui: '/sdui',
      tools: '/tools',
      changelog: '/docs?doc=changelog'
    }
    navigate(routes[feature])
  }

  return (
    <div className="intro-container">
      <Navbar />

      <main className="intro-main">
        {/* Hero Section */}
        <section className="intro-hero">
          <div className="hero-content">
            <div className="hero-badge">🚀 Nền tảng Server-Driven UI</div>
            <h1 className="hero-title">Cornerstone</h1>
            <p className="hero-subtitle">
              Cung cấp nội dung động và render native widgets trên toàn bộ ứng dụng MoMo
            </p>

            <div className="hero-buttons">
              <Link to="/docs" className="btn btn-primary btn-lg">
                📚 Tài liệu
              </Link>
              <a href="https://app-graf.mservice.io/d/ff33e19b-572b-49bf-8b16-7c9f93acd844" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg">
                📊 Xem Metrics
              </a>
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-value">1.0.4-rc.9</div>
              <div className="stat-label">Phiên bản mới nhất</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">5.0+</div>
              <div className="stat-label">Hỗ trợ Platform</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">19</div>
              <div className="stat-label">Loại Widget</div>
            </div>
          </div>
        </section>

        {/* What is Cornerstone */}
        <section className="intro-section">
          <div className="section-container">
            <h2>Cornerstone là gì?</h2>
            <p className="section-intro">
              <strong>Cornerstone Native view</strong> cho phép render các format quảng cáo/nội dung do hệ thống CNS build, trực tiếp bằng <strong>native</strong> (Android Compose / iOS SwiftUI) thay vì React Native, giúp tăng hiệu năng và độ ổn định.
            </p>

            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">⚡</div>
                <h3>Tăng performance</h3>
                <p>Render native components thay vì React Native</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🔌</div>
                <h3>Truy cập trực tiếp API</h3>
                <p>Kết nối thẳng đến hệ thống mà không cần lớp trung gian</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🛡️</div>
                <h3>Ổn định & ít crash</h3>
                <p>So với web-based solutions</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">📦</div>
                <h3>Giảm bundle JS</h3>
                <p>Chuyển rendering sang native</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="intro-section intro-section-alt">
          <div className="section-container">
            <h2>Công cụ này làm gì?</h2>

            <div className="features-grid">
              <div className="feature-box" onClick={() => handleFeatureClick('integrate')} style={{ cursor: 'pointer' }}>
                <div className="feature-number">01</div>
                <h3>🔌 Integrate</h3>
                <p>Hướng dẫn tích hợp `@momo-platform/cornerstone-native` vào Mini App với props, ví dụ thực tế, và phiên bản tương thích.</p>
              </div>

              {/* <div className="feature-box" onClick={() => handleFeatureClick('api')} style={{ cursor: 'pointer' }}>
                <div className="feature-number">02</div>
                <h3>📡 API Reference</h3>
                <p>Tham chiếu API chi tiết để lấy layout từ hệ thống, tất cả các phiên bản được hỗ trợ.</p>
              </div> */}

              <div className="feature-box" onClick={() => handleFeatureClick('sdui')} style={{ cursor: 'pointer' }}>
                <div className="feature-number">03</div>
                <h3>🎨 SDUI Builder</h3>
                <p>Tạo & quản lý dataSchema cho Server-Driven UI. Bao gồm builder trực quan, templates có sẵn, và AI generator.</p>
              </div>

              <div className="feature-box" onClick={() => handleFeatureClick('tools')} style={{ cursor: 'pointer' }}>
                <div className="feature-number">04</div>
                <h3>🛠️ Flow Tools</h3>
                <p>Quản lý flow rules giữa native/React Native, xuất JSON config, và đóng gói Figma plugin tự động.</p>
              </div>

              <div className="feature-box" onClick={() => handleFeatureClick('changelog')} style={{ cursor: 'pointer' }}>
                <div className="feature-number">05</div>
                <h3>📖 Documentation</h3>
                <p>Lịch sử version, changelog chi tiết, hướng dẫn, và tất cả tài liệu cần thiết.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Formats */}
        <section className="intro-section">
          <div className="section-container">
            <h2>Định dạng được hỗ trợ</h2>
            <p className="section-intro">
              Native view hiện hỗ trợ các định dạng CNS-built. Widgets do bên thứ ba tự build không được hỗ trợ.
            </p>

            {/* 📺 Ads Templates */}
            <div style={{ marginBottom: '60px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>📺 Ads Templates</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {[
                  { icon: '🏠', name: 'Masthead Banner', desc: 'Full width header', file: null, folder: null },
                  { icon: '📋', name: 'Half Banner', desc: '50% width', file: 'half_banner.png', folder: 'ads' },
                  { icon: '📌', name: 'Thin Banner', desc: 'Minimal height', file: null, folder: null },
                  { icon: '🎠', name: 'Carousel Banner', desc: 'Scrollable content', file: 'carousel_banner.png', folder: 'ads' },
                  { icon: '💬', name: 'Carousel Message', desc: 'Message carousel', file: null, folder: null },
                  { icon: '📦', name: 'Collection Block', desc: 'Grid collection', file: 'template_collection_block.png', folder: 'widget' },
                  { icon: '🔔', name: 'Floating Icon', desc: 'Fixed position', file: null, folder: null },
                  { icon: '🪟', name: 'Banner', desc: 'Standard banner', file: null, folder: null }
                ].map((item) => (
                  <div
                    key={item.name}
                    onClick={() => item.file && setSelectedTemplate(item)}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      cursor: item.file ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => item.file && (e.currentTarget.style.borderColor = 'var(--primary)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)', e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{item.name}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.desc}
                    </p>
                    {item.file && <div style={{ marginTop: '8px', fontSize: '14px' }}>👁️</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* 🧩 Widget UI Types */}
            <div style={{ marginBottom: '60px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>🧩 Widget UI Types</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {[
                  { icon: 'ℹ️', name: 'Info Widget', desc: 'Information display', file: null, folder: null },
                  { icon: '🗂️', name: 'Collection Block', desc: 'Block collection', file: 'template_collection_block.png', folder: 'widget' },
                  { icon: '⭐', name: 'Rating Widget', desc: 'Star ratings', file: 'template_rating.png', folder: 'widget' },
                  { icon: '📊', name: 'Progress Widget', desc: 'Progress bars', file: 'template_progress.png', folder: 'widget' },
                  { icon: '🖼️', name: 'Image Widget', desc: 'Image display', file: 'template_image.png', folder: 'widget' },
                  { icon: '🎯', name: 'Engage Widget', desc: 'User engagement', file: 'template_engage.png', folder: 'widget' },
                  { icon: '✨', name: 'Info Activation', desc: 'Action prompts', file: 'template_info_activation.png', folder: 'widget' },
                  { icon: '💡', name: 'Insight Widget', desc: 'Insights display', file: 'template_insight.png', folder: 'widget' },
                  { icon: '👥', name: 'Group Widget', desc: 'Group items', file: 'Template_Group_Widget.png', folder: 'widget' },
                  { icon: '🏪', name: 'Service Group', desc: 'Service items', file: 'template_service_group.png', folder: 'widget' },
                  { icon: '🎨', name: 'Server Driven', desc: 'Custom SDUI', file: null, folder: null }
                ].map((item) => (
                  <div
                    key={item.name}
                    onClick={() => item.file && setSelectedTemplate(item)}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      cursor: item.file ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => item.file && (e.currentTarget.style.borderColor = 'var(--primary)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)', e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{item.name}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.desc}
                    </p>
                    {item.file && <div style={{ marginTop: '8px', fontSize: '14px' }}>👁️</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* 📦 SDUI Templates */}
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>📦 SDUI Templates</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                SDUI hỗ trợ 3 template chuyên dụng cho Server-Driven UI rendering:
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {[
                  { icon: '💡', name: 'Insight Widget', desc: 'Hiển thị insights & data', file: 'template_insight.png', folder: 'widget' },
                  { icon: '📲', name: 'Promotion Horizontal Full', desc: 'Promo full-width horizontal', file: 'Horizontal_Full.png', folder: "sdui" },
                  { icon: '🎁', name: 'Promotion Non-Des', desc: 'Promo không mô tả', file: "Horizontal_non_des.png", folder: "sdui" }
                ].map((item) => (
                  <div
                    key={item.name}
                    onClick={() => item.file && setSelectedTemplate(item)}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      cursor: item.file ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => item.file && (e.currentTarget.style.borderColor = 'var(--primary)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)', e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{item.name}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                      {item.desc}
                    </p>
                    {item.file && <div style={{ marginTop: '8px', fontSize: '14px' }}>👁️</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="intro-section intro-section-alt">
          <div className="section-container">
            <h2>Hỗ trợ & Team</h2>

            <div className="support-grid">
              <div className="support-card">
                <h4>👨‍💻 App Team</h4>
                <p className="text-muted">tuan.pham1, phuong.tran18</p>
              </div>

              <div className="support-card">
                <h4>📊 Product Owner</h4>
                <p className="text-muted">hien.nguyen14, linh.vu1</p>
              </div>

              <div className="support-card">
                <h4>🛠️ Platform Support</h4>
                <p className="text-muted">huong.vu4, phuong.do2</p>
              </div>
            </div>

            <div className="support-note">
              📝 <strong>Vui lòng lên kế hoạch tích hợp</strong> trên bảng Cornerstone – Features trước khi bắt đầu để chúng tôi có thể sắp xếp resources một cách hiệu quả.
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="intro-cta">
          <div className="cta-content">
            <h2>Sẵn sàng bắt đầu?</h2>
            <p>Khám phá tài liệu của chúng tôi và xây dựng những trải nghiệm tuyệt vời với Cornerstone</p>

            <div className="cta-buttons">
              <Link to="/docs" className="btn btn-primary btn-lg">
                📚 Đọc tài liệu
              </Link>
              <Link to="/dashboard" className="btn btn-outline btn-lg">
                🎯 Mở công cụ
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              cursor: 'default',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTemplate(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--bg-secondary)',
                border: 'none',
                borderRadius: '6px',
                width: '36px',
                height: '36px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.target.style.background = 'var(--border)')}
              onMouseLeave={(e) => (e.target.style.background = 'var(--bg-secondary)')}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
              {selectedTemplate.icon} {selectedTemplate.name}
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
              {selectedTemplate.desc}
            </p>

            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
              }}
            >
              <img
                src={`/assets/${selectedTemplate.folder}/${selectedTemplate.file}`}
                alt={selectedTemplate.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
