# SDUI Rendering Module

Core SDUI component generation, conversion, validation, and Figma parsing utilities.

## Files

### converter.ts
Main converter for transforming component trees into SDUI template format.

**Key exports:**
- `SDUIConverter` - Convert components to template, validate, optimize, generate block_ids

**Usage:**
```typescript
import { SDUIConverter } from './converter';

const template = SDUIConverter.toTemplate(components, 'block_id');
const validation = SDUIConverter.validateTemplate(template);
const optimized = SDUIConverter.optimize(component);
```

### figmaParser.ts
Parse Figma-extracted nodes into SDUI components with automatic type detection.

**Key exports:**
- `FigmaSDUIParser` - Parse nodes, detect component types, extract styles/properties

**Usage:**
```typescript
import { FigmaSDUIParser } from './figmaParser';

const component = FigmaSDUIParser.parseNode(enrichedNode);
const components = FigmaSDUIParser.parseFrame(nodes);
```

### typography.ts
Typography system mapping Figma font properties to SDUI styles.

**Key exports:**
- `TypographyMapper` - Map fonts to typography styles, get specs, convert to CSS
- `TypographyStyle` - Type for typography values

**Usage:**
```typescript
import { TypographyMapper } from './typography';

const style = TypographyMapper.mapFontToTypography(14, 600);  // 'actionSBold'
const spec = TypographyMapper.getSpec('headerDefaultBold');   // { fontSize, fontWeight, lineHeight }
const css = TypographyMapper.toCSS('labelXsMedium');          // { fontSize, fontWeight, lineHeight }
```

### validator.ts
Comprehensive SDUI template validation with detailed error and warning reporting.

**Key exports:**
- `SDUIValidator` - Validate complete templates, format results

**Usage:**
```typescript
import { SDUIValidator } from './validator';

const result = SDUIValidator.validate(template);
if (result.valid) {
  console.log('Template is valid');
} else {
  console.log(SDUIValidator.formatResult(result));
}
```

### index.ts
Module entry point with all exports.

## Architecture

```
Figma Design
    ↓
[EnrichedNode] extracted from Figma
    ↓
FigmaSDUIParser.parseNode()
    ↓
[SDUIComponent] with type, style, property, value
    ↓
SDUIConverter.toTemplate()
    ↓
[SDUITemplate] { lazy_loads, first_loads }
    ↓
SDUIValidator.validate()
    ↓
JSON output → Native App
```

## Type Definitions

### SDUIComponent
```typescript
{
  type: 'container' | 'text' | 'image' | 'button' | 'spacer',
  style?: SDUIStyle,
  property?: SDUIProperty,
  value?: SDUIComponentValue | string
}
```

### SDUITemplate
```typescript
{
  lazy_loads: SDUILazyLoad[],
  first_loads: any[]
}
```

## Integration with Marketing Renderer

The marketing renderer uses this module to convert extracted Figma designs:

```
src/renderers/marketing/
  ├─ mapper.ts (mapNode) → calls FigmaSDUIParser + optimizations
  └─ index.ts → calls SDUIConverter.toTemplate() + SDUIValidator.validate()
```

## Examples

See `docs/examples/` for complete examples:
- `marketing_promotion_card.json` - Example promotion card template
- `sdui_usage.ts` - TypeScript usage examples

## Testing

```bash
# Validate a template
npm test -- sdui.validator.test.ts

# Test converter
npm test -- sdui.converter.test.ts

# Test parser
npm test -- sdui.parser.test.ts
```

## API Completeness

- ✓ Component type detection
- ✓ Style extraction (colors, dimensions, padding, corners)
- ✓ Property mapping (layout, spacing, alignment)
- ✓ Typography mapping (6 styles across font sizes)
- ✓ Template structure validation
- ✓ Block ID generation
- ✓ Component optimization
- ✓ Error reporting with paths
- ✓ Web preview support

## Future Enhancements

- [ ] Support for animations/transitions
- [ ] Scrollable container handling
- [ ] Gradient support
- [ ] Custom metrics
- [ ] Component reusability / refs
- [ ] Dynamic data binding support
