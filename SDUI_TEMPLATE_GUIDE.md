# SDUI Template JSON Generation Guide

Hướng dẫn chi tiết để tạo SDUI template JSON từ Figma plugin, sao cho preview trên web giống hoàn toàn với native app.

---

## 1. Overall Structure

```json
{
  "lazy_loads": [
    {
      "type": "server_driven_widget",
      "block_id": "unique_block_identifier",
      "data": [
        {
          "type": "template_widget",
          "templateType": "SDUI_WIDGET",
          "data": [/* Component structure */]
        }
      ]
    }
  ],
  "first_loads": []
}
```

### Key Fields:
- **lazy_loads**: Array chứa widgets được render (required)
- **block_id**: Unique identifier, dùng để matching khi update mock data
- **type**: "server_driven_widget" hoặc "template_widget"
- **templateType**: Luôn là "SDUI_WIDGET"
- **data**: Array chứa root component(s)

---

## 2. Component Types & Structure

### 2.1 Container (Layout)
Dùng để nhóm các components và định nghĩa layout.

```json
{
  "type": "container",
  "style": {
    "backgroundColor": "#FFFFFF",
    "cornerRadius": 12,
    "padding": {
      "all": 16,
      // hoặc: "top": 12, "left": 16, "right": 16, "bottom": 12
    },
    "width": 351,           // fixed width (optional)
    "height": 200,          // fixed height (optional)
    "fillMaxWidth": true,   // stretch to parent width
    "fillMaxHeight": true   // stretch to parent height
  },
  "property": {
    "layout": "column",     // "row" | "column" | "scrollRow"
    "spacing": 8,           // gap between children
    "alignment": "center"   // "start" | "center" | "end" | "spaceBetween"
  },
  "value": {
    "children": [
      /* nested components */
    ]
  }
}
```

### 2.2 Text
Hiển thị text content.

```json
{
  "type": "text",
  "style": {},
  "property": {
    "typography": "headerDefaultBold",  // typography style
    "color": "#303233",                 // text color
    "lineLimit": 1                      // max lines (-1 = unlimited)
  },
  "value": "Display Text Here"
}
```

**Typography Options:**
- `headerDefaultBold` - Bold header (20px)
- `headerSSemibold` - Semi-bold header (16px)
- `actionSBold` - Action semi-bold (14px)
- `labelXsMedium` - Small label (12px)
- `descriptionDefaultRegular` - Regular description (14px)
- `labelXsMedium` - Extra small label (11px)

### 2.3 Image
Hiển thị hình ảnh từ URL hoặc SVG data URL.

```json
{
  "type": "image",
  "style": {
    "width": 52,            // width (px) or -1 for max
    "height": 52,           // height (px) or -1 for max
    "cornerRadius": 26      // rounded corners
  },
  "property": {
    "contentMode": "fill"   // "fill" | "fit" | "center"
  },
  "value": "https://example.com/image.png"
  // OR use SVG data URL for preview/placeholder:
  // "value": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0i..."
}
```

**Note:** 
- Prefer HTTPS URLs for production
- SVG data URLs work for previews and placeholder images
- Web preview generates placeholder SVG if URL is invalid or empty

### 2.4 Button
Interactive button element.

```json
{
  "type": "button",
  "style": {},
  "property": {
    "ctaType": "BUTTON",    // "BUTTON" | "TEXT" | "ICON"
    "color": "#303233"      // button text color
  },
  "value": {
    "title": "Click Here",
    "type": "primary"       // "primary" | "secondary"
  }
}
```

### 2.5 Spacer
Empty space untuk layout control.

```json
{
  "type": "spacer",
  "style": {},
  "property": {},
  "value": ""
}
```

---

## 3. Complete Example: Promotion Card

```json
{
  "lazy_loads": [
    {
      "type": "server_driven_widget",
      "block_id": "promotion_card_001",
      "data": [
        {
          "type": "template_widget",
          "templateType": "SDUI_WIDGET",
          "data": [
            {
              "type": "container",
              "style": {
                "backgroundColor": "#FFFFFF",
                "cornerRadius": 12,
                "padding": { "all": 12 },
                "fillMaxWidth": true
              },
              "property": {
                "layout": "row",
                "spacing": 12,
                "alignment": "center"
              },
              "value": {
                "children": [
                  {
                    "type": "image",
                    "style": {
                      "width": 52,
                      "height": 52,
                      "cornerRadius": 26
                    },
                    "property": { "contentMode": "fill" },
                    "value": "https://static.momocdn.net/app/icon/promotion/logo_mega26.png"
                  },
                  {
                    "type": "container",
                    "style": { "fillMaxWidth": true },
                    "property": {
                      "layout": "column",
                      "spacing": 2
                    },
                    "value": {
                      "children": [
                        {
                          "type": "text",
                          "property": {
                            "typography": "headerSSemibold",
                            "color": "#303233",
                            "lineLimit": 1
                          },
                          "value": "Promotion Title"
                        },
                        {
                          "type": "text",
                          "property": {
                            "typography": "descriptionDefaultRegular",
                            "color": "#727272",
                            "lineLimit": 2
                          },
                          "value": "Promotion description here"
                        }
                      ]
                    }
                  },
                  {
                    "type": "button",
                    "property": {
                      "ctaType": "BUTTON",
                      "color": "#303233"
                    },
                    "value": {
                      "title": "Collect",
                      "type": "primary"
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ],
  "first_loads": []
}
```

---

## 4. Style Properties Reference

### Colors
```
"color": "#RRGGBB"        // Hex color format
"backgroundColor": "#FFF"
```

### Spacing & Sizing
```
"padding": {
  "all": 16               // All sides
  // OR individual:
  "top": 12,
  "left": 16,
  "right": 16,
  "bottom": 12
},
"cornerRadius": 12,
"width": 351,            // Fixed width
"height": 200,           // Fixed height
"fillMaxWidth": true,    // Match parent width
"fillMaxHeight": true    // Match parent height
```

### Layout Properties
```
"property": {
  "layout": "column",         // "row" | "column" | "scrollRow"
  "spacing": 8,               // Gap between children
  "alignment": "center"       // Vertical/Horizontal alignment
}
```

### Typography
```
"property": {
  "typography": "headerDefaultBold",
  "color": "#303233",
  "lineLimit": 1              // -1 = unlimited
}
```

---

## 5. Web Preview Implementation Guidelines

### 5.1 Container Mapping
```
Native: container (layout: "column")
Web:    CSS flexbox (flex-direction: column)

Native: container (layout: "row")
Web:    CSS flexbox (flex-direction: row)

Native: spacing: 8
Web:    gap: 8px
```

### 5.2 Text Mapping
```
Native: typography: "headerDefaultBold"
Web:    font-weight: 700, font-size: 20px

Native: lineLimit: 1
Web:    overflow: hidden, text-overflow: ellipsis, white-space: nowrap
```

### 5.3 Image Mapping
```
Native: width: 52, height: 52, cornerRadius: 26
Web:    width: 52px, height: 52px, border-radius: 26px
        object-fit: cover (for contentMode: "fill")
```

### 5.4 Color System
```
Primary: #A50064 (MoMo brand pink)
Text Dark: #303233
Text Light: #727272
Background: #FFFFFF
Gray BG: #F5F5F5
```

---

## 6. Best Practices

### ✅ DO:
- Sử dụng `fillMaxWidth: true` để responsive layout
- Nhóm components logically trong containers
- Dùng consistent typography cho similar elements
- Tối ưu image size (sử dụng small URLs)
- Keep padding/spacing consistent (multiples of 4)

### ❌ DON'T:
- Hardcode fixed width/height (trừ khi cần thiết)
- Nest containers quá sâu (max 3-4 levels)
- Sử dụng quá nhiều columns trên một row
- Dùng image urls có kích thước lớn
- Bỏ qua cornerRadius cho cards/buttons

---

## 7. Responsive Design Guidelines

### Mobile (360px width)
```json
{
  "type": "container",
  "style": {
    "fillMaxWidth": true,
    "padding": { "all": 12 }
  },
  "property": {
    "layout": "column",
    "spacing": 8
  }
}
```

### Tablet (600px+ width)
```json
{
  "type": "container",
  "style": {
    "width": 351,  // Fixed or fillMaxWidth
    "padding": { "all": 16 }
  },
  "property": {
    "layout": "row",
    "spacing": 12
  }
}
```

---

## 8. Testing Checklist

- [ ] JSON valid (no syntax errors)
- [ ] block_id is unique
- [ ] All image URLs accessible
- [ ] Text content is translated
- [ ] Colors match brand guidelines
- [ ] Spacing consistent (multiples of 4/8)
- [ ] Layout responsive on mobile & tablet
- [ ] Buttons clickable with proper styling
- [ ] No missing required fields in components

---

## 9. Export from Figma Plugin

### Figma to JSON Mapping:
```
Figma Frame → container
Figma Text → text
Figma Image → image
Figma Button → button
Figma Spacing → spacer

Figma Layer name → identifier/reference
Figma Design properties → style + property objects
```

### Plugin Responsibilities:
1. Extract component hierarchy
2. Convert Figma colors to hex
3. Convert Figma typography to style names
4. Generate unique block_id
5. Wrap in SDUI template structure
6. Validate JSON schema

---

## 10. Common Issues & Solutions

### Issue: Text overlapping on mobile
**Solution:** Reduce font-size, increase lineLimit, or use `fillMaxWidth: true`

### Issue: Image distorted
**Solution:** Ensure width:height ratio matches, use `contentMode: "fill"`

### Issue: Button not clickable
**Solution:** Ensure `type: "button"` with proper `property` and `value`

### Issue: Layout misaligned
**Solution:** Check `alignment` property in container, use `spacer` for spacing

---

## 11. Example Figma Plugin Output

```typescript
// Figma plugin should generate:
const sduiTemplate = {
  lazy_loads: [
    {
      type: "server_driven_widget",
      block_id: generateUniqueId(),  // auto-generate
      data: [
        {
          type: "template_widget",
          templateType: "SDUI_WIDGET",
          data: convertFigmaFrameToComponents(selectedFrame)
        }
      ]
    }
  ],
  first_loads: []
};

// Export as JSON
exportAsJSON(sduiTemplate);
```

---

## 12. Integration with Native App

### Android Flow:
1. User creates design in Figma
2. Plugin exports JSON template
3. RN side: Paste JSON → Modal → Update
4. Native side: Parse JSON via MockDataProcessor
5. Render with native SDUI renderer

### iOS Flow:
1. Same Figma → JSON process
2. RN side: Paste JSON → Modal → Update
3. Native side: Parse JSON via MockDataHandler
4. Render with native SDUI renderer

---

## 13. Resources

- **Template validator**: Test JSON at `/example/App.js` (Quick Load samples)
- **Native renderer**: iOS `MockDataHandler.swift`, Android `MockDataProcessor.kt`
- **Web preview**: HTML/CSS implementation should match structure above
- **Typography reference**: Check native app constants

---

## Versioning

- **v1.0** (2026-07-14): Initial SDUI template specification
- **Format**: JSON
- **Compatibility**: React Native + iOS/Android native renderers
