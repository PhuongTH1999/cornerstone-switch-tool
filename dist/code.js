"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/core/extractor.ts
  function extractNode(node) {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible,
      layout: getLayout(node),
      style: getStyle(node),
      text: getTextInfo(node),
      children: "children" in node ? node.children.map(extractNode) : []
    };
  }
  function getLayout(node) {
    var _a, _b, _c, _d;
    try {
      let fillMaxWidth = false;
      let fillMaxHeight = false;
      let isFixedWidth = false;
      let isFixedHeight = false;
      const n = node;
      if ("layoutSizingHorizontal" in n) {
        if (n.layoutSizingHorizontal === "FILL")
          fillMaxWidth = true;
        if (n.layoutSizingHorizontal === "FIXED")
          isFixedWidth = true;
        if (n.layoutSizingVertical === "FILL")
          fillMaxHeight = true;
        if (n.layoutSizingVertical === "FIXED")
          isFixedHeight = true;
      } else {
        if (n.layoutAlign === "STRETCH") {
          if (((_a = n.parent) == null ? void 0 : _a.layoutMode) === "VERTICAL")
            fillMaxWidth = true;
          if (((_b = n.parent) == null ? void 0 : _b.layoutMode) === "HORIZONTAL")
            fillMaxHeight = true;
        }
        if (n.layoutGrow === 1) {
          if (((_c = n.parent) == null ? void 0 : _c.layoutMode) === "HORIZONTAL")
            fillMaxWidth = true;
          if (((_d = n.parent) == null ? void 0 : _d.layoutMode) === "VERTICAL")
            fillMaxHeight = true;
        }
        isFixedWidth = !fillMaxWidth;
        isFixedHeight = !fillMaxHeight;
      }
      if (node.type === "TEXT") {
        isFixedWidth = false;
        isFixedHeight = false;
      } else if (/\bbtn\b|button|\bcta\b/.test((node.name || "").toLowerCase())) {
        isFixedWidth = false;
        isFixedHeight = false;
      }
      if ("layoutMode" in node && node.layoutMode !== "NONE") {
        const padding = {
          top: typeof node.paddingTop === "number" ? node.paddingTop : 0,
          bottom: typeof node.paddingBottom === "number" ? node.paddingBottom : 0,
          left: typeof node.paddingLeft === "number" ? node.paddingLeft : 0,
          right: typeof node.paddingRight === "number" ? node.paddingRight : 0
        };
        return {
          flexDirection: node.layoutMode === "HORIZONTAL" ? "row" : "column",
          gap: typeof node.itemSpacing === "number" ? node.itemSpacing : 0,
          padding: padding.top || padding.bottom || padding.left || padding.right ? padding : void 0,
          alignItems: mapAlignment(n.counterAxisAlignItems || ""),
          justifyContent: mapAlignment(n.primaryAxisAlignItems || ""),
          // Don't hardcode width on containers with fillMaxWidth
          width: fillMaxWidth || fillMaxHeight ? void 0 : isFixedWidth ? node.width : void 0,
          height: fillMaxWidth || fillMaxHeight ? void 0 : isFixedHeight ? node.height : void 0,
          fillMaxWidth: fillMaxWidth ? true : void 0,
          fillMaxHeight: fillMaxHeight ? true : void 0
        };
      }
      return {
        x: node.x,
        y: node.y,
        width: isFixedWidth ? node.width : void 0,
        height: isFixedHeight ? node.height : void 0,
        fillMaxWidth: fillMaxWidth ? true : void 0,
        fillMaxHeight: fillMaxHeight ? true : void 0
      };
    } catch (err) {
      console.warn("Failed to extract layout:", err);
      return {
        width: node.width,
        height: node.height
      };
    }
  }
  function mapAlignment(align) {
    var _a;
    const map = {
      MIN: "flex-start",
      CENTER: "center",
      MAX: "flex-end",
      SPACE_BETWEEN: "space-between",
      BASELINE: "baseline"
    };
    return (_a = map[align]) != null ? _a : "flex-start";
  }
  function getStyle(node) {
    const fills = "fills" in node ? node.fills : [];
    const strokes = "strokes" in node ? node.strokes : [];
    const strokeWeight = "strokeWeight" in node && typeof node.strokeWeight === "number" ? node.strokeWeight : 0;
    return {
      backgroundColor: extractColor(fills),
      borderRadius: "cornerRadius" in node && typeof node.cornerRadius === "number" ? node.cornerRadius : 0,
      opacity: "opacity" in node ? node.opacity : 1,
      borderColor: strokeWeight > 0 ? extractColor(strokes) : null,
      borderWidth: strokeWeight > 0 ? strokeWeight : 0
    };
  }
  function extractColor(fills) {
    if (!fills || fills.length === 0)
      return null;
    const fill = fills.find((f) => f.visible !== false);
    if (!fill || fill.type !== "SOLID")
      return null;
    try {
      if (!fill.color || typeof fill.color !== "object")
        return null;
      const color = fill.color;
      if (typeof color.r !== "number" || typeof color.g !== "number" || typeof color.b !== "number") {
        return null;
      }
      const { r, g, b } = color;
      const alpha = typeof fill.opacity === "number" ? fill.opacity : 1;
      if (alpha < 1) {
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha.toFixed(2)})`;
      }
      const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch (err) {
      console.warn("Failed to extract color:", err);
      return null;
    }
  }
  function getTextInfo(node) {
    var _a;
    if (node.type !== "TEXT")
      return null;
    try {
      const fills = node.fills || [];
      const fontSize = typeof node.fontSize === "number" ? node.fontSize : 14;
      const fontName = typeof node.fontName !== "symbol" ? node.fontName : null;
      const lineHeight = typeof node.lineHeight !== "symbol" ? node.lineHeight : void 0;
      return {
        characters: node.characters || "",
        fontSize,
        fontWeight: fontName == null ? void 0 : fontName.style,
        lineHeight,
        textAlign: (_a = node.textAlignHorizontal) == null ? void 0 : _a.toLowerCase(),
        color: extractColor(fills)
      };
    } catch (err) {
      console.warn("Failed to extract text info:", err);
      return null;
    }
  }

  // src/core/normalizer.ts
  function cleanNode(node) {
    if (!node.visible)
      return null;
    const children = node.children.map(cleanNode).filter((c) => c !== null);
    return __spreadProps(__spreadValues({}, node), { visible: true, children });
  }
  function flattenNode(node) {
    const flatChildren = node.children.map(flattenNode);
    if (flatChildren.length === 1 && !node.text && !hasSignificantStyle(node)) {
      return flatChildren[0];
    }
    return __spreadProps(__spreadValues({}, node), { children: flatChildren });
  }
  function hasSignificantStyle(node) {
    const { backgroundColor, borderRadius, borderWidth } = node.style;
    return !!(backgroundColor || borderRadius && borderRadius > 0 || borderWidth && borderWidth > 0);
  }
  function enrichNode(node) {
    const children = node.children.map(enrichNode);
    const role = detectRole(node);
    return __spreadValues(__spreadProps(__spreadValues({}, node), { children }), role ? { role } : {});
  }
  function detectRole(node) {
    if (node.type === "TEXT" && node.text) {
      const size = node.text.fontSize;
      if (size >= 24)
        return "heading";
      if (size >= 18)
        return "subheading";
      if (size <= 11)
        return "caption";
      return "body";
    }
    const name = node.name.toLowerCase();
    if (/\bbtn\b|button|\bcta\b/.test(name))
      return "button";
    if (/input|field|textfield/.test(name))
      return "input";
    if (/\bimg\b|image|photo|avatar|icon/.test(name))
      return "image";
    if (/\bcard\b/.test(name))
      return "card";
    if (/list|flatlist/.test(name))
      return "list";
    if (/scroll/.test(name))
      return "container";
    return void 0;
  }
  function normalize(node) {
    const cleaned = cleanNode(node);
    if (!cleaned)
      return null;
    const flattened = flattenNode(cleaned);
    return enrichNode(flattened);
  }

  // src/renderers/sdui/typography.ts
  var TYPOGRAPHY_SPECS = {
    headerDefaultBold: {
      fontSize: 20,
      fontWeight: 700,
      lineHeight: 24
    },
    headerSSemibold: {
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 20
    },
    actionSBold: {
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 18
    },
    descriptionDefaultRegular: {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 18
    },
    labelXsMedium: {
      fontSize: 12,
      fontWeight: 500,
      lineHeight: 16
    }
  };
  var TypographyMapper = class {
    /**
     * Map font size and weight to SDUI typography style
     */
    static mapFontToTypography(fontSize, fontWeight, role) {
      if (!fontSize)
        return "descriptionDefaultRegular";
      const weight = typeof fontWeight === "string" ? this.parseFontWeight(fontWeight) : fontWeight || 400;
      if (role === "heading" && fontSize >= 20 && weight >= 700) {
        return "headerDefaultBold";
      }
      if (fontSize >= 18) {
        return weight >= 600 ? "headerSSemibold" : "descriptionDefaultRegular";
      }
      if (fontSize >= 14 && weight >= 600) {
        return "actionSBold";
      }
      if (fontSize < 14) {
        return weight >= 500 ? "labelXsMedium" : "descriptionDefaultRegular";
      }
      return "descriptionDefaultRegular";
    }
    /**
     * Parse CSS font-weight string to numeric value
     */
    static parseFontWeight(fontWeight) {
      const weightMap = {
        thin: 100,
        hairline: 100,
        extralight: 200,
        light: 300,
        normal: 400,
        regular: 400,
        medium: 500,
        semibold: 600,
        demibold: 600,
        bold: 700,
        extrabold: 800,
        ultrabold: 800,
        black: 900,
        heavy: 900
      };
      const lower = fontWeight.toLowerCase();
      if (lower in weightMap)
        return weightMap[lower];
      const num = parseInt(fontWeight, 10);
      return isNaN(num) ? 400 : Math.min(Math.max(num, 100), 900);
    }
    /**
     * Get typography spec details
     */
    static getSpec(style) {
      return TYPOGRAPHY_SPECS[style];
    }
    /**
     * Convert SDUI typography to CSS
     */
    static toCSS(style) {
      const spec = this.getSpec(style);
      return {
        fontSize: `${spec.fontSize}px`,
        fontWeight: spec.fontWeight,
        lineHeight: `${spec.lineHeight}px`
      };
    }
  };

  // src/renderers/sdui/figmaParser.ts
  var FigmaSDUIParser = class {
    /**
     * Parse EnrichedNode to SDUI component
     * Handles role detection, style extraction, and property mapping
     */
    static parseNode(node) {
      const componentType = this.detectComponentType(node);
      switch (componentType) {
        case "text":
          return this.parseTextNode(node);
        case "image":
          return this.parseImageNode(node);
        case "button":
          return this.parseButtonNode(node);
        case "spacer":
          return this.parseSpacerNode(node);
        case "container":
        default:
          return this.parseContainerNode(node);
      }
    }
    /**
     * Detect component type from role and node properties
     */
    static detectComponentType(node) {
      var _a, _b, _c, _d, _e, _f;
      if (node.type === "ELLIPSE" && ((_a = node.layout) == null ? void 0 : _a.width) === ((_b = node.layout) == null ? void 0 : _b.height)) {
        if (node.layout.width && node.layout.width <= 4)
          return "spacer";
      }
      if (((_c = node.name) == null ? void 0 : _c.toLowerCase().includes("spacer")) && !node.children.length) {
        return "spacer";
      }
      if (node.type === "TEXT" || node.role === "heading" || node.role === "caption") {
        return "text";
      }
      if (node.role === "image" || node.type === "VECTOR" || node.type === "COMPONENT" || ((_d = node.name) == null ? void 0 : _d.toLowerCase().includes("icon")) && !node.children.length) {
        return "image";
      }
      if (node.role === "button" || ((_e = node.name) == null ? void 0 : _e.toLowerCase().includes("button")) || ((_f = node.name) == null ? void 0 : _f.toLowerCase().includes("btn")) || node.children.length > 0 && this.isButtonLike(node)) {
        return "button";
      }
      return "container";
    }
    /**
     * Check if node looks like a button (has text + bg color)
     */
    static isButtonLike(node) {
      var _a, _b;
      if (!node.children.length)
        return false;
      const hasText = node.children.some((c) => c.type === "TEXT");
      const hasBackground = ((_a = node.style) == null ? void 0 : _a.backgroundColor) !== null && ((_b = node.style) == null ? void 0 : _b.backgroundColor) !== void 0;
      return hasText && hasBackground;
    }
    /**
     * Parse text node to SDUI text component
     */
    static parseTextNode(node) {
      var _a, _b;
      const { text } = node;
      console.log("\u{1F4DD} Parsing TEXT node:", { name: node.name, hasLayout: !!((_a = node.layout) == null ? void 0 : _a.flexDirection) });
      const result = {
        type: "text",
        style: this.extractStyle(node),
        property: {
          typography: text ? TypographyMapper.mapFontToTypography(text.fontSize, text.fontWeight, node.role) : "descriptionDefaultRegular",
          color: (text == null ? void 0 : text.color) || ((_b = node.style) == null ? void 0 : _b.backgroundColor) || "#303233",
          lineLimit: node.role === "heading" || node.role === "subheading" ? 1 : -1
        },
        value: node.name || (text == null ? void 0 : text.characters) || "Text"
      };
      console.log("  \u2192 Property:", result.property);
      return result;
    }
    /**
     * Parse image node to SDUI image component
     */
    static parseImageNode(node) {
      const { layout, style } = node;
      return {
        type: "image",
        style: {
          width: (layout == null ? void 0 : layout.width) ? Math.round(layout.width) : 52,
          height: (layout == null ? void 0 : layout.height) ? Math.round(layout.height) : 52,
          cornerRadius: (style == null ? void 0 : style.borderRadius) || 0
        },
        property: {
          contentMode: "fill"
        },
        value: node.name || "https://placeholder.com/52x52"
      };
    }
    /**
     * Parse button node to SDUI button component
     */
    static parseButtonNode(node) {
      var _a, _b;
      const buttonText = ((_a = node.children.find((c) => c.type === "TEXT")) == null ? void 0 : _a.name) || node.name || "Button";
      const buttonColor = ((_b = node.style) == null ? void 0 : _b.backgroundColor) || "#303233";
      return {
        type: "button",
        style: this.extractStyle(node),
        property: {
          ctaType: "BUTTON",
          color: buttonColor
        },
        value: {
          title: buttonText,
          type: "primary"
        }
      };
    }
    /**
     * Parse spacer node to SDUI spacer component
     */
    static parseSpacerNode(node) {
      var _a;
      return {
        type: "spacer",
        style: {
          height: ((_a = node.layout) == null ? void 0 : _a.height) || 8
        },
        property: {},
        value: ""
      };
    }
    /**
     * Parse container node to SDUI container component
     */
    static parseContainerNode(node) {
      const children = node.children.map((child) => this.parseNode(child)).filter((comp) => comp !== null);
      return {
        type: "container",
        style: this.extractStyle(node),
        property: this.extractProperty(node),
        value: children.length > 0 ? {
          children
        } : void 0
      };
    }
    /**
     * Extract SDUI style from node
     */
    static extractStyle(node) {
      const { layout, style } = node;
      const result = {};
      if (style == null ? void 0 : style.backgroundColor) {
        result.backgroundColor = style.backgroundColor;
      }
      if ((style == null ? void 0 : style.borderRadius) && style.borderRadius > 0) {
        result.cornerRadius = Math.round(style.borderRadius);
      }
      if (layout == null ? void 0 : layout.width)
        result.width = Math.round(layout.width);
      if (layout == null ? void 0 : layout.height)
        result.height = Math.round(layout.height);
      if (layout == null ? void 0 : layout.padding) {
        const { top, bottom, left, right } = layout.padding;
        if (top === bottom && left === right && top === left) {
          if (top > 0)
            result.padding = top;
        } else {
          const padding = {};
          if (top && top > 0)
            padding.top = top;
          if (bottom && bottom > 0)
            padding.bottom = bottom;
          if (left && left > 0)
            padding.left = left;
          if (right && right > 0)
            padding.right = right;
          if (Object.keys(padding).length > 0)
            result.padding = padding;
        }
      }
      if (layout == null ? void 0 : layout.fillMaxWidth)
        result.fillMaxWidth = true;
      if (layout == null ? void 0 : layout.fillMaxHeight)
        result.fillMaxHeight = true;
      return Object.keys(result).length > 0 ? result : void 0;
    }
    /**
     * Extract SDUI property from node
     */
    static extractProperty(node) {
      const { layout } = node;
      const result = {};
      if (layout == null ? void 0 : layout.flexDirection) {
        result.layout = layout.flexDirection === "row" ? "row" : "column";
      }
      if (layout == null ? void 0 : layout.gap) {
        result.spacing = Math.round(layout.gap);
      }
      if (layout == null ? void 0 : layout.alignItems) {
        const align = layout.alignItems;
        if (align === "flex-start")
          result.alignment = "start";
        else if (align === "flex-end")
          result.alignment = "end";
        else if (align === "center")
          result.alignment = "center";
        else if (align === "space-between")
          result.alignment = "spaceBetween";
      }
      return Object.keys(result).length > 0 ? result : void 0;
    }
    /**
     * Parse multiple nodes and handle frame extraction
     */
    static parseFrame(nodes) {
      return nodes.map((node) => this.parseNode(node)).filter((comp) => comp !== null);
    }
    /**
     * Validate and clean component name for export
     */
    static sanitizeName(name) {
      return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_").toLowerCase().substring(0, 50);
    }
    /**
     * Generate metadata for exported design
     */
    static generateMetadata(nodes, flavor) {
      return {
        flavor,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        nodeCount: nodes.length,
        names: nodes.map((n) => n.name)
      };
    }
  };

  // src/renderers/marketing/mapper.ts
  function mapNode(node) {
    const parsed = FigmaSDUIParser.parseNode(node);
    return optimizeForMarketing(parsed);
  }
  function optimizeForMarketing(component) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (component.type === "text") {
      const cleaned = {
        typography: (_a = component.property) == null ? void 0 : _a.typography,
        color: (_b = component.property) == null ? void 0 : _b.color,
        lineLimit: (_c = component.property) == null ? void 0 : _c.lineLimit
      };
      const filtered = {};
      Object.keys(cleaned).forEach((key) => {
        if (cleaned[key] !== void 0) {
          filtered[key] = cleaned[key];
        }
      });
      component.property = filtered;
      console.log("\u2705 Text cleaned:", component.property);
    }
    if (component.type === "container" && component.style && !component.style.fillMaxWidth) {
      if (!component.style.width) {
        component.style.fillMaxWidth = true;
      }
    }
    if (component.type === "container" && ((_d = component.value) == null ? void 0 : _d.children)) {
      const children = component.value.children;
      const isIconContainer = ((_e = component.style) == null ? void 0 : _e.width) === ((_f = component.style) == null ? void 0 : _f.height) && ((_g = component.style) == null ? void 0 : _g.width) && component.style.width <= 32;
      if (isIconContainer && children.every((c) => c.type === "image") && children.length > 1) {
        component.value.children = [children[0]];
      }
    }
    return component;
  }

  // src/renderers/optimizer.ts
  function optimizeNode(node) {
    var _a;
    if (node.type === "container") {
      const children = (_a = node.value) == null ? void 0 : _a.children;
      if (!children || children.length === 0) {
        return null;
      }
    }
    const style = cleanupStyle(node.style, node.type);
    let property = cleanupProperty(node.property);
    if (node.type === "text") {
      property = {
        typography: property.typography,
        color: property.color,
        lineLimit: property.lineLimit
      };
      Object.keys(property).forEach((key) => {
        if (property[key] === void 0) {
          delete property[key];
        }
      });
    }
    let value = node.value;
    if (node.type === "container" && value && typeof value === "object" && "children" in value) {
      const children = Array.isArray(value.children) ? value.children : [];
      const optimizedChildren = children.map((child) => {
        try {
          return optimizeNode(child);
        } catch (err) {
          console.warn("Failed to optimize child node:", err);
          return null;
        }
      }).filter((n) => n !== null);
      if (optimizedChildren.length === 0) {
        return null;
      }
      if (optimizedChildren.length === 1) {
        const child = optimizedChildren[0];
        const shouldFlatten = !hasSignificantStyle2(style) || isOnlyLayoutContainer(style);
        if (shouldFlatten) {
          if (child.type !== "text") {
            if (property.spacing && child.property && !child.property.spacing) {
              child.property.spacing = property.spacing;
            }
            if (property.layout && child.property && !child.property.layout) {
              child.property.layout = property.layout;
            }
            if (property.alignment && child.property && !child.property.alignment) {
              child.property.alignment = property.alignment;
            }
          }
          if (style.padding && child.style && !child.style.padding) {
            child.style.padding = style.padding;
          }
          return child;
        }
      }
      value = __spreadProps(__spreadValues({}, value), { children: optimizedChildren });
    }
    return {
      type: node.type,
      style: Object.keys(style).length > 0 ? style : {},
      property: Object.keys(property).length > 0 ? property : {},
      value: value || {}
    };
  }
  function cleanupStyle(style, nodeType) {
    const cleaned = {};
    for (const [key, value] of Object.entries(style)) {
      if (nodeType === "text" && key === "backgroundColor") {
        continue;
      }
      if (key === "padding" || key === "margin") {
        const pad = value;
        if (pad.all === 0 || !pad.all && Object.values(pad).every((v) => !v)) {
          continue;
        }
        cleaned[key] = pad;
        continue;
      }
      if (value === false || value === 0 || value === "" || value === null || value === void 0) {
        continue;
      }
      if ((key === "fillMaxWidth" || key === "fillMaxHeight" || key === "fillMaxSize") && !value) {
        continue;
      }
      cleaned[key] = value;
    }
    return cleaned;
  }
  function hasSignificantStyle2(style) {
    for (const key of Object.keys(style)) {
      if (["backgroundColor", "cornerRadius", "borderWidth", "borderColor", "shadow"].includes(key)) {
        return true;
      }
    }
    return false;
  }
  function isOnlyLayoutContainer(style) {
    const layoutOnlyKeys = ["width", "height", "fillMaxWidth", "fillMaxHeight", "padding"];
    for (const key of Object.keys(style)) {
      if (!layoutOnlyKeys.includes(key)) {
        return false;
      }
    }
    return true;
  }
  function cleanupProperty(property) {
    const cleaned = {};
    for (const [key, value] of Object.entries(property)) {
      if (value === false || value === 0 || value === "" || value === null || value === void 0) {
        continue;
      }
      if (key === "layout" && (value === "column" || !value)) {
        continue;
      }
      if (key === "spacing" && value === 0) {
        continue;
      }
      if (key === "alignment" && (value === "start" || value === "flex-start")) {
        continue;
      }
      if (key === "alignment") {
        if (value === "flex-start") {
          cleaned[key] = "start";
        } else if (value === "flex-end") {
          cleaned[key] = "end";
        } else {
          cleaned[key] = value;
        }
        continue;
      }
      cleaned[key] = value;
    }
    return cleaned;
  }
  function optimizeData(data) {
    return data.map((node) => optimizeNode(node)).filter((n) => n !== null);
  }

  // src/renderers/marketing/index.ts
  var MarketingSduiRenderer = class {
    render(nodes, config) {
      const data = nodes.map((node) => mapNode(node));
      const optimized = optimizeData(data);
      const payload = {
        type: "template_widget",
        templateType: "SDUI_WIDGET",
        data: optimized
      };
      return JSON.stringify(payload, null, 2);
    }
  };

  // src/renderers/promotion/mapper.ts
  function mapNode2(node) {
    var _a, _b, _c, _d, _e;
    if (node.role === "button") {
      return {
        type: "button",
        style: buildStyle(node),
        property: {
          ctaType: "BUTTON",
          color: ((_a = node.style) == null ? void 0 : _a.backgroundColor) || "#303233"
        },
        value: {
          title: node.name || "Button",
          type: "primary"
        }
      };
    }
    if (node.role === "image" || node.type === "VECTOR") {
      return {
        type: "image",
        style: buildStyle(node),
        property: {
          contentMode: "fill"
        },
        value: node.name || ""
      };
    }
    if (node.type === "TEXT" || node.role === "heading" || node.role === "subheading" || node.role === "caption") {
      return {
        type: "text",
        style: buildStyle(node),
        property: buildTextProperty(node),
        value: node.name || ""
      };
    }
    let children = node.children.map((child) => mapNode2(child));
    const isIconContainer = ((_b = node.layout) == null ? void 0 : _b.width) === ((_c = node.layout) == null ? void 0 : _c.height) && ((_d = node.layout) == null ? void 0 : _d.width) && ((_e = node.layout) == null ? void 0 : _e.width) <= 32;
    const allImagesChildren = children.every((c) => c.type === "image");
    if (isIconContainer && allImagesChildren && children.length > 1) {
      children = [children[0]];
    }
    return {
      type: "container",
      style: buildStyle(node),
      property: buildProperty(node),
      value: {
        children: children.length > 0 ? children : void 0
      }
    };
  }
  function buildStyle(node) {
    const style = {};
    const { layout, style: nodeStyle } = node;
    if (nodeStyle == null ? void 0 : nodeStyle.backgroundColor)
      style.backgroundColor = nodeStyle.backgroundColor;
    if ((nodeStyle == null ? void 0 : nodeStyle.borderRadius) && nodeStyle.borderRadius > 0) {
      style.cornerRadius = nodeStyle.borderRadius;
    }
    if (layout == null ? void 0 : layout.width)
      style.width = Math.round(layout.width);
    if (layout == null ? void 0 : layout.height)
      style.height = Math.round(layout.height);
    if (layout == null ? void 0 : layout.padding) {
      const { top, bottom, left, right } = layout.padding;
      if (top === bottom && left === right && top === left) {
        style.padding = { all: top };
      } else {
        style.padding = {};
        if (top > 0)
          style.padding.top = top;
        if (bottom > 0)
          style.padding.bottom = bottom;
        if (left > 0)
          style.padding.left = left;
        if (right > 0)
          style.padding.right = right;
      }
    }
    if (layout == null ? void 0 : layout.fillMaxWidth)
      style.fillMaxWidth = true;
    if (layout == null ? void 0 : layout.fillMaxHeight)
      style.fillMaxHeight = true;
    return style;
  }
  function buildProperty(node) {
    const property = {};
    const { layout } = node;
    if (layout == null ? void 0 : layout.flexDirection) {
      property.layout = layout.flexDirection === "row" ? "row" : "column";
    }
    if ((layout == null ? void 0 : layout.gap) !== void 0)
      property.spacing = Math.round(layout.gap);
    const isSmallContainer = (layout == null ? void 0 : layout.width) === (layout == null ? void 0 : layout.height) && (layout == null ? void 0 : layout.width) && (layout == null ? void 0 : layout.width) <= 32;
    if (isSmallContainer) {
      property.alignment = "start";
    } else if (layout == null ? void 0 : layout.alignItems) {
      const align = layout.alignItems;
      property.alignment = align === "flex-start" ? "start" : align === "flex-end" ? "end" : align;
    }
    return property;
  }
  function buildTextProperty(node) {
    const property = {};
    const { text } = node;
    if (!text)
      return property;
    const { fontSize, color, fontWeight } = text;
    let typography = "descriptionDefaultRegular";
    if (fontSize && fontSize >= 18)
      typography = "headerSSemibold";
    else if (fontSize && fontSize >= 16)
      typography = "actionSBold";
    else if (fontSize && fontSize >= 14)
      typography = "descriptionDefaultRegular";
    else
      typography = "labelXsMedium";
    property.typography = typography;
    if (color)
      property.color = color;
    property.lineLimit = 1;
    return property;
  }

  // src/renderers/promotion/index.ts
  var PromotionRnRenderer = class {
    render(nodes, config) {
      const data = nodes.map((node) => mapNode2(node));
      const optimized = optimizeData(data);
      const payload = {
        type: "template_widget",
        templateType: "SDUI_WIDGET",
        data: optimized
      };
      return JSON.stringify(payload, null, 2);
    }
  };

  // src/renderers/index.ts
  function getRenderer(flavor) {
    switch (flavor) {
      case "promotion_rn":
        return new PromotionRnRenderer();
      case "marketing_sdui":
      default:
        return new MarketingSduiRenderer();
    }
  }

  // src/code.ts
  figma.showUI(__html__, { width: 440, height: 360, title: "Design Extractor" });
  var currentConfig = null;
  figma.ui.onmessage = (msg) => {
    switch (msg.type) {
      case "EXTRACT":
        handleExtract();
        break;
      case "RESIZE":
        if (msg.width && msg.height) {
          figma.ui.resize(msg.width, msg.height);
        }
        break;
      case "SET_CONFIG":
        currentConfig = msg.config;
        break;
      case "CLOSE":
        figma.closePlugin();
        break;
    }
  };
  function handleExtract() {
    try {
      const selection = figma.currentPage.selection;
      const nodes = selection.length > 0 ? selection : figma.currentPage.children;
      if (nodes.length === 0) {
        sendToUI({ type: "ERROR", message: "No nodes selected or found on page." });
        return;
      }
      const enrichedNodes = nodes.map(extractNode).map(normalize).filter((n) => n !== null);
      const renderer = getRenderer(currentConfig == null ? void 0 : currentConfig.flavor);
      const json = renderer.render(enrichedNodes, currentConfig);
      sendToUI({ type: "RESULT", json, nodeCount: enrichedNodes.length });
    } catch (err) {
      sendToUI({
        type: "ERROR",
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }
  function sendToUI(msg) {
    figma.ui.postMessage(msg);
  }
})();
