# Mini App SDUI preview

QR mở Mini App bằng deep link:

```text
momo://action=marketing&refId=cornerstone_sdui&featureCode=cornerstone_sdui&params=<encoded JSON>
```

Sau khi decode, `params` có dạng:

```json
{
  "templateId": "284a39cc-5e88-418a-bc23-d500c4e61837"
}
```

## Luồng xử lý

1. Mini App đọc `templateId` từ launch params.
2. Kiểm tra ID tồn tại và đúng định dạng UUID.
3. Gọi `GET /api/cornerstone-package/sdui/templates/{templateId}/json` trên API environment của Mini App.
4. Kiểm tra HTTP status và contract `template_widget / SDUI_WIDGET`.
5. Đưa JSON hợp lệ vào SDUI renderer native để hiển thị preview.
6. Hiển thị loading trong lúc tải và error/retry khi timeout, mất mạng, 401/403, 404 hoặc JSON không hợp lệ.

Mini App phải dùng API base URL theo environment riêng; không lấy URL API từ QR.

## Ví dụ TypeScript/React Native

```tsx
const API_BASE_URL = 'https://yepswakp3nxo4qoeynn74xhnt40wqlia.lambda-url.us-east-1.on.aws/api';

function parseTemplateId(params: unknown): string {
  const value = typeof params === 'string' ? JSON.parse(params) : params;
  const templateId = (value as { templateId?: unknown })?.templateId;

  if (typeof templateId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(templateId)) {
    throw new Error('Invalid templateId');
  }
  return templateId;
}

async function loadTemplate(templateId: string, accessToken?: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `${API_BASE_URL}/cornerstone-package/sdui/templates/${encodeURIComponent(templateId)}/json`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      },
    );

    if (!response.ok) throw new Error(`Template API returned HTTP ${response.status}`);

    const raw = await response.json();
    const payload = raw?.data ?? raw?.result ?? raw?.template ?? raw;
    const schema = payload?.json ?? payload?.schema ?? payload?.tree ?? payload;

    if (schema?.type !== 'template_widget' || schema?.templateType !== 'SDUI_WIDGET' || !Array.isArray(schema?.data)) {
      throw new Error('Invalid SDUI template response');
    }
    return schema;
  } finally {
    clearTimeout(timer);
  }
}
```

Phần render cuối cùng cần dùng component SDUI native thực tế của Mini App. Không render response trước khi validation thành công; một enum layout hoặc component type không được native hỗ trợ có thể làm app lỗi.

## Trạng thái UI tối thiểu

- Loading: activity indicator trong lúc gọi API.
- Success: render JSON SDUI trả về.
- Not found: thông báo template không tồn tại hoặc đã bị xóa.
- Unauthorized: yêu cầu đăng nhập/lấy lại token nếu endpoint được bảo vệ.
- Timeout/network: hiện nút thử lại; timeout đề xuất 5 giây.
- Invalid schema: chặn render và ghi log `templateId` để truy vết.

