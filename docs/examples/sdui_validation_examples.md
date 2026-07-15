# SDUI Validation Examples

Examples of valid and invalid SDUI templates with explanations.

---

## ✅ Valid Examples

### Example 1: Minimal Valid Template

```json
{
  "lazy_loads": [
    {
      "type": "server_driven_widget",
      "block_id": "minimal_001",
      "data": [
        {
          "type": "template_widget",
          "templateType": "SDUI_WIDGET",
          "data": [
            {
              "type": "text",
              "property": {
                "typography": "headerDefaultBold"
              },
              "value": "Hello"
            }
          ]
        }
      ]
    }
  ],
  "first_loads": []
}
```

**Why valid:**
- ✓ Has `lazy_loads` array
- ✓ Each entry has `type: 'server_driven_widget'`
- ✓ Each entry has `block_id` (alphanumeric)
- ✓ Each entry has `data` array
- ✓ Each data item is a `template_widget` with `SDUI_WIDGET` type
- ✓ Text component has string value
- ✓ Typography is one of the 5 valid styles

---

### Example 2: Complete Promotion Card

```json
{
  "lazy_loads": [
    {
      "type": "server_driven_widget",
      "block_id": "marketing_promo_summer_2026",
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
                "padding": {
                  "all": 16
                },
                "fillMaxWidth": true
              },
              "property": {
                "layout": "column",
                "spacing": 12,
                "alignment": "center"
              },
              "value": {
                "children": [
                  {
                    "type": "image",
                    "style": {
                      "width": 120,
                      "height": 120,
                      "cornerRadius": 8
                    },
                    "property": {
                      "contentMode": "fill"
                    },
                    "value": "https://cdn.example.com/promo-banner.webp"
                  },
                  {
                    "type": "text",
                    "property": {
                      "typography": "headerSSemibold",
                      "color": "#303233",
                      "lineLimit": 2
                    },
                    "value": "Summer Sale 2026"
                  },
                  {
                    "type": "text",
                    "property": {
                      "typography": "descriptionDefaultRegular",
                      "color": "#727272",
                      "lineLimit": -1
                    },
                    "value": "Get up to 50% off on all items. Limited time offer!"
                  },
                  {
                    "type": "button",
                    "property": {
                      "ctaType": "BUTTON",
                      "color": "#A50064"
                    },
                    "value": {
                      "title": "Shop Now",
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

**Why valid:**
- ✓ Complete structure with all required fields
- ✓ Container with proper layout properties
- ✓ Image with valid URL
- ✓ Text with proper typography mapping
- ✓ lineLimit with -1 for unlimited text
- ✓ Button with proper structure
- ✓ Color values are valid hex codes
- ✓ Dimensions are positive numbers

---

### Example 3: Multiple Components

```json
{
  "lazy_loads": [
    {
      "type": "server_driven_widget",
      "block_id": "multi_component_layout",
      "data": [
        {
          "type": "template_widget",
          "templateType": "SDUI_WIDGET",
          "data": [
            {
              "type": "container",
              "style": {
                "backgroundColor": "#F5F5F5",
                "fillMaxWidth": true
              },
              "property": {
                "layout": "column",
                "spacing": 8
              },
              "value": {
                "children": [
                  {
                    "type": "container",
                    "style": {
                      "padding": {
                        "top": 12,
                        "bottom": 12,
                        "left": 16,
                        "right": 16
                      },
                      "backgroundColor": "#FFFFFF",
                      "cornerRadius": 8
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
                            "width": 48,
                            "height": 48,
                            "cornerRadius": 24
                          },
                          "property": {
                            "contentMode": "fill"
                          },
                          "value": "https://cdn.example.com/avatar.png"
                        },
                        {
                          "type": "container",
                          "style": {
                            "fillMaxWidth": true
                          },
                          "property": {
                            "layout": "column",
                            "spacing": 2
                          },
                          "value": {
                            "children": [
                              {
                                "type": "text",
                                "property": {
                                  "typography": "actionSBold",
                                  "color": "#303233"
                                },
                                "value": "John Doe"
                              },
                              {
                                "type": "text",
                                "property": {
                                  "typography": "labelXsMedium",
                                  "color": "#999999"
                                },
                                "value": "@johndoe"
                              }
                            ]
                          }
                        }
                      ]
                    }
                  },
                  {
                    "type": "spacer",
                    "style": {
                      "height": 8
                    },
                    "property": {},
                    "value": ""
                  },
                  {
                    "type": "container",
                    "style": {
                      "padding": {
                        "all": 16
                      },
                      "backgroundColor": "#FFFFFF",
                      "cornerRadius": 8
                    },
                    "property": {
                      "layout": "column",
                      "spacing": 8
                    },
                    "value": {
                      "children": [
                        {
                          "type": "text",
                          "property": {
                            "typography": "headerSSemibold",
                            "color": "#303233"
                          },
                          "value": "Featured Products"
                        }
                      ]
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

**Why valid:**
- ✓ Nested containers with different layouts (column, row)
- ✓ Spacer component with height
- ✓ Complex nesting properly structured
- ✓ All padding formats work
- ✓ Multiple text styles used correctly

---

## ❌ Invalid Examples

### Invalid Example 1: Missing lazy_loads

```json
{
  "first_loads": []
}
```

**Why invalid:**
- ✗ Missing required `lazy_loads` array
- Error: `MISSING_LAZY_LOADS`

**Fix:**
```json
{
  "lazy_loads": [ /* ... */ ],
  "first_loads": []
}
```

---

### Invalid Example 2: Wrong component type

```json
{
  "lazy_loads": [
    {
      "type": "server_driven_widget",
      "block_id": "test",
      "data": [
        {
          "type": "template_widget",
          "templateType": "SDUI_WIDGET",
          "data": [
            {
              "type": "card",  // ✗ Not valid
              "value": "Hello"
            }
          ]
        }
      ]
    }
  ],
  "first_loads": []
}
```

**Why invalid:**
- ✗ `type: 'card'` is not one of 5 valid types
- Valid types: container, text, image, button, spacer
- Error: `INVALID_COMPONENT_TYPE`

**Fix:**
```json
{
  "type": "container",  // Use valid type
  "value": { "children": [ /* ... */ ] }
}
```

---

### Invalid Example 3: Text without value

```json
{
  "lazy_loads": [
    {
      "type": "server_driven_widget",
      "block_id": "test",
      "data": [
        {
          "type": "template_widget",
          "templateType": "SDUI_WIDGET",
          "data": [
            {
              "type": "text",
              "property": {
                "typography": "headerDefaultBold"
              }
              // ✗ Missing value
            }
          ]
        }
      ]
    }
  ],
  "first_loads": []
}
```

**Why invalid:**
- ✗ Text component must have `value` string
- Error: `INVALID_TEXT_VALUE`

**Fix:**
```json
{
  "type": "text",
  "property": { "typography": "headerDefaultBold" },
  "value": "Display Text"  // Add text value
}
```

---

### Invalid Example 4: Button without title

```json
{
  "type": "button",
  "property": {
    "ctaType": "BUTTON",
    "color": "#A50064"
  },
  "value": {
    // ✗ Missing title
    "type": "primary"
  }
}
```

**Why invalid:**
- ✗ Button value must have `title` field
- Error: `MISSING_BUTTON_TITLE`

**Fix:**
```json
{
  "type": "button",
  "property": { "ctaType": "BUTTON" },
  "value": {
    "title": "Click Me",  // Add title
    "type": "primary"
  }
}
```

---

### Invalid Example 5: Invalid block_id

```json
{
  "lazy_loads": [
    {
      "type": "server_driven_widget",
      "block_id": "my-card#001",  // ✗ Contains special chars
      "data": [ /* ... */ ]
    }
  ],
  "first_loads": []
}
```

**Why invalid:**
- ✗ block_id contains `#` which is not alphanumeric
- Warning: `INVALID_BLOCK_ID_FORMAT`
- Should match: `[a-zA-Z0-9_-]`

**Fix:**
```json
{
  "block_id": "my_card_001"  // Use alphanumeric, underscore, hyphen
}
```

---

### Invalid Example 6: Wrong layout value

```json
{
  "type": "container",
  "property": {
    "layout": "diagonal"  // ✗ Not valid
  }
}
```

**Why invalid:**
- ✗ layout must be 'row', 'column', or 'scrollRow'
- Error: `INVALID_LAYOUT`

**Fix:**
```json
{
  "property": {
    "layout": "row"  // Use valid layout
  }
}
```

---

### Invalid Example 7: Image without URL

```json
{
  "type": "image",
  "property": { "contentMode": "fill" },
  "value": 123  // ✗ Should be string URL
}
```

**Why invalid:**
- ✗ Image value must be URL string
- Error: `INVALID_IMAGE_VALUE`

**Fix:**
```json
{
  "type": "image",
  "property": { "contentMode": "fill" },
  "value": "https://example.com/image.png"
}
```

---

### Invalid Example 8: Container without children array

```json
{
  "type": "container",
  "property": { "layout": "column" },
  "value": {
    "children": "Hello"  // ✗ Should be array
  }
}
```

**Why invalid:**
- ✗ Container children must be array of components
- Error: `INVALID_COMPONENTS`

**Fix:**
```json
{
  "type": "container",
  "property": { "layout": "column" },
  "value": {
    "children": [
      {
        "type": "text",
        "property": { "typography": "headerDefaultBold" },
        "value": "Hello"
      }
    ]
  }
}
```

---

## ⚠️ Warnings (Valid but worth noting)

### Warning 1: Empty lazy_loads

```json
{
  "lazy_loads": [],  // ⚠️ Empty array
  "first_loads": []
}
```

**Status:** Valid but warning
- Template is technically valid
- But has no content to render
- Warning: `EMPTY_LAZY_LOADS`

**Recommendation:** Add content to `lazy_loads`

---

### Warning 2: Invalid image URL

```json
{
  "type": "image",
  "property": { "contentMode": "fill" },
  "value": "http://localhost:8000/image.png"  // ⚠️ Not HTTPS
}
```

**Status:** Valid but warning
- Template is valid
- But URL may not be accessible in production
- Warning: `INVALID_IMAGE_URL`

**Recommendation:** Use HTTPS URLs for production

---

### Warning 3: Unknown property

```json
{
  "type": "container",
  "property": {
    "layout": "column",
    "customProp": "value"  // ⚠️ Unknown property
  }
}
```

**Status:** Valid but warning
- Unknown properties are ignored
- May indicate typo
- Warning: `UNKNOWN_PROPERTY`

**Recommendation:** Remove or check spelling

---

## Testing Validation in Code

### JavaScript/TypeScript

```typescript
import { SDUIValidator } from './src/renderers/sdui';

// Test valid template
const validTemplate = { /* ... */ };
const result = SDUIValidator.validate(validTemplate);

if (result.valid) {
  console.log('✓ Template is valid');
}

// Test invalid template
const invalidTemplate = { /* ... */ };
const result2 = SDUIValidator.validate(invalidTemplate);

if (!result2.valid) {
  console.log('Errors:');
  result2.errors.forEach(e => {
    console.log(`  ${e.path}: ${e.message} [${e.code}]`);
  });
}

if (result2.warnings.length > 0) {
  console.log('Warnings:');
  result2.warnings.forEach(w => {
    console.log(`  ${w.path}: ${w.message}`);
  });
}
```

### Using formatResult()

```typescript
import { SDUIValidator } from './src/renderers/sdui';

const result = SDUIValidator.validate(template);
console.log(SDUIValidator.formatResult(result));

// Output:
// ✓ Template is valid
//
// OR
//
// ✗ Template is invalid
//
// Errors:
//   $.lazy_loads: lazy_loads must be an array [MISSING_LAZY_LOADS]
//   $.lazy_loads[0].block_id: block_id must be a non-empty string [MISSING_BLOCK_ID]
//
// Warnings:
//   $.lazy_loads[0].block_id: block_id should only contain alphanumeric... [INVALID_BLOCK_ID_FORMAT]
```

---

## Validation Error Codes Reference

| Code | Type | Description |
|------|------|-------------|
| `INVALID_TYPE` | Error | Template/component has wrong type |
| `MISSING_LAZY_LOADS` | Error | Template missing lazy_loads array |
| `MISSING_BLOCK_ID` | Error | LazyLoad missing block_id |
| `INVALID_LAYOUT` | Error | Invalid layout value |
| `INVALID_COMPONENT_TYPE` | Error | Invalid component type |
| `INVALID_TEXT_VALUE` | Error | Text value not string |
| `INVALID_IMAGE_VALUE` | Error | Image value not string |
| `MISSING_BUTTON_TITLE` | Error | Button missing title |
| `INVALID_CORNER_RADIUS` | Error | cornerRadius not number |
| `INVALID_DIMENSION` | Error | width/height not number |
| `INVALID_BLOCK_ID_FORMAT` | Warning | block_id has special chars |
| `INVALID_IMAGE_URL` | Warning | Image URL may be invalid |
| `UNKNOWN_PROPERTY` | Warning | Unknown property detected |
| `EMPTY_LAZY_LOADS` | Warning | lazy_loads is empty |

---

**Last Updated**: 2026-07-14
