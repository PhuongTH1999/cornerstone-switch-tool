/**
 * SDUI Integration Examples
 * Shows how to use converter, parser, and validator
 */

import {
  SDUIConverter,
  SDUIComponent,
  SDUIValidator,
  FigmaSDUIParser,
  TypographyMapper,
} from '../../src/renderers/sdui';
import { EnrichedNode } from '../../src/core/types';

// ─────────────────────────────────────────────
// Example 1: Create SDUI component manually
// ─────────────────────────────────────────────

function example1_createComponent() {
  const component: SDUIComponent = {
    type: 'container',
    style: {
      backgroundColor: '#FFFFFF',
      cornerRadius: 12,
      padding: { all: 16 },
      fillMaxWidth: true,
    },
    property: {
      layout: 'column',
      spacing: 8,
      alignment: 'center',
    },
    value: {
      children: [
        {
          type: 'text',
          property: {
            typography: 'headerDefaultBold',
            color: '#303233',
            lineLimit: 1,
          },
          value: 'Welcome',
        },
        {
          type: 'button',
          property: {
            ctaType: 'BUTTON',
            color: '#A50064',
          },
          value: {
            title: 'Click Me',
            type: 'primary',
          },
        },
      ],
    },
  };

  // Convert to template
  const template = SDUIConverter.toTemplate([component], 'welcome_screen');
  console.log('Template:', JSON.stringify(template, null, 2));
}

// ─────────────────────────────────────────────
// Example 2: Parse Figma nodes
// ─────────────────────────────────────────────

function example2_parseFromFigma(nodes: EnrichedNode[]) {
  // Parse Figma nodes to SDUI components
  const components = FigmaSDUIParser.parseFrame(nodes);

  console.log(`Parsed ${components.length} components from Figma`);
  components.forEach((comp, i) => {
    console.log(`  [${i}] ${comp.type}`);
  });

  return components;
}

// ─────────────────────────────────────────────
// Example 3: Convert and validate
// ─────────────────────────────────────────────

function example3_convertAndValidate(components: SDUIComponent[]) {
  // Generate unique block_id
  const blockId = SDUIConverter.generateBlockId('marketing_promo');

  // Convert to template
  const template = SDUIConverter.toTemplate(components, blockId);

  // Validate
  const result = SDUIValidator.validate(template);

  if (result.valid) {
    console.log('✓ Template is valid');
  } else {
    console.log('✗ Validation failed:');
    console.log(SDUIValidator.formatResult(result));
  }

  return template;
}

// ─────────────────────────────────────────────
// Example 4: Typography mapping
// ─────────────────────────────────────────────

function example4_typographyMapping() {
  // Map different font sizes to typography styles
  const mappings = [
    { fontSize: 20, fontWeight: 700, expected: 'headerDefaultBold' },
    { fontSize: 16, fontWeight: 600, expected: 'headerSSemibold' },
    { fontSize: 14, fontWeight: 600, expected: 'actionSBold' },
    { fontSize: 14, fontWeight: 400, expected: 'descriptionDefaultRegular' },
    { fontSize: 12, fontWeight: 500, expected: 'labelXsMedium' },
  ];

  mappings.forEach(({ fontSize, fontWeight, expected }) => {
    const result = TypographyMapper.mapFontToTypography(fontSize, fontWeight);
    const match = result === expected ? '✓' : '✗';
    console.log(`${match} ${fontSize}px/${fontWeight} → ${result}`);
  });
}

// ─────────────────────────────────────────────
// Example 5: Complete pipeline
// ─────────────────────────────────────────────

async function example5_completePipeline(figmaNodes: EnrichedNode[]) {
  console.log('=== SDUI Export Pipeline ===\n');

  // Step 1: Parse from Figma
  console.log('Step 1: Parse from Figma');
  const components = FigmaSDUIParser.parseFrame(figmaNodes);
  console.log(`  Parsed ${components.length} components\n`);

  // Step 2: Generate block_id
  console.log('Step 2: Generate block_id');
  const blockId = SDUIConverter.generateBlockId('marketing_campaign');
  console.log(`  Generated: ${blockId}\n`);

  // Step 3: Convert to template
  console.log('Step 3: Convert to template');
  const template = SDUIConverter.toTemplate(components, blockId);
  console.log(`  Template created\n`);

  // Step 4: Validate
  console.log('Step 4: Validate template');
  const validation = SDUIValidator.validate(template);
  if (validation.valid) {
    console.log('  ✓ Valid\n');
  } else {
    console.log('  ✗ Invalid:');
    validation.errors.forEach((e) => {
      console.log(`    ${e.path}: ${e.message}`);
    });
    console.log();
  }

  // Step 5: Export
  console.log('Step 5: Export to JSON');
  const json = JSON.stringify(template, null, 2);
  console.log(`  JSON size: ${json.length} bytes\n`);

  return json;
}

// ─────────────────────────────────────────────
// Example 6: Error handling
// ─────────────────────────────────────────────

function example6_errorHandling() {
  // Invalid component
  const invalidComponent: SDUIComponent = {
    type: 'button',
    property: {
      ctaType: 'BUTTON',
    },
    value: {}, // Missing 'title'
  };

  const validation = SDUIValidator.validate({
    lazy_loads: [
      {
        type: 'server_driven_widget',
        block_id: 'test',
        data: [
          {
            type: 'template_widget',
            templateType: 'SDUI_WIDGET',
            data: [invalidComponent],
          },
        ],
      },
    ],
    first_loads: [],
  });

  console.log('Error example:');
  console.log(SDUIValidator.formatResult(validation));
}

// ─────────────────────────────────────────────
// Example 7: Optimization
// ─────────────────────────────────────────────

function example7_optimization() {
  // Component with empty children
  const component: SDUIComponent = {
    type: 'container',
    style: { backgroundColor: '#FFF' },
    property: { layout: 'column' },
    value: {
      children: [
        {
          type: 'text',
          property: { typography: 'headerDefaultBold' },
          value: 'Hello',
        },
        // Empty container
        {
          type: 'container',
          style: {},
          property: {},
          value: { children: [] },
        },
      ],
    },
  };

  console.log('Before optimization:');
  console.log(
    `  Children count: ${component.value?.children?.length || 0}`
  );

  // Optimize
  const optimized = SDUIConverter.optimize(component);

  console.log('After optimization:');
  console.log(
    `  Children count: ${optimized?.value?.children?.length || 0}`
  );
}

// ─────────────────────────────────────────────
// Example 8: Real-world promotion card
// ─────────────────────────────────────────────

function example8_promotionCard() {
  const promotionCard: SDUIComponent = {
    type: 'container',
    style: {
      backgroundColor: '#FFFFFF',
      cornerRadius: 12,
      padding: { all: 12 },
      fillMaxWidth: true,
    },
    property: {
      layout: 'row',
      spacing: 12,
      alignment: 'center',
    },
    value: {
      children: [
        {
          type: 'image',
          style: {
            width: 52,
            height: 52,
            cornerRadius: 26,
          },
          property: { contentMode: 'fill' },
          value: 'https://static.momocdn.net/app/icon/promotion/banner.png',
        },
        {
          type: 'container',
          style: { fillMaxWidth: true },
          property: { layout: 'column', spacing: 2 },
          value: {
            children: [
              {
                type: 'text',
                property: {
                  typography: 'headerSSemibold',
                  color: '#303233',
                  lineLimit: 1,
                },
                value: 'Summer Sale 2026',
              },
              {
                type: 'text',
                property: {
                  typography: 'descriptionDefaultRegular',
                  color: '#727272',
                  lineLimit: 2,
                },
                value: 'Up to 50% off on all items',
              },
            ],
          },
        },
        {
          type: 'button',
          property: {
            ctaType: 'BUTTON',
            color: '#A50064',
          },
          value: {
            title: 'Collect',
            type: 'primary',
          },
        },
      ],
    },
  };

  const template = SDUIConverter.toTemplate([promotionCard], 'summer_promo_2026');
  const validation = SDUIValidator.validate(template);

  console.log('Promotion Card:');
  console.log(JSON.stringify(template, null, 2));
  console.log('\nValidation:', validation.valid ? '✓ Valid' : '✗ Invalid');

  return template;
}

// ─────────────────────────────────────────────
// Run examples
// ─────────────────────────────────────────────

if (require.main === module) {
  console.log('Example 1: Create Component');
  example1_createComponent();
  console.log('\n---\n');

  console.log('Example 4: Typography Mapping');
  example4_typographyMapping();
  console.log('\n---\n');

  console.log('Example 6: Error Handling');
  example6_errorHandling();
  console.log('\n---\n');

  console.log('Example 7: Optimization');
  example7_optimization();
  console.log('\n---\n');

  console.log('Example 8: Promotion Card');
  example8_promotionCard();
}

export {
  example1_createComponent,
  example2_parseFromFigma,
  example3_convertAndValidate,
  example4_typographyMapping,
  example5_completePipeline,
  example6_errorHandling,
  example7_optimization,
  example8_promotionCard,
};
