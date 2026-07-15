// ─────────────────────────────────────────────
// SDUI Typography System
// Maps font properties to SDUI typography styles
// ─────────────────────────────────────────────

export type TypographyStyle =
  | 'headerDefaultBold'      // Bold header (20px)
  | 'headerSSemibold'        // Semi-bold header (16px)
  | 'actionSBold'            // Action semi-bold (14px)
  | 'descriptionDefaultRegular' // Regular description (14px)
  | 'labelXsMedium';         // Small label (12px)

export interface TypographySpec {
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
}

const TYPOGRAPHY_SPECS: Record<TypographyStyle, TypographySpec> = {
  headerDefaultBold: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 24,
  },
  headerSSemibold: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 20,
  },
  actionSBold: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 18,
  },
  descriptionDefaultRegular: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 18,
  },
  labelXsMedium: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 16,
  },
};

export class TypographyMapper {
  /**
   * Map font size and weight to SDUI typography style
   */
  static mapFontToTypography(
    fontSize: number | undefined,
    fontWeight: string | number | undefined,
    role?: string
  ): TypographyStyle {
    if (!fontSize) return 'descriptionDefaultRegular';

    const weight = typeof fontWeight === 'string'
      ? this.parseFontWeight(fontWeight)
      : fontWeight || 400;

    // Bold/semi-bold headers
    if (role === 'heading' && fontSize >= 20 && weight >= 700) {
      return 'headerDefaultBold';
    }

    // Header sizes
    if (fontSize >= 18) {
      return weight >= 600 ? 'headerSSemibold' : 'descriptionDefaultRegular';
    }

    // Action/label sizes
    if (fontSize >= 14 && weight >= 600) {
      return 'actionSBold';
    }

    // Small labels
    if (fontSize < 14) {
      return weight >= 500 ? 'labelXsMedium' : 'descriptionDefaultRegular';
    }

    return 'descriptionDefaultRegular';
  }

  /**
   * Parse CSS font-weight string to numeric value
   */
  private static parseFontWeight(fontWeight: string): number {
    const weightMap: Record<string, number> = {
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
      heavy: 900,
    };

    const lower = fontWeight.toLowerCase();
    if (lower in weightMap) return weightMap[lower];

    const num = parseInt(fontWeight, 10);
    return isNaN(num) ? 400 : Math.min(Math.max(num, 100), 900);
  }

  /**
   * Get typography spec details
   */
  static getSpec(style: TypographyStyle): TypographySpec {
    return TYPOGRAPHY_SPECS[style];
  }

  /**
   * Convert SDUI typography to CSS
   */
  static toCSS(style: TypographyStyle): Record<string, string | number> {
    const spec = this.getSpec(style);
    return {
      fontSize: `${spec.fontSize}px`,
      fontWeight: spec.fontWeight,
      lineHeight: `${spec.lineHeight}px`,
    };
  }
}
