# SDUI Placeholder Images Guide

How to use placeholder images and icons in SDUI previews.

---

## Overview

The SDUI preview automatically generates SVG placeholder images for:
- Image components with empty or invalid URLs
- Icon components
- Missing image values

This allows you to preview SDUI designs even before images are ready.

---

## Automatic Placeholder Generation

### Image Components

When an image component has no URL or invalid URL:

```json
{
  "type": "image",
  "style": {
    "width": 100,
    "height": 100,
    "cornerRadius": 8
  },
  "property": {
    "contentMode": "fill"
  },
  "value": ""  // ← Empty or invalid URL
}
```

The preview renderer automatically generates:

```
Generated SVG Placeholder
├─ Background: #f0f0f3 (light gray)
├─ Icon: Momo pink circle + elements (#a50064)
└─ Text: Width × Height dimensions
```

**Size:** Matches `style.width` and `style.height`

### Icon Components (Dialect B)

Icon components render as SVG placeholders:

```json
{
  "componentType": "ICON",
  "iconSize": 24,
  "field": "promotion_icon"
}
```

Renders as:
```
SVG placeholder icon
├─ Size: 24×24 px
├─ Background: #f0f0f3
└─ Border radius: 6px
```

---

## Using Real Images

### HTTPS URLs (Recommended)

```json
{
  "type": "image",
  "style": { "width": 52, "height": 52 },
  "property": { "contentMode": "fill" },
  "value": "https://cdn.example.com/image.webp"
}
```

### SVG Data URLs (For Previews)

Encode SVG as data URL:

```json
{
  "type": "image",
  "style": { "width": 52, "height": 52 },
  "property": { "contentMode": "fill" },
  "value": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0i..."
}
```

**How to create:**

1. Create SVG file
2. Base64 encode it
3. Prepend `data:image/svg+xml;base64,`

```bash
# Bash example
base64 -i image.svg | tr -d '\n' | sed 's/^/data:image\/svg+xml;base64,/'
```

### Data URL Generator

JavaScript:
```javascript
function createDataUrl(svgString) {
  return 'data:image/svg+xml;base64,' + btoa(svgString);
}

const svg = '<svg width="52"...></svg>';
const url = createDataUrl(svg);
```

---

## Placeholder Icon Styles

The SDUI preview generates placeholder SVG with these elements:

### Standard Placeholder

```svg
<svg width="200" height="200">
  <!-- Background -->
  <rect fill="#f0f0f3" width="200" height="200" />
  
  <!-- Icon (circle + elements) -->
  <circle cx="100" cy="80" r="30" fill="#a50064" />
  <path d="M 60 120 L 140 120" stroke="#a50064" stroke-width="2" />
  <circle cx="50" cy="90" r="8" fill="#a50064" />
  
  <!-- Dimensions text -->
  <text x="100" y="170" text-anchor="middle" font-size="14" fill="#999">
    200×200
  </text>
</svg>
```

### Colors Used

- **Background**: `#f0f0f3` (light gray)
- **Icon**: `#a50064` (MoMo pink)
- **Text**: `#999999` (medium gray)

---

## Best Practices

### ✅ DO:

1. **Use HTTPS URLs for production**
   ```json
   "value": "https://cdn.example.com/logo.webp"
   ```

2. **Use SVG data URLs for design previews**
   ```json
   "value": "data:image/svg+xml;base64,PHN2ZyB..."
   ```

3. **Specify dimensions explicitly**
   ```json
   "style": { "width": 52, "height": 52 }
   ```

4. **Use cornerRadius for consistent look**
   ```json
   "style": { "cornerRadius": 26 }
   ```

5. **Set contentMode appropriately**
   ```json
   "property": { "contentMode": "fill" }  // for thumbnails
   "property": { "contentMode": "contain" }  // for logos
   ```

### ❌ DON'T:

1. **Don't use `http://` (use HTTPS)**
   ```json
   "value": "http://example.com/image.png"  // ❌
   ```

2. **Don't hardcode local file paths**
   ```json
   "value": "/Users/john/image.png"  // ❌
   ```

3. **Don't use overly large image URLs**
   ```json
   "value": "https://cdn.example.com/4k-high-res-8mb.png"  // ❌
   ```

4. **Don't leave images with mismatched aspect ratios**
   ```json
   {
     "style": { "width": 100, "height": 100 },
     "value": "https://...image-16x9.jpg"  // ❌ Mismatch
   }
   ```

---

## Preview Fallback Behavior

### Image Load Flow

```
1. Try loading image from URL
   ↓
2. If load fails → Use placeholder SVG
   ↓
3. Placeholder displays dimensions
```

### Error Handling

When image fails to load:
- Placeholder SVG is automatically generated
- Size matches `style.width` × `style.height`
- No error message shown to user
- Seamless preview experience

---

## Common Image Dimensions

### Thumbnails
```json
{
  "style": { "width": 48, "height": 48, "cornerRadius": 24 }
}
// Generated: 48×48 placeholder
```

### Small Icons
```json
{
  "style": { "width": 24, "height": 24, "cornerRadius": 4 }
}
// Generated: 24×24 placeholder
```

### Card Images
```json
{
  "style": { "width": 280, "height": 200, "cornerRadius": 12 }
}
// Generated: 280×200 placeholder
```

### Full Width
```json
{
  "style": { "width": 375, "height": 240, "cornerRadius": 8, "fillMaxWidth": true }
}
// Generated: 375×240 placeholder (responsive)
```

---

## Placeholder Sizes Reference

| Use Case | Width | Height | Radius | Generated Size |
|----------|-------|--------|--------|---|
| Avatar | 48 | 48 | 24 | 48×48 |
| Icon | 24 | 24 | 4 | 24×24 |
| Small card | 120 | 120 | 8 | 120×120 |
| Banner | 375 | 200 | 12 | 375×200 |
| Full width | 375 | 240 | 8 | 375×240 |
| Large promo | 300 | 300 | 16 | 300×300 |

---

## Creating Custom SVG Placeholders

### Simple Circle Icon

```xml
<svg width="52" height="52" xmlns="http://www.w3.org/2000/svg">
  <circle cx="26" cy="26" r="26" fill="#f0f0f3"/>
  <circle cx="26" cy="20" r="8" fill="#a50064"/>
  <path d="M 12 36 L 40 36" stroke="#a50064" stroke-width="2"/>
</svg>
```

### Base64 Encode

```bash
echo '<svg...></svg>' | base64 | tr -d '\n'
# Output: PHN2ZyB3aWR0aD0i...
```

### Use in JSON

```json
{
  "type": "image",
  "value": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0i..."
}
```

---

## Troubleshooting

### Image not showing

**Problem:** Image URL returns 404

**Solution:** 
- Check URL is accessible
- Use `https://` not `http://`
- Preview will use placeholder SVG

### Image looks wrong

**Problem:** Aspect ratio mismatch

**Solution:**
- Ensure width/height match image aspect ratio
- Or set `contentMode` to "fit" to preserve aspect ratio

### Placeholder SVG too simple

**Problem:** Want custom icon placeholder

**Solution:**
- Create custom SVG
- Base64 encode it
- Use as data URL in `value`

### Images not loading in preview

**Problem:** CORS or connectivity issue

**Solution:**
- Use same-origin URLs
- Or create SVG data URLs for testing
- Preview falls back to placeholder

---

## Examples

### Promotion Card with Placeholder

```json
{
  "type": "container",
  "style": {
    "backgroundColor": "#FFFFFF",
    "cornerRadius": 12,
    "padding": { "all": 12 },
    "fillMaxWidth": true
  },
  "property": { "layout": "row", "spacing": 12 },
  "value": {
    "children": [
      {
        "type": "image",
        "style": { "width": 52, "height": 52, "cornerRadius": 26 },
        "property": { "contentMode": "fill" },
        "value": ""  // ← Will use placeholder
      },
      {
        "type": "text",
        "property": { "typography": "headerSSemibold" },
        "value": "Promotion Title"
      }
    ]
  }
}
```

Preview renders as:
```
┌─────────────────────────────────┐
│  [🔷 Placeholder]  Promotion   │
│  52×52 SVG icon                 │
└─────────────────────────────────┘
```

### With Real Image

```json
{
  "value": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTIiIGhlaWdodD0iNTIi..."
}
```

Or production:

```json
{
  "value": "https://static.momocdn.net/app/icon/promotion/logo.png"
}
```

---

## Version History

- **v1.0** (2026-07-14): SVG placeholder generation for images/icons

---

**Status:** Ready for production ✅
