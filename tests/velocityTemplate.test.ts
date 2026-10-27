import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildVelocityRequest, findScrollRowMismatches, generateVelocityTemplate, keepFirstScrollRowItem, parseJsonField } from '../src/lib/velocityTemplate'

const schema = {
  type: 'template_widget', templateType: 'SDUI_WIDGET',
  dynamic_fields: [{ path: '$.data[0].value.children[0].value', variable: 'description' }],
  data: [{ type: 'container', property: {}, value: { children: [{ type: 'text', property: {}, value: 'Mô tả ngắn' }] } }],
}

test('raw_json is the template without dynamic_fields; fields travel separately', () => {
  const request = buildVelocityRequest(schema, { containerName: ' vouchers ', loopVariable: '' })
  assert.deepEqual(JSON.parse(request.raw_json), { type: 'template_widget', templateType: 'SDUI_WIDGET', data: schema.data })
  assert.deepEqual(request.dynamic_fields, schema.dynamic_fields)
  assert.equal(request.container_name, 'vouchers')
  assert.equal('loop_variable' in request, false)
})

test('parseJsonField', () => {
  assert.deepEqual(parseJsonField('{"a":1}'), { a: 1 })
  assert.equal(parseJsonField('#foreach($item in $items)'), undefined)
  assert.equal(parseJsonField(''), undefined)
})

const reply = (status: number, body: unknown) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

test('maps the response and fills missing fields', async () => {
  const result = await generateVelocityTemplate(buildVelocityRequest(schema), reply(200, { success: true, rendered_json: '{"type":"template_widget"}' }))
  assert.equal(result.success, true)
  assert.equal(result.rendered_json, '{"type":"template_widget"}')
  assert.deepEqual(result.repeat_detections, [])
  assert.equal(result.velocity_template, '')
})

test('errors: bridge error message, missing bridge', async () => {
  await assert.rejects(generateVelocityTemplate(buildVelocityRequest(schema), reply(502, { error: 'Không kết nối được s.dev.mservice.io:443' })), /Không kết nối được/)
  await assert.rejects(generateVelocityTemplate(buildVelocityRequest(schema), reply(404, 'Not found')), /chỉ có khi chạy/)
})

// root (scrollRow) > 3 cards; card [1] has an extra layer inside its column, card [2] has an image where card [0] has a text
const card = (children: unknown[]) => ({ type: 'container', property: { layout: 'column' }, value: { children: [{ type: 'container', property: { layout: 'column' }, value: { children } }] } })
const list = {
  type: 'template_widget', templateType: 'SDUI_WIDGET',
  dynamic_fields: [
    { path: '$.data[0].value.children[0].value.children[0].value.children[0].value', variable: 'giftPrefix' },
    { path: '$.data[0].value.children[1].value.children[0].value.children[0].value', variable: 'other' },
  ],
  data: [{ type: 'container', property: { layout: 'scrollRow' }, value: { children: [
    card([{ type: 'text', value: 'a' }]),
    card([{ type: 'text', value: 'b' }, { type: 'container', value: { children: [] } }]),
    card([{ type: 'image', value: 'u' }]),
  ] } }],
}

test('findScrollRowMismatches points at the first difference of each item', () => {
  assert.deepEqual(findScrollRowMismatches(list), [
    { listPath: '$.data[0]', item: 1, path: '$.data[0].value.children[1].value.children[0]', indexes: [1, 0], reason: '2 child thay vì 1' },
    { listPath: '$.data[0]', item: 2, path: '$.data[0].value.children[2].value.children[0].value.children[0]', indexes: [2, 0, 0], reason: 'type "image" thay vì "text"' },
  ])
  assert.deepEqual(findScrollRowMismatches({ data: [{ type: 'container', property: { layout: 'scrollRow' }, value: { children: [card([]), card([])] } }] }), [])
})

test('keepFirstScrollRowItem keeps item [0] and drops fields bound inside the removed items', () => {
  const { schema, dropped } = keepFirstScrollRowItem(list)
  assert.equal((schema.data as any)[0].value.children.length, 1)
  assert.deepEqual(dropped.map(field => field.variable), ['other'])
  assert.deepEqual((schema.dynamic_fields as any[]).map(field => field.variable), ['giftPrefix'])
  assert.equal(list.data[0].value.children.length, 3, 'input not mutated')
})
