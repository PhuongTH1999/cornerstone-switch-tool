// docs/sdui/sdui-preview.md §9 — payloads T1–T17 to compare against real devices (375 wide, default font size).
import t1 from './T1-financial-products.json'

const text = (value: string, property: object = {}, style: object = {}) => ({ type: 'text', property, value, style })
const column = (children: unknown[], style: object = {}, property: object = {}) => ({ type: 'container', style, property: { layout: 'column', spacing: 8, ...property }, value: { children } })
const row = (children: unknown[], style: object = {}, property: object = {}) => ({ type: 'container', style, property: { layout: 'row', spacing: 0, ...property }, value: { children } })
const image = (size: number, extra: object = {}) => ({ type: 'image', property: {}, value: 'https://static.momocdn.net/app/img/icon/ic_arrow.png', style: { width: size, height: size }, ...extra })
const LONG = 'Ưu đãi giảm 50.000đ cho hóa đơn từ 150.000đ tại toàn bộ cửa hàng Highlands Coffee trên toàn quốc'
const TYPOGRAPHIES = ['headlineDefaultBold', 'headerDefaultBold', 'headerSSemibold', 'headerXsSemibold', 'descriptionDefaultRegular', 'descriptionXsRegular', 'labelSMedium', 'labelXsMedium', 'actionDefaultBold', 'actionSBold', 'actionXsBold']
const page = (label: string) => column([text(label, { typography: 'headerDefaultBold' })], { fillMaxWidth: true, height: 120, backgroundColor: '#FEF8FC' }, { spacing: 0 })

export interface Case { id: string; checks: string; input: unknown }

export const CASES: Case[] = [
  { id: 'T1', checks: 'Mẫu "Financial Products Widget" — toàn bộ', input: t1 },
  { id: 'T2', checks: 'D24: [A] trên-trái, [I] giữa', input: column([text('Ngắn')], { width: 150, height: 124, backgroundColor: '#FFFFFF' }, { spacing: 0 }) },
  { id: 'T3', checks: 'D28', input: column([
    text('Ngắn', { textAlignment: 'leading' }, { width: 200, backgroundColor: '#FEF8FC' }),
    text('Ngắn', { textAlignment: 'center' }, { fillMaxWidth: true, backgroundColor: '#FEF8FC' }),
  ], { width: 343 }) },
  { id: 'T4', checks: 'D29 🔎: [A] text ≤ ½ chỗ còn lại', input: row([text(LONG), { type: 'spacer', property: { minLength: 0 }, value: '' }, image(16)], { width: 343 }) },
  { id: 'T5', checks: 'D30 🔎: row không width trong scrollRow', input: { type: 'container', property: { layout: 'scrollRow', spacing: 8 }, value: { children: [row([text('Text trong row')])] } } },
  { id: 'T6', checks: 'D30 🔎: root column trong feed có child fillMaxHeight', input: column([text('Trên'), text('Giữa', {}, { fillMaxHeight: true, backgroundColor: '#FEF8FC' }), text('Dưới')]) },
  { id: 'T7', checks: 'D31: column height 200, alignment bottom', input: column([text('A'), text('B')], { height: 200, width: 200, backgroundColor: '#FFFFFF' }, { alignment: 'bottom' }) },
  { id: 'T8', checks: 'D32, D33: button không type / type lạ / title rỗng', input: column([
    { type: 'button', property: { ctaType: 'BUTTON' }, value: { title: 'Không type' } },
    { type: 'button', property: { ctaType: 'BUTTON' }, value: { title: 'Type lạ', type: 'abc' } },
    { type: 'button', property: { ctaType: 'BUTTON' }, value: { title: '', type: 'primary' } },
  ]) },
  { id: 'T9', checks: 'D34: TOGGLE + style + onTap', input: { type: 'button', style: { backgroundColor: '#FEF8FC', padding: { all: 8 } },
    onTap: { actions: [{ actionType: 'REDIRECT', featureCode: 'promotion_hub' }] },
    property: { ctaType: 'TOGGLE', actions: [{ actionType: 'CALL_API', endpoint: 'subscribe_reminder', params: { id: '1' } }] }, value: { title: 'Nhắc tôi', type: 'outline' } } },
  { id: 'T10', checks: 'Màu tag §6.4, chiều cao D27', input: column(['info', 'success', 'error', 'warning', 'highlight', undefined].map(tagType => ({ type: 'tag', property: tagType ? { tagType } : {}, value: tagType ?? 'không tagType' }))) },
  { id: 'T11', checks: 'D27, D7: mỗi typography, 3 dòng, có / không lineSpacing 4', input: column(TYPOGRAPHIES.flatMap(typography => [
    text(`${typography}\nDòng 2\nDòng 3`, { typography }),
    text(`${typography} + lineSpacing\nDòng 2\nDòng 3`, { typography, lineSpacing: 4 }),
  ])) },
  { id: 'T12', checks: 'D25: onTap, không backgroundColor, padding 16', input: { ...column([text('Bấm vào padding')], { padding: { all: 16 } }), onTap: { actions: [{ actionType: 'REDIRECT', featureCode: 'promotion_hub' }] } } },
  { id: 'T13', checks: 'D26: [I] bị cắt, [A] tràn', input: column([text('Mộtchữrấtdàikhôngcókhoảngtrắngnào')], { width: 100 }, { spacing: 0 }) },
  { id: 'T14', checks: 'D12, D13: pager 3 trang, có / không paddingIndicator.left', input: column([
    { type: 'pager', style: { fillMaxWidth: true }, property: { paddingIndicator: { bottom: 8 } }, value: { children: [page('Trang 1'), page('Trang 2'), page('Trang 3')] } },
    { type: 'pager', style: { fillMaxWidth: true, height: 120 }, property: { paddingIndicator: { left: 6, top: 0, right: 0, bottom: 8 } }, value: { children: [page('Trang 1'), page('Trang 2'), page('Trang 3')] } },
  ], { width: 343 }) },
  { id: 'T15', checks: 'D15: progressBar barWidth 200 trong khung 343', input: column([
    { type: 'progressBar', property: { color: '#A50064', barWidth: 200 }, value: { currentValue: 300000, maxValue: 1000000, subDes1: 'Đã chi 300k', subDes2: '1tr' } },
  ], { width: 343 }, { spacing: 0 }) },
  { id: 'T16', checks: 'D36: image tintColor "#FFF"', input: image(24, { property: { tintColor: '#FFF' } }) },
  { id: 'T17', checks: 'D35: row có spacer minLength 24 và child cao 12', input: row([image(12), { type: 'spacer', property: { minLength: 24 }, value: '' }, image(12)], { backgroundColor: '#FEF8FC' }) },
]
