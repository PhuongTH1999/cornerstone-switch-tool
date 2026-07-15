# SDUI Integration Guide

Hướng dẫn đầy đủ để tích hợp SDUI rendering từ Figma design sang native app.

---

## Overview

SDUI (Server-Driven UI) là system cho phép định nghĩa UI components dưới dạng JSON schema, có thể render trên cả native (iOS/Android) và web.

Project này sử dụng **SDUI Template Format** để:
1. Extract design từ Figma
2. Convert thành JSON theo spec
3. Validate và optimize
4. Export cho native app

---

## Architecture

```
Figma Design
    ↓
src/code.ts (Plugin Entry)
    ↓
src/core/extractor.ts (Extract nodes)
    ↓
src/core/normalizer.ts (Normalize structure)
    ↓
src/renderers/marketing/ (Strategy renderer)
    ├─ mapper.ts (Node → SDUI Component)
    ├─ index.ts (Render pipeline)
    └─ types.ts (Marketing-specific types)
    ↓
src/renderers/sdui/ (SDUI utilities)
    ├─ converter.ts (Wrap in template format)
    ├─ figmaParser.ts (Parse Figma structure)
    ├─ typography.ts (Typography mapping)
    ├─ validator.ts (Template validation)
    └─ index.ts (Module exports)
    ↓
JSON Output → Native App
```

---

## SDUI Template Structure

```json
{
  "lazy_loads": [
    {
      "type": "server_driven_widget",
      "block_id": "marketing_sdui_1234",
      "data": [
        {
          "type": "template_widget",
          "templateType": "SDUI_WIDGET",
          "data": [
            {
              "type": "container",
              "style": { /* styling */ },
              "property": { /* layout props */ },
              "value": { "children": [ /* components */ ] }
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

## Component Types

### 1. Container (Layout)

Nhóm components và định nghĩa layout.

```typescript
{
  type: 'container',
  style: {
    backgroundColor?: string,      // #RRGGBB
    cornerRadius?: number,         // border radius (px)
    padding?: number | {           // padding
      top?: number,
      bottom?: number,
      left?: number,
      right?: number
    },
    width?: number,                // fixed width
    height?: number,               // fixed height
    fillMaxWidth?: boolean,        // stretch to parent
    fillMaxHeight?: boolean
  },
  property: {
    layout?: 'row' | 'column' | 'scrollRow',
    spacing?: number,              // gap between children (px)
    alignment?: 'start' | 'center' | 'end' | 'spaceBetween'
  },
  value: {
    children: SDUIComponent[]      // nested components
  }
}
```

### 2. Text

Hiển thị text content.

```typescript
{
  type: 'text',
  style: {
    // inherits from container style
  },
  property: {
    typography?: 'headerDefaultBold'    // 20px, 700
             | 'headerSSemibold'        // 16px, 600
             | 'actionSBold'            // 14px, 600
             | 'descriptionDefaultRegular' // 14px, 400
             | 'labelXsMedium',         // 12px, 500
    color?: string,                // text color #RRGGBB
    lineLimit?: number             // max lines (-1 = unlimited)
  },
  value: "Display text here"
}
```

**Typography Mapping:**
- `headerDefaultBold`: 20px, bold (headings)
- `headerSSemibold`: 16px, semi-bold (subheadings)
- `actionSBold`: 14px, semi-bold (action labels)
- `descriptionDefaultRegular`: 14px, regular (body text)
- `labelXsMedium`: 12px, medium (small labels)

### 3. Image

Hiển thị hình ảnh từ URL.

```typescript
{
  type: 'image',
  style: {
    width?: number,                // width (px)
    height?: number,               // height (px)
    cornerRadius?: number          // rounded corners
  },
  property: {
    contentMode?: 'fill' | 'fit' | 'center'
  },
  value: "https://example.com/image.png"
}
```

### 4. Button

Interactive button element.

```typescript
{
  type: 'button',
  style: {
    // inherits from container style
  },
  property: {
    ctaType?: 'BUTTON' | 'TEXT' | 'ICON',
    color?: string                 // button color or text color
  },
  value: {
    title: string,                 // button text
    type?: 'primary' | 'secondary'
  }
}
```

### 5. Spacer

Empty space untuk layout control.

```typescript
{
  type: 'spacer',
  style: {
    height?: number                // spacer height (px)
  },
  property: {},
  value: ''
}
```

---

## Figma to SDUI Mapping

### Node Type Detection

| Figma Type | SDUI Component | Detection Logic |
|-----------|---------------|-----------------|
| TEXT | text | `node.type === 'TEXT'` hoặc role = heading/caption |
| VECTOR, COMPONENT | image | `node.role === 'image'` hoặc icon-like |
| GROUP with Text+BG | button | Contains text + background color |
| FRAME, GROUP | container | Default layout container |
| Small circle | spacer | width = height ≤ 4px hoặc name contains "spacer" |

### Style Mapping

```typescript
// Figma → SDUI
Figma.fill.color → SDUI.style.backgroundColor
Figma.cornerRadius → SDUI.style.cornerRadius
Figma.layoutGrids.padding → SDUI.style.padding
Figma.absoluteBoundingBox.width → SDUI.style.width
Figma.absoluteBoundingBox.height → SDUI.style.height

// Layout properties
Figma.layoutMode === 'HORIZONTAL' → layout: 'row'
Figma.layoutMode === 'VERTICAL' → layout: 'column'
Figma.itemSpacing → spacing
Figma.primaryAxisAlignItems → alignment
```

### Typography Mapping

```typescript
// Font size + weight → typography style
≥ 20px + 700 → headerDefaultBold
16-18px + 600 → headerSSemibold
14px + 600 → actionSBold
12-14px → labelXsMedium / descriptionDefaultRegular
< 12px → labelXsMedium
```

---

## Usage Examples

### Example 1: Simple Promotion Card

Figma design:
```
Frame (white bg, 16px padding)
├─ Image (52x52, circle)
├─ Container (column)
│  ├─ Text "Promotion Title" (16px, semi-bold)
│  └─ Text "Description" (14px, regular)
└─ Button "Collect"
```

Generated SDUI:
```json
{
  "lazy_loads": [{
    "type": "server_driven_widget",
    "block_id": "marketing_sdui_promotion_001",
    "data": [{
      "type": "template_widget",
      "templateType": "SDUI_WIDGET",
      "data": [{
        "type": "container",
        "style": {
          "backgroundColor": "#FFFFFF",
          "cornerRadius": 12,
          "padding": { "all": 16 },
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
              "value": "https://static.momocdn.net/app/icon/promotion.png"
            },
            {
              "type": "container",
              "style": { "fillMaxWidth": true },
              "property": { "layout": "column", "spacing": 2 },
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
                    "value": "Promotion description"
                  }
                ]
              }
            },
            {
              "type": "button",
              "property": {
                "ctaType": "BUTTON",
                "color": "#A50064"
              },
              "value": {
                "title": "Collect",
                "type": "primary"
              }
            }
          ]
        }
      }]
    }]
  }],
  "first_loads": []
}
```

---

## API Reference

### SDUIConverter

```typescript
// Convert components to template format
SDUIConverter.toTemplate(components: SDUIComponent[], blockId?: string): SDUITemplate

// Validate complete template
SDUIConverter.validateTemplate(template: SDUITemplate): { valid: boolean; errors: string[] }

// Generate unique block_id
SDUIConverter.generateBlockId(prefix?: string): string

// Optimize component tree
SDUIConverter.optimize(component: SDUIComponent): SDUIComponent | null
```

### FigmaSDUIParser

```typescript
// Parse single node
FigmaSDUIParser.parseNode(node: EnrichedNode): SDUIComponent

// Parse multiple nodes
FigmaSDUIParser.parseFrame(nodes: EnrichedNode[]): SDUIComponent[]

// Type detection
FigmaSDUIParser.detectComponentType(node: EnrichedNode): ComponentType
```

### TypographyMapper

```typescript
// Map font to typography style
TypographyMapper.mapFontToTypography(
  fontSize?: number,
  fontWeight?: string | number,
  role?: string
): TypographyStyle

// Get typography specs
TypographyMapper.getSpec(style: TypographyStyle): TypographySpec

// Convert to CSS
TypographyMapper.toCSS(style: TypographyStyle): Record<string, string | number>
```

### SDUIValidator

```typescript
// Validate template
SDUIValidator.validate(template: unknown): ValidationResult

// Format result as readable string
SDUIValidator.formatResult(result: ValidationResult): string
```

---

## Best Practices

### ✅ DO:

1. **Use fillMaxWidth for responsiveness**
   ```json
   {
     "style": { "fillMaxWidth": true }
   }
   ```

2. **Keep nesting reasonable** (max 3-4 levels)
   ```
   Container > Container > Container > Components
   ```

3. **Use consistent spacing** (multiples of 4/8)
   ```json
   {
     "property": { "spacing": 8 }
   }
   ```

4. **Validate typography mapping**
   - Check font size matches spec
   - Ensure weight is correct (bold/semi-bold/regular)

5. **Use semantic block_ids**
   ```
   marketing_sdui_promotion_001
   marketing_sdui_banner_summer_2026
   ```

### ❌ DON'T:

1. **Hardcode fixed widths** (unless card-sized)
   ```json
   { "style": { "width": 100 } }  // ❌ Use fillMaxWidth instead
   ```

2. **Deep nesting** (hard to optimize)
   ```
   Container > Container > Container > Container > Container  // ❌
   ```

3. **Mix layout directions** without clear sections
   ```
   row
   ├─ column  // OK
   └─ row     // Avoid unless necessary
   ```

4. **Large image URLs** (optimize for mobile)
   ```
   https://example.com/huge-4k-image.jpg  // ❌
   https://cdn.example.com/optimized-52x52.webp  // ✅
   ```

5. **Missing cornerRadius** on cards
   ```json
   { "type": "container", "style": {} }  // ❌
   { "type": "container", "style": { "cornerRadius": 12 } }  // ✅
   ```

---

## Testing & Validation

### 1. Validate JSON

```bash
# Run validator on exported template
curl -X POST http://localhost:3000/api/sdui/validate \
  -H "Content-Type: application/json" \
  -d @template.json
```

### 2. Check in Web Preview

Go to `/sdui` page in web app:
1. Select "SDUI Builder"
2. Paste JSON
3. Preview renders in real-time

### 3. Verify Native Rendering

- **Android**: Use MockDataProcessor to load JSON
- **iOS**: Use MockDataHandler to load JSON
- Check against reference designs

### 4. Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `INVALID_TYPE` | Component type not recognized | Check type is one of: container, text, image, button, spacer |
| `MISSING_BLOCK_ID` | block_id not provided | Generate unique block_id |
| `INVALID_LAYOUT` | layout property invalid | Use 'row', 'column', or 'scrollRow' |
| `INVALID_COMPONENT_TYPE` | Invalid templateType | Set to 'SDUI_WIDGET' |

---

## Migration Guide

### From Old Format to SDUI Template

If you have old format:
```json
{
  "type": "template_widget",
  "templateType": "SDUI_WIDGET",
  "data": [ /* components */ ]
}
```

Wrap it:
```json
{
  "lazy_loads": [{
    "type": "server_driven_widget",
    "block_id": "your_block_id",
    "data": [{
      "type": "template_widget",
      "templateType": "SDUI_WIDGET",
      "data": [ /* components */ ]
    }]
  }],
  "first_loads": []
}
```

---

## Debugging Tips

### 1. Enable Console Logging

In plugin config:
```typescript
config: {
  flavor: 'marketing_sdui',
  debug: true  // Enable detailed logging
}
```

### 2. Inspect Extracted Nodes

Check browser console for:
- Number of extracted nodes
- Node roles detected
- Component types assigned

### 3. Validate Each Step

```typescript
// After extraction
console.log('Extracted nodes:', nodes);

// After normalization
console.log('Normalized nodes:', normalizedNodes);

// After mapping
console.log('SDUI components:', components);

// After template creation
console.log('Final template:', template);
console.log('Validation:', SDUIValidator.validate(template));
```

### 4. Compare Native Rendering

1. Export from plugin
2. Load in native app
3. Compare visually with Figma
4. Note differences in spacing, colors, fonts

---

## Resources

- **SDUI Template Guide**: [SDUI_TEMPLATE_GUIDE.md](../SDUI_TEMPLATE_GUIDE.md)
- **Figma Plugin Code**: [src/code.ts](../src/code.ts)
- **Marketing Mapper**: [src/renderers/marketing/mapper.ts](../src/renderers/marketing/mapper.ts)
- **Converter**: [src/renderers/sdui/converter.ts](../src/renderers/sdui/converter.ts)
- **Validator**: [src/renderers/sdui/validator.ts](../src/renderers/sdui/validator.ts)

---

## Troubleshooting

### Issue: "Unexpected character" in JSON

**Cause:** Non-escaped special characters in text values

**Fix:**
```typescript
// ❌
{ "value": "Price: ₫50,000" }

// ✅
{ "value": "Price: 50,000 VND" }
```

### Issue: Layout breaks on mobile

**Cause:** Fixed widths, too much nesting, or rigid spacing

**Fix:**
1. Use `fillMaxWidth: true` for responsive components
2. Reduce nesting levels
3. Use proportional spacing

### Issue: Images not rendering

**Cause:** Invalid URL or CORS issue

**Fix:**
1. Verify URL is accessible and HTTPS
2. Use CDN URLs for assets
3. Check image dimensions match style properties

### Issue: Typography looks wrong

**Cause:** Font mapping mismatch

**Fix:**
1. Verify font size ≥ 12px (minimum)
2. Check font weight is correct (100-900)
3. Use TypographyMapper to validate

---

## Version History

- **v1.0** (2026-07-14): Initial SDUI integration with converter, parser, and validator
- **Formats**: JSON per SDUI spec
- **Support**: Marketing SDUI flavor (Promotion RN coming next)

---

**Last Updated**: 2026-07-14
**Status**: Production Ready
