# SDUI `image`

| | |
|---|---|
| **Spec** | [../sdui-spec.md](../sdui-spec.md) §6.2 |
| **Android** | `ServerDrivenUI/UITypes/Image/ServerImage.kt`, `ServerImageProperty.kt` (Coil `AsyncImage`) |
| **iOS** | `ios/ServerDrivenUI/UITypes/Image/ServerImage.swift`, `ServerImageProperty.swift` (`ImageCached`) |
| **Phần chung** | node, style, tracking, onTap: [README.md](README.md) |

Hiển thị ảnh tải từ URL (png, jpg, webp, gif).

## 1. Interface

```ts
type ImageNode = SduiNode<"image", ImageProperty, string>;   // value = URL ảnh

interface ImageProperty {
  contentMode?: "fit" | "fill" | "scaleAspectFill";
  tintColor?: string;
  cornerRadius?: number;
  aspectRatio?: number;
}
```

## 2. Field

### `value`
| Kiểu | Bắt buộc | Thiếu / sai kiểu |
|---|---|---|
| `string` URL | ✅ | Android: không có ảnh. **iOS: node bị bỏ** |

### `property`
| Field | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `contentMode` | string | `fit` | `fit`: thu nhỏ cho vừa khung, giữ tỉ lệ (CSS `contain`). `fill` / `scaleAspectFill`: phủ kín khung, cắt phần thừa (CSS `cover`) |
| `tintColor` | `#RRGGBB` | không | Tô **toàn bộ** phần không trong suốt bằng một màu (dùng cho icon đơn sắc) |
| `cornerRadius` | số | `0` | Bo góc riêng ảnh, nằm bên trong `style` |
| `aspectRatio` | số (`width / height`) | không | Khung giữ tỉ lệ này |

⚠️ iOS decode `property` chặt: field sai kiểu → **cả node bị bỏ**.

## 3. Cách vẽ

- Kích thước lấy từ `style.width` / `style.height`. **Không đặt size thì ảnh lấy kích thước thật sau khi tải**, khác nhau
  giữa 2 nền tảng và làm layout nhảy. Luôn đặt size (hoặc `width` + `aspectRatio`).
- Không có placeholder hay ảnh lỗi riêng: lúc đang tải hoặc tải lỗi thì khung trống (vẫn giữ size nếu có `style`).
- `style.cornerRadius` bo cả khung (nền, viền); `property.cornerRadius` chỉ bo ảnh.

## 4. Khác biệt Android ↔ iOS

| Vùng | Android | iOS | Khuyến nghị |
|---|---|---|---|
| Không có `style` size | kích thước ảnh (Coil) | kích thước ảnh (ImageCached) | luôn đặt size |
| `value` thiếu / sai kiểu | khung trống | node bị bỏ | luôn gửi URL |
| field sai kiểu | bỏ field | node bị bỏ | gửi đúng kiểu |
| `tintColor` không parse được (D36) | không tô | tô trong suốt → **ảnh mất** | gửi `#RRGGBB` đúng |
| `aspectRatio` cùng `width` + `height` | bỏ qua `aspectRatio` | giữ tỉ lệ, căn giữa khung | chỉ gửi 1 trong 2 |

## 5. Ví dụ

Logo vuông bo góc:
```json
{ "type": "image", "value": "https://static.momocdn.net/app/img/promotion/demandtree/highlands.png",
  "style": { "width": 48, "height": 48 }, "property": { "contentMode": "fit", "cornerRadius": 8 } }
```

Banner phủ kín, tỉ lệ 16:9, rộng hết:
```json
{ "type": "image", "value": "https://static.momocdn.net/…/banner.png",
  "style": { "fillMaxWidth": true }, "property": { "contentMode": "fill", "aspectRatio": 1.78 } }
```

Icon đơn sắc tô màu hồng:
```json
{ "type": "image", "value": "https://static.momocdn.net/…/ic_arrow.png",
  "style": { "width": 16, "height": 16 }, "property": { "tintColor": "#A50064" } }
```

## 6. Lỗi thường gặp

- [ ] Không đặt `style.width` / `height` → layout nhảy khi ảnh tải xong.
- [ ] Dùng `tintColor` cho ảnh màu (ảnh chụp, logo nhiều màu) → bị tô thành một mảng màu.
- [ ] `aspectRatio` gửi dạng `"16:9"` → Android bỏ qua, iOS mất node. Gửi số (`1.78`).
