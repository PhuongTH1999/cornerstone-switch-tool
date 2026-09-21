# Figma JSON → SDUI template

Bắt đầu từ thiết kế Figma: xem [hướng dẫn từng bước qua MoMo Design](figma-import-guide.md).

Mở SDUI → **Figma migration**, upload hoặc dán JSON export có `meta`, `components`, `body.children`. Đây không phải định dạng Figma REST API hoặc ảnh chụp.

1. Chọn **Convert to SDUI**.
2. Kiểm tra cảnh báo theo đường dẫn node.
3. Cấu hình **Token & asset mapping**, rồi convert lại nếu cần.
4. Xem JSON output. Chấp nhận cảnh báo còn lại để tải bản nháp hoặc mở trong Editor.
5. Kiểm tra preview và chọn Save schema khi đã hoàn thiện. Convert không gọi API hoặc tự lưu template.

## Mapping

```json
{
  "tokens": {},
  "assets": {},
  "assetBaseUrl": "https://your-asset-host.example"
}
```

- `tokens`: key là tên như `Spacing.S`, `Radius.M`, `Colors.black_01`; mặc định đã dùng bộ Colors/Spacing/Radius MoMo trong `src/lib/designTokens.ts`. Giá trị truyền vào ghi đè mặc định. Spacing/radius cần number.
- `assets`: key là URL ảnh nguồn hoặc đường dẫn node chính xác từ cảnh báo, value là URL HTTP(S). Với SVG, export ảnh lên asset host rồi map theo đường dẫn node.
- `assetBaseUrl`: dùng giải quyết đường dẫn tương đối như `/api/projects/...`; không mặc định dùng domain frontend.

Token chưa biết bị bỏ field và báo cảnh báo. Asset thiếu dùng `https://placehold.co/84x84/png` và báo cảnh báo. URL ảnh tải lỗi cũng dùng placeholder trong preview. Placeholder là PNG online minh họa; thay bằng ảnh nghiệp vụ hoặc CDN của team trước khi phát hành. Đây là bản nháp cần hoàn thiện, không đảm bảo pixel-perfect.

## Chuyển đổi

- `View` → container; `ScrollView` → scrollRow/scrollColumn.
- Custom component tham chiếu theo componentSetKey hoặc type → mở rộng definition; instance props/styles ghi đè definition.
- `Text` → text, snake_case typography → token camelCase tương ứng.
- `Image` → image; `Button` → button; `Tag` → tag; `Spacer` → spacer.
- `Title` → container gồm text tiêu đề/mô tả.
- `Svg/Path` → vị trí image cần URL thay thế; không suy luận path thành text hoặc action.
- Definition không được body tham chiếu sẽ không xuất thành UI.
- Props/styles chưa map, header hiển thị, footer, overlays, tabs, tracking/localization/actions cấp màn hình được báo để xử lý thủ công.

Output: `{ "type": "template_widget", "templateType": "SDUI_WIDGET", "data": [root] }`.

## Kiểm thử

`tests/figmaMigration.test.ts` dùng fixture JSON mẫu trong `tests/fixtures/figma-template.json` để kiểm tra reference, typography, token/asset mapping, cảnh báo SVG, button và vòng lặp component.

```sh
./node_modules/.bin/esbuild tests/figmaMigration.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/figma-migration-test.cjs
node --test /tmp/figma-migration-test.cjs
```

## Màu nền và shadow

SDUI import cũng resolve token trong style/property/modifier trước khi đưa vào editor. `Colors.black_01` thành `#ffffff` cho nền trắng cả trong theme tối. Không tự thêm nền trắng vào node vốn không khai báo backgroundColor.

Giá trị Shadow.Dark/Light/Pink đã lưu riêng theo iOS/Android trong `SHADOW_TOKENS`; chưa xuất shadow/elevation vì contract SDUI chung chưa có field tương ứng. Các style chưa hỗ trợ vẫn báo cảnh báo.

Copy/Download/Save và Export Native chuyển các đường dẫn placeholder cũ sang URL PNG online. Các asset tương đối khác được resolve theo `VITE_PUBLIC_ASSET_URL` hoặc origin của tool.
