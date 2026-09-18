import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import schemaReference from '../../sdui-json-schema.md?raw'

const editorReference = `# Hỗ trợ trong SDUI Editor

Tra cứu cấu trúc JSON, component, property, style và ví dụ ở các mục bên trái. Nội dung schema lấy từ tài liệu SDUI trong repository; mức hỗ trợ trên app phụ thuộc phiên bản native.

## 6 component type

| Type | Nội dung (value) | Chỉnh trong bảng thuộc tính |
| --- | --- | --- |
| container | Object có children: mảng node con | layout, spacing, alignment, arrangement |
| text | String | typography, color, lineLimit, textAlignment |
| image | String URL | contentMode, tintColor, aspectRatio, kích thước, cornerRadius |
| button | Object: title, type, iconLeft, iconRight | ctaType, color, actionType, actions[0].featureCode |
| tag | String | tagType, backgroundColor, textColor, iconUrl |
| spacer | Chuỗi rỗng | minLength |

**Tag:** import, chỉnh sửa và preview đã có; menu Add hiện chưa có tùy chọn tag.

## Style và cấu trúc chung

- Node có type, style, property và value. Tên node trong editor được xuất thành property.id.
- Style gồm backgroundColor, cornerRadius, padding, border, width, height, fillMaxWidth, fillMaxHeight. Xem mục style để biết kiểu dữ liệu và ví dụ.
- modifier.weight xác định phần không gian được chia trong layout. Dữ liệu modifier sẵn có được giữ khi import/export.
- Editor lưu lại các field của node gốc khi import, gồm onTap, trackTypes, widgetId, expire_time; các field này chưa có form chỉnh riêng. Sửa bằng JSON trước khi import.
- Dùng tab Editor để xem JSON xuất ra; không dùng các field nội bộ như nativeStyle, nativeProperty hoặc source làm schema gửi cho native.

## Preview web và runtime native

| Chức năng | Mức hỗ trợ trong preview web hiện tại |
| --- | --- |
| Container | Layout hàng/cột, cuộn, spacing, alignment và arrangement |
| Text | Typography, màu chữ, lineLimit, textAlignment |
| Image | URL, kích thước, contentMode, cornerRadius; tintColor/aspectRatio có form nhưng preview chưa mô phỏng đầy đủ |
| Button | Tiêu đề, kiểu nút và icon; không thực thi actions hoặc mô phỏng đầy đủ TOGGLE/ICON |
| Tag | Nội dung, preset màu và màu tùy chỉnh; iconUrl chưa được render trong preview |
| Spacer | Khoảng trống co giãn; cần kiểm tra minLength trên native |
| onTap / tracking / expire_time | Giữ dữ liệu khi import/export; preview không thực thi hành vi native này |

Preview dùng CSS trên trình duyệt. Màu alpha, typography và kích thước có thể khác app native; hãy kiểm tra trên app trước khi phát hành.

## Lưu ý về validator cũ

Validator/plugin converter trong repository hiện chỉ khai báo 5 type (chưa có tag), layout chưa khai báo scrollColumn và danh sách property/style hẹp hơn editor. Cảnh báo từ validator cũ không phải bảng hỗ trợ đầy đủ của native.

## Cách tra cứu

1. Chọn mục schema hoặc component ở danh sách bên trái.
2. Xem value, các property, style và enum trong ví dụ JSON.
3. Các block jsonc có comment hoặc dấu ... là minh họa; bỏ comment và thay ... bằng dữ liệu thật trước khi import JSON.
4. Mục Tracking, onTap, expire_time và ví dụ đầy đủ mô tả các cấu hình bổ sung.
`

const sections = [
  { id: 'editor', title: 'Tổng quan & hỗ trợ editor', content: editorReference },
  ...schemaReference.split(/(?=^#{2,3} )/m).filter(part => /^#{2,3} /m.test(part)).map((content, index) => ({
    id: `schema-${index}`,
    title: content.split('\n')[0].replace(/^#+\s*/, '').replace(/`/g, ''),
    content,
  })),
]

export default function SDUIDocumentation() {
  const [selected, setSelected] = useState('editor')
  const [query, setQuery] = useState('')
  const current = sections.find(section => section.id === selected) || sections[0]
  const matches = sections.filter(section => `${section.title} ${section.content}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  return <section className="sdui-documentation sdui-wide-card" aria-label="SDUI documentation">
    <aside className="sdui-doc-sidebar sdui-card">
      <h2>SDUI Document</h2>
      <label className="sdui-label">Tìm component, props hoặc style<input type="search" placeholder="Ví dụ: button, padding, onTap…" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <nav aria-label="Mục lục SDUI">
        {matches.map(section => <button key={section.id} type="button" aria-current={selected === section.id ? 'page' : undefined} onClick={() => setSelected(section.id)}>{section.title}</button>)}
        {!matches.length && <p className="sdui-muted">Không có mục phù hợp.</p>}
      </nav>
    </aside>
    <article className="sdui-doc-content sdui-card" key={current.id}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{current.content}</ReactMarkdown>
    </article>
  </section>
}
