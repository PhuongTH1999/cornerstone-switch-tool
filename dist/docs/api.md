# 🛰️ API Reference

> Các endpoint phục vụ tích hợp Cornerstone. Hiện tài liệu hoá **API v5** (lấy layout app).

---

## API v5 — Get App Layout

Trả về layout/nội dung CNS cho một `ref_id` cụ thể theo ngữ cảnh user & thiết bị.

**Endpoint (dev):**

```
POST https://m.dev.mservice.io/cornerstone-portal-app/internal/v1/app
```

### Request example

```bash
curl --location 'https://m.dev.mservice.io/cornerstone-portal-app/internal/v1/app' \
--header 'Content-Type: application/json' \
--data '{
    "userID": "0971897577",
    "agent_id": 35759469,
    "ref_id": "HomeExpense_Utilities",
    "service_id": "",
    "devicePerformance": "high-end",
    "app_version": 41092,
    "app_code": "4.1.9",
    "version": "0.1.14-rc-55.2",
    "device_os": "IOS",
    "lang": "vi",
    "session": "e9457a4f1072ed2104a8ad0179b7e2892aaf92b89a80943e6678c301cb570833"
}'
```

### Tham số request

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `userID` | string | ID người dùng. |
| `agent_id` | number | Agent ID. |
| `ref_id` | string | Tham chiếu vị trí/nội dung CNS cần lấy. |
| `service_id` | string | Service ID (có thể rỗng). |
| `devicePerformance` | string | Phân loại hiệu năng thiết bị: `high-end` / `low-end`. |
| `app_version` | number | Mã version app (build number). |
| `app_code` | string | Version app dạng semver (vd `4.1.9`). |
| `version` | string | Version package/SDK. |
| `device_os` | string | `IOS` / `ANDROID`. |
| `lang` | string | Ngôn ngữ (`vi` / `en`). |
| `session` | string | Session token của phiên đăng nhập. |
