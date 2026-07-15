# SDUI Quick Reference

One-page reference for SDUI template structure, components, and usage.

---

## Template Structure

```json
{
  "lazy_loads": [
    {
      "type": "server_driven_widget",
      "block_id": "unique_id_here",
      "data": [
        {
          "type": "template_widget",
          "templateType": "SDUI_WIDGET",
          "data": [ /* Components go here */ ]
        }
      ]
    }
  ],
  "first_loads": []
}
```

---

## Component Types (5 total)

### Container (Layout)
```typescript
{
  type: 'container',
  style: {
    backgroundColor: '#FFF',
    cornerRadius: 12,
    padding: 16,              // or { top, bottom, left, right }
    width: 351,               // optional
    height: 200,              // optional
    fillMaxWidth: true,       // responsive
    fillMaxHeight: true
  },
  property: {
    layout: 'row',            // 'row' | 'column' | 'scrollRow'
    spacing: 8,               // gap between children
    alignment: 'center'       // 'start' | 'center' | 'end' | 'spaceBetween'
  },
  value: {
    children: [ /* nested components */ ]
  }
}
```

### Text
```typescript
{
  type: 'text',
  style: {},
  property: {
    typography: 'headerDefaultBold',      // 20px, 700
                // | 'headerSSemibold'    // 16px, 600
                // | 'actionSBold'        // 14px, 600
                // | 'descriptionDefaultRegular' // 14px, 400
                // | 'labelXsMedium'      // 12px, 500
    color: '#303233',
    lineLimit: 1              // max lines (-1 = unlimited)
  },
  value: "Text content here"
}
```

### Image
```typescript
{
  type: 'image',
  style: {
    width: 52,
    height: 52,
    cornerRadius: 26
  },
  property: {
    contentMode: 'fill'       // 'fill' | 'fit' | 'center'
  },
  value: "https://example.com/image.png"
}
```

### Button
```typescript
{
  type: 'button',
  style: {},
  property: {
    ctaType: 'BUTTON',        // 'BUTTON' | 'TEXT' | 'ICON'
    color: '#A50064'
  },
  value: {
    title: "Click Me",
    type: 'primary'           // 'primary' | 'secondary'
  }
}
```

### Spacer
```typescript
{
  type: 'spacer',
  style: {
    height: 8                 // optional
  },
  property: {},
  value: ""
}
```

---

## Typography Reference

| Style | Size | Weight | Use Case |
|-------|------|--------|----------|
| `headerDefaultBold` | 20px | 700 | Main headings |
| `headerSSemibold` | 16px | 600 | Section titles |
| `actionSBold` | 14px | 600 | Action labels |
| `descriptionDefaultRegular` | 14px | 400 | Body text |
| `labelXsMedium` | 12px | 500 | Small labels |

---

## API Quick Reference

### SDUIConverter
```typescript
// Create template from components
SDUIConverter.toTemplate(components, blockId)

// Validate template structure
SDUIConverter.validateTemplate(template)

// Generate unique block_id
SDUIConverter.generateBlockId('prefix')

// Optimize component tree
SDUIConverter.optimize(component)
```

### FigmaSDUIParser
```typescript
// Parse single Figma node
FigmaSDUIParser.parseNode(enrichedNode)

// Parse multiple nodes
FigmaSDUIParser.parseFrame(nodes)

// Detect component type
FigmaSDUIParser.detectComponentType(node)
```

### TypographyMapper
```typescript
// Map font to SDUI style
TypographyMapper.mapFontToTypography(fontSize, fontWeight, role)

// Get typography spec
TypographyMapper.getSpec(style)

// Convert to CSS
TypographyMapper.toCSS(style)
```

### SDUIValidator
```typescript
// Validate template
SDUIValidator.validate(template)

// Format validation result
SDUIValidator.formatResult(result)
```

---

## Common Patterns

### Responsive Card
```json
{
  "type": "container",
  "style": {
    "backgroundColor": "#FFF",
    "cornerRadius": 12,
    "padding": { "all": 16 },
    "fillMaxWidth": true
  },
  "property": {
    "layout": "column",
    "spacing": 8
  },
  "value": {
    "children": [ /* content */ ]
  }
}
```

### Horizontal Row
```json
{
  "type": "container",
  "property": {
    "layout": "row",
    "spacing": 12,
    "alignment": "center"
  },
  "value": {
    "children": [
      { "type": "image", "style": { "width": 48, "height": 48 } },
      { "type": "container", "style": { "fillMaxWidth": true } }
    ]
  }
}
```

### Promotion Card
```json
{
  "type": "container",
  "style": {
    "backgroundColor": "#FFFFFF",
    "cornerRadius": 12,
    "padding": { "all": 12 },
    "fillMaxWidth": true
  },
  "property": { "layout": "row", "spacing": 12, "alignment": "center" },
  "value": {
    "children": [
      { "type": "image", "style": { "width": 52, "height": 52 } },
      {
        "type": "container",
        "style": { "fillMaxWidth": true },
        "property": { "layout": "column", "spacing": 2 },
        "value": {
          "children": [
            { "type": "text", "property": { "typography": "headerSSemibold" }, "value": "Title" },
            { "type": "text", "property": { "typography": "descriptionDefaultRegular" }, "value": "Description" }
          ]
        }
      },
      { "type": "button", "property": { "ctaType": "BUTTON" }, "value": { "title": "Action" } }
    ]
  }
}
```

---

## Color System

| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary (MoMo Pink) | `#A50064` | Primary buttons, highlights |
| Text Dark | `#303233` | Main text, headings |
| Text Light | `#727272` | Secondary text, descriptions |
| Text Muted | `#999999` | Tertiary text, captions |
| Background | `#FFFFFF` | Card backgrounds |
| Gray BG | `#F5F5F5` | Section backgrounds |

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Text overlapping | Fixed width too small | Use `fillMaxWidth: true` |
| Image distorted | Wrong aspect ratio | Set both width & height |
| Layout breaks mobile | Deep nesting | Keep max 3-4 levels |
| Colors wrong | Hex format | Use `#RRGGBB` or `#RGB` |
| Spacing inconsistent | Random numbers | Use multiples of 4/8 |
| Button not clickable | Missing title | Add `value.title` field |

---

## Validation Error Codes

```
MISSING_LAZY_LOADS      ← Required lazy_loads array missing
INVALID_COMPONENT_TYPE  ← Wrong component type
INVALID_TEXT_VALUE      ← Text value not string
INVALID_IMAGE_VALUE     ← Image value not string
MISSING_BUTTON_TITLE    ← Button missing title
INVALID_LAYOUT          ← Invalid layout value
INVALID_BLOCK_ID_FORMAT ← block_id has special chars
EMPTY_LAZY_LOADS        ← No content in lazy_loads
```

---

## Properties Cheat Sheet

### Style Properties
```
backgroundColor    string  Color hex
cornerRadius       number  Border radius (px)
padding           number|obj  Padding (px)
width             number  Width (px)
height            number  Height (px)
fillMaxWidth      boolean Stretch to parent
fillMaxHeight     boolean Stretch to parent
```

### Layout Properties
```
layout             'row'|'column'|'scrollRow'
spacing            number  Gap (px)
alignment          'start'|'center'|'end'|'spaceBetween'
```

### Text Properties
```
typography        'headerDefaultBold'|etc
color             string  Color hex
lineLimit         number  Max lines (-1=unlimited)
```

### Image Properties
```
contentMode       'fill'|'fit'|'center'
```

### Button Properties
```
ctaType           'BUTTON'|'TEXT'|'ICON'
color             string  Text or button color
```

---

## Export from Figma Plugin

```
1. Open Figma design
2. Select frames/components
3. Run plugin
4. Choose flavor: "Marketing SDUI"
5. Click "Export"
6. JSON template downloaded
```

---

## Validate in Code

```typescript
import { SDUIValidator } from './src/renderers/sdui';

const result = SDUIValidator.validate(template);
console.log(SDUIValidator.formatResult(result));
```

---

## File Locations

```
src/renderers/sdui/
├─ converter.ts       Template conversion
├─ figmaParser.ts     Figma parsing
├─ typography.ts      Font mapping
├─ validator.ts       Validation
└─ index.ts           Exports

src/renderers/marketing/
├─ mapper.ts          Node mapping
├─ index.ts           Renderer
└─ types.ts           Types
```

---

## Resources

- **Full Integration Guide**: `docs/SDUI_INTEGRATION.md`
- **Examples**: `docs/examples/`
- **Implementation Summary**: `docs/SDUI_IMPLEMENTATION_SUMMARY.md`
- **Validation Examples**: `docs/examples/sdui_validation_examples.md`
- **Original Spec**: `SDUI_TEMPLATE_GUIDE.md`

---

## Import in Code

```typescript
// Import converters
import { SDUIConverter } from 'src/renderers/sdui/converter';

// Import parser
import { FigmaSDUIParser } from 'src/renderers/sdui/figmaParser';

// Import typography
import { TypographyMapper } from 'src/renderers/sdui/typography';

// Import validator
import { SDUIValidator } from 'src/renderers/sdui/validator';

// Or import all
import { SDUIConverter, FigmaSDUIParser, TypographyMapper, SDUIValidator } 
  from 'src/renderers/sdui';
```

---

**Last Updated**: 2026-07-14 | **Status**: Production Ready ✅
