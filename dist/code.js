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
    } else if (/\bbtn\b|button|\bcta\b/.test(node.name.toLowerCase())) {
      isFixedWidth = false;
      isFixedHeight = false;
    }
    if ("layoutMode" in node && node.layoutMode !== "NONE") {
      return {
        flexDirection: node.layoutMode === "HORIZONTAL" ? "row" : "column",
        gap: node.itemSpacing,
        padding: {
          top: node.paddingTop,
          bottom: node.paddingBottom,
          left: node.paddingLeft,
          right: node.paddingRight
        },
        alignItems: mapAlignment(node.counterAxisAlignItems),
        justifyContent: mapAlignment(node.primaryAxisAlignItems),
        width: isFixedWidth ? node.width : void 0,
        height: isFixedHeight ? node.height : void 0,
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
    var _a;
    if (!fills || fills.length === 0)
      return null;
    const fill = fills.find((f) => f.visible !== false);
    if (!fill || fill.type !== "SOLID")
      return null;
    const { r, g, b } = fill.color;
    const alpha = (_a = fill.opacity) != null ? _a : 1;
    if (alpha < 1) {
      return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha.toFixed(2)})`;
    }
    const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  function getTextInfo(node) {
    var _a;
    if (node.type !== "TEXT")
      return null;
    const fills = node.fills;
    const fontSize = typeof node.fontSize === "number" ? node.fontSize : 14;
    const fontName = typeof node.fontName !== "symbol" ? node.fontName : null;
    const lineHeight = typeof node.lineHeight !== "symbol" ? node.lineHeight : void 0;
    return {
      characters: node.characters,
      fontSize,
      fontWeight: fontName == null ? void 0 : fontName.style,
      lineHeight,
      textAlign: (_a = node.textAlignHorizontal) == null ? void 0 : _a.toLowerCase(),
      color: extractColor(fills)
    };
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

  // src/renderers/marketing/mapper.ts
  function mapNode(node) {
    var _a, _b;
    if (node.role === "button") {
      const rawMod = buildModifier(node);
      const modifier2 = {};
      if (rawMod.alignment)
        modifier2.alignment = rawMod.alignment;
      if (rawMod.weight)
        modifier2.weight = rawMod.weight;
      return {
        componentType: "CTA_BUTTON",
        modifier: Object.keys(modifier2).length > 0 ? modifier2 : void 0
      };
    }
    if (node.role === "image" || node.type === "VECTOR") {
      const modifier2 = buildModifier(node);
      const size = ((_a = node.layout) == null ? void 0 : _a.width) ? Math.round(node.layout.width) : void 0;
      return {
        componentType: "ICON",
        field: node.name,
        iconSize: size,
        modifier: Object.keys(modifier2).length > 0 ? modifier2 : void 0
      };
    }
    if (node.role === "list") {
      return {
        componentType: "ITEM_LIST",
        field: "items",
        modifier: buildModifier(node)
      };
    }
    if (node.type === "TEXT" || node.role === "heading" || node.role === "subheading" || node.role === "caption" || node.role === "body") {
      const modifier2 = buildModifier(node);
      delete modifier2.width;
      delete modifier2.height;
      delete modifier2.padding;
      delete modifier2.backgroundColor;
      delete modifier2.cornerRadius;
      delete modifier2.border;
      return {
        componentType: "TEXT",
        field: node.name,
        modifier: Object.keys(modifier2).length > 0 ? modifier2 : void 0,
        style: buildTextStyle(node)
      };
    }
    const modifier = buildModifier(node);
    const children = node.children.map((child) => mapNode(child));
    return {
      layout: ((_b = node.layout) == null ? void 0 : _b.flexDirection) || "column",
      modifier: Object.keys(modifier).length > 0 ? modifier : void 0,
      children: children.length > 0 ? children : void 0
    };
  }
  function buildModifier(node) {
    const result = {};
    const { layout, style } = node;
    if ((layout == null ? void 0 : layout.width) !== void 0)
      result.width = Math.round(layout.width);
    if ((layout == null ? void 0 : layout.height) !== void 0)
      result.height = Math.round(layout.height);
    if (layout == null ? void 0 : layout.fillMaxWidth)
      result.fillMaxWidth = true;
    if (layout == null ? void 0 : layout.fillMaxHeight)
      result.fillMaxHeight = true;
    if (layout == null ? void 0 : layout.padding) {
      const { top, bottom, left, right } = layout.padding;
      if (top === bottom && left === right && top === left && top > 0) {
        result.padding = top;
      } else if (top > 0 || bottom > 0 || left > 0 || right > 0) {
        result.padding = {};
        if (top > 0)
          result.padding.top = top;
        if (bottom > 0)
          result.padding.bottom = bottom;
        if (left > 0)
          result.padding.left = left;
        if (right > 0)
          result.padding.right = right;
      }
    }
    if (layout == null ? void 0 : layout.alignItems) {
      const a = layout.alignItems;
      result.alignment = a === "flex-start" ? "start" : a === "flex-end" ? "end" : a;
    }
    if (layout == null ? void 0 : layout.justifyContent) {
      const a = layout.justifyContent;
      result.arrangement = a === "flex-start" ? "start" : a === "flex-end" ? "end" : a === "space-between" ? "spaceBetween" : a;
    }
    if (style == null ? void 0 : style.backgroundColor)
      result.backgroundColor = style.backgroundColor;
    if ((style == null ? void 0 : style.borderRadius) && style.borderRadius > 0)
      result.cornerRadius = style.borderRadius;
    if ((style == null ? void 0 : style.borderColor) && (style == null ? void 0 : style.borderWidth) && style.borderWidth > 0) {
      result.border = { width: style.borderWidth, color: style.borderColor };
    }
    return result;
  }
  function buildTextStyle(node) {
    if (!node.text)
      return {};
    const { fontSize, color, fontWeight } = node.text;
    const result = {};
    let typography = "descriptionDefaultRegular";
    if (fontSize >= 18)
      typography = "headerSSemibold";
    else if (fontSize >= 16)
      typography = "actionSBold";
    else if (fontSize >= 14)
      typography = "descriptionDefaultRegular";
    else
      typography = "labelXsMedium";
    result.typography = typography;
    if (color)
      result.color = color;
    if (fontWeight)
      result.fontWeight = mapFontWeight(fontWeight);
    return result;
  }
  function mapFontWeight(style) {
    const map = {
      Thin: "100",
      ExtraLight: "200",
      Light: "300",
      Regular: "400",
      Medium: "500",
      SemiBold: "600",
      Bold: "700",
      ExtraBold: "800",
      Black: "900"
    };
    return map[style];
  }

  // src/renderers/marketing/index.ts
  var MarketingSduiRenderer = class {
    render(nodes, config) {
      var _a;
      const isScrollable = ((_a = config == null ? void 0 : config.settings) == null ? void 0 : _a.rootContainer) === "scrollable";
      const schemas = nodes.map((node) => {
        var _a2, _b, _c;
        return {
          dataSchema: {
            renderEngine: "Native SDUI",
            _pluginProfile: (_a2 = config == null ? void 0 : config.flavor) != null ? _a2 : "marketing_sdui",
            _notes: (_c = (_b = config == null ? void 0 : config.settings) == null ? void 0 : _b.notes) != null ? _c : "",
            scrollEnabled: isScrollable || void 0,
            header: {
              showHeader: false,
              backgroundImage: ""
            },
            content: {
              value: {
                modifier: {},
                body: mapNode(node)
              }
            }
          }
        };
      });
      const payload = schemas.length === 1 ? schemas[0] : schemas;
      return JSON.stringify(payload, null, 2);
    }
  };

  // src/renderers/promotion/mapper.ts
  function mapNode2(node) {
    var _a, _b, _c, _d, _e;
    if (node.role === "button") {
      return {
        type: "TouchableOpacity",
        field: node.name,
        style: buildBaseStyle(node)
      };
    }
    if (node.role === "image" || node.type === "VECTOR") {
      return {
        type: "Image",
        field: node.name,
        style: {
          width: ((_a = node.layout) == null ? void 0 : _a.width) ? Math.round(node.layout.width) : void 0,
          height: ((_b = node.layout) == null ? void 0 : _b.height) ? Math.round(node.layout.height) : void 0
        }
      };
    }
    if (node.role === "list") {
      return {
        type: "FlatList",
        field: "items",
        style: buildBaseStyle(node)
      };
    }
    if (node.type === "TEXT" || node.role === "heading" || node.role === "subheading" || node.role === "caption" || node.role === "body") {
      const style2 = {};
      if ((_c = node.text) == null ? void 0 : _c.fontSize)
        style2.fontSize = node.text.fontSize;
      if ((_d = node.text) == null ? void 0 : _d.color)
        style2.color = node.text.color;
      if ((_e = node.text) == null ? void 0 : _e.fontWeight)
        style2.fontWeight = node.text.fontWeight;
      return {
        type: "Text",
        field: node.name,
        style: style2
      };
    }
    const style = buildBaseStyle(node);
    const children = node.children.map((child) => mapNode2(child));
    return {
      type: "View",
      style,
      children: children.length > 0 ? children : void 0
    };
  }
  function buildBaseStyle(node) {
    const { layout, style } = node;
    const result = {};
    if (layout == null ? void 0 : layout.flexDirection)
      result.flexDirection = layout.flexDirection;
    if (layout == null ? void 0 : layout.fillMaxWidth)
      result.flex = 1;
    if (layout == null ? void 0 : layout.width)
      result.width = Math.round(layout.width);
    if (layout == null ? void 0 : layout.height)
      result.height = Math.round(layout.height);
    if (layout == null ? void 0 : layout.padding) {
      const { top, bottom, left, right } = layout.padding;
      if (top === bottom && left === right && top === left && top > 0) {
        result.padding = top;
      } else {
        if (top > 0)
          result.paddingTop = top;
        if (bottom > 0)
          result.paddingBottom = bottom;
        if (left > 0)
          result.paddingLeft = left;
        if (right > 0)
          result.paddingRight = right;
      }
    }
    if (layout == null ? void 0 : layout.alignItems)
      result.alignItems = layout.alignItems;
    if (layout == null ? void 0 : layout.justifyContent)
      result.justifyContent = layout.justifyContent;
    if (style == null ? void 0 : style.backgroundColor)
      result.backgroundColor = style.backgroundColor;
    if ((style == null ? void 0 : style.borderRadius) && style.borderRadius > 0)
      result.borderRadius = style.borderRadius;
    if ((style == null ? void 0 : style.borderWidth) && style.borderWidth > 0) {
      result.borderWidth = style.borderWidth;
      if (style.borderColor)
        result.borderColor = style.borderColor;
    }
    return result;
  }

  // src/renderers/promotion/index.ts
  var PromotionRnRenderer = class {
    render(nodes, config) {
      var _a;
      const isScrollable = ((_a = config == null ? void 0 : config.settings) == null ? void 0 : _a.rootContainer) === "scrollable";
      const schemas = nodes.map((node) => {
        var _a2, _b, _c;
        return {
          rnSchema: {
            renderEngine: "React Native",
            _pluginProfile: (_a2 = config == null ? void 0 : config.flavor) != null ? _a2 : "promotion_rn",
            _notes: (_c = (_b = config == null ? void 0 : config.settings) == null ? void 0 : _b.notes) != null ? _c : "",
            // RN Promotions always wrap root in a SafeArea
            root: {
              type: "SafeAreaView",
              scrollEnabled: isScrollable || void 0,
              style: { flex: 1 },
              body: mapNode2(node)
            }
          }
        };
      });
      const payload = schemas.length === 1 ? schemas[0] : schemas;
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
