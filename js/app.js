  // ===== STATE =====
  let state = {
    globalFlow: 'native', // 'native' | 'rn'
    rules: [
      { id: 'r1', platform: 'android', platVer: '', pkgVer: '2.0.0-2.3.0', device: 'Pixel 6', refId: 'ref_checkout', blockId: 'block_002', flow: 'rn', enabled: true, note: 'Native crash on Pixel 6 — fallback RN' },
      { id: 'r2', platform: 'ios', platVer: '16.0-16.5', pkgVer: '', device: 'iPhone 12', refId: 'ref_profile', blockId: 'block_003', flow: 'rn', enabled: true, note: 'Native unstable on iOS 16.0-16.5' },
    ]
  };

  let selectedFlow = 'rn';
  let activeFilter = 'all';
  let searchQuery = '';

  // ===== HELPERS =====
  function uid() { return 'r' + Date.now().toString(36); }

  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = (type === 'success' ? '✓ ' : 'ℹ ') + msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.className = 'toast', 2500);
  }

  // ===== GLOBAL TOGGLE =====
  function toggleGlobal() {
    state.globalFlow = state.globalFlow === 'native' ? 'rn' : 'native';
    renderGlobalToggle();
    saveLocal();
  }

  function renderGlobalToggle() {
    const track = document.getElementById('globalToggle');
    const badge = document.getElementById('globalBadge');
    const badgeText = document.getElementById('globalBadgeText');
    if (state.globalFlow === 'native') {
      track.className = 'toggle-track native-on';
      badge.className = 'flow-badge native';
      badgeText.textContent = 'Native Active';
    } else {
      track.className = 'toggle-track rn-on';
      badge.className = 'flow-badge rn';
      badgeText.textContent = 'React Native Active';
    }
  }

  // ===== TABS =====
  function switchTab(name, btn) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    btn.classList.add('active');
    if (name === 'json') renderJSON();
  }

  // ===== RENDER RULES =====
  function getFilteredRules() {
    return state.rules.filter(r => {
      if (activeFilter === 'native' && r.flow !== 'native') return false;
      if (activeFilter === 'rn' && r.flow !== 'rn') return false;
      if (activeFilter === 'ios' && r.platform !== 'ios') return false;
      if (activeFilter === 'android' && r.platform !== 'android') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (r.device||'').toLowerCase().includes(q) ||
                (r.refId||'').toLowerCase().includes(q) ||
                (r.blockId||'').toLowerCase().includes(q) ||
                (r.note||'').toLowerCase().includes(q);
      }
      return true;
    });
  }

  function renderRules() {
    const list = document.getElementById('rulesList');
    const filtered = getFilteredRules();

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No rules found.<br>Add a new rule to get started.</div></div>`;
    } else {
      list.innerHTML = filtered.map(r => `
      <div class="rule-card ${r.flow} ${r.enabled ? '' : 'disabled'}" id="card_${r.id}">
        <div class="rule-field">
          <label>Platform / Version</label>
          <div class="rule-field-value">${r.platform ? r.platform.toUpperCase() : '<span class="empty">Any</span>'} ${r.platVer || ''}</div>
        </div>
        <div class="rule-field">
          <label>Pkg Version</label>
          <div class="rule-field-value ${r.pkgVer ? '' : 'empty'}">${r.pkgVer || 'Any'}</div>
        </div>
        <div class="rule-field">
          <label>Device</label>
          <div class="rule-field-value ${r.device ? '' : 'empty'}">${r.device || 'Any'}</div>
        </div>
        <div class="rule-field">
          <label>refId → blockId</label>
          <div class="rule-field-value ${r.refId ? '' : 'empty'}" style="font-size:12px;">${r.refId || '—'} ${r.refId && r.blockId ? '<span style="color:var(--text-muted)">→</span> '+r.blockId : ''}</div>
          ${r.note ? `<div style="font-size:10px;color:var(--text-muted);margin-top:3px;">${r.note}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <span class="badge-flow ${r.flow}">${r.flow === 'native' ? '⚙ Native' : '⚛ RN'}</span>
          <div class="rule-actions">
            <button class="btn btn-ghost btn-icon" title="${r.enabled ? 'Disable' : 'Enable'}" onclick="toggleRule('${r.id}')">${r.enabled ? '⏸' : '▶'}</button>
            <button class="btn btn-danger btn-icon" title="Delete" onclick="deleteRule('${r.id}')">✕</button>
          </div>
        </div>
      </div>
    `).join('');
    }

    renderStats();
    renderJSON();
  }

  function renderStats() {
    const nativeCount = state.rules.filter(r => r.flow === 'native' && r.enabled).length;
    const rnCount = state.rules.filter(r => r.flow === 'rn' && r.enabled).length;
    const disabledCount = state.rules.filter(r => !r.enabled).length;

    document.getElementById('statsBar').innerHTML = `
    <div class="stat-chip">
      <div><div class="stat-num native">${nativeCount}</div><div class="stat-label">Native override</div></div>
    </div>
    <div class="stat-chip">
      <div><div class="stat-num rn">${rnCount}</div><div class="stat-label">RN fallback</div></div>
    </div>
    <div class="stat-chip">
      <div><div class="stat-num" style="color:var(--text-muted)">${disabledCount}</div><div class="stat-label">Disabled</div></div>
    </div>
    <div class="stat-chip">
      <div><div class="stat-num" style="color:var(--accent)">${state.rules.length}</div><div class="stat-label">Total rules</div></div>
    </div>
  `;
  }

  // ===== FILTERS =====
  function filterRules(type, btn) {
    activeFilter = type;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderRules();
  }

  function searchRules(val) {
    searchQuery = val;
    renderRules();
  }

  // ===== ADD/DELETE/TOGGLE RULE =====
  function toggleAddForm() {
    const f = document.getElementById('addForm');
    f.classList.toggle('open');
  }

  function selectFlow(flow) {
    selectedFlow = flow;
    document.getElementById('seg_native').className = 'segment-btn' + (flow === 'native' ? ' active-native' : '');
    document.getElementById('seg_rn').className = 'segment-btn' + (flow === 'rn' ? ' active-rn' : '');
  }

  function addRule() {
    const rule = {
      id: uid(),
      platform: document.getElementById('f_platform').value,
      platVer: document.getElementById('f_platVer').value.trim(),
      pkgVer: document.getElementById('f_pkgVer').value.trim(),
      device: document.getElementById('f_device').value.trim(),
      refId: document.getElementById('f_refId').value.trim(),
      blockId: document.getElementById('f_blockId').value.trim(),
      flow: selectedFlow,
      enabled: true,
      note: document.getElementById('f_note').value.trim(),
    };

    state.rules.push(rule);
    renderRules();
    saveLocal();
    toggleAddForm();

    // Reset form
    ['f_platform','f_platVer','f_pkgVer','f_device','f_refId','f_blockId','f_note'].forEach(id => {
      const el = document.getElementById(id);
      if (el.tagName === 'SELECT') el.value = '';
      else el.value = '';
    });

    showToast('Rule added successfully');
  }

  function deleteRule(id) {
    state.rules = state.rules.filter(r => r.id !== id);
    renderRules();
    saveLocal();
    showToast('Rule deleted', 'info');
  }

  function toggleRule(id) {
    const r = state.rules.find(r => r.id === id);
    if (r) { r.enabled = !r.enabled; renderRules(); saveLocal(); }
  }

  // ===== JSON =====
  function buildConfig() {
    return {
      version: '1.0',
      updatedAt: new Date().toISOString(),
      globalDefaultFlow: state.globalFlow,
      rules: state.rules.filter(r => r.enabled).map(({ id, enabled, ...rest }) => rest)
    };
  }

  function syntaxHighlight(json) {
    return json
            .replace(/("[\w@-]+")\s*:/g, '<span class="key">$1</span>:')
            .replace(/: (".*?")/g, ': <span class="str">$1</span>')
            .replace(/: (\d+\.?\d*)/g, ': <span class="num">$1</span>')
            .replace(/: (true|false)/g, (m, v) => `: <span class="${v === 'true' ? 'bool-native' : 'bool-rn'}">${v}</span>`);
  }

  function renderJSON() {
    const json = JSON.stringify(buildConfig(), null, 2);
    document.getElementById('jsonOutput').innerHTML = syntaxHighlight(json);
  }

  function copyJSON() {
    navigator.clipboard.writeText(JSON.stringify(buildConfig(), null, 2));
    showToast('JSON copied to clipboard');
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(buildConfig(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cornerstone-flow-config.json';
    a.click();
    showToast('Config exported');
  }

  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const cfg = JSON.parse(ev.target.result);
        if (cfg.globalDefaultFlow) state.globalFlow = cfg.globalDefaultFlow;
        if (cfg.rules) state.rules = cfg.rules.map(r => ({ ...r, id: uid(), enabled: true }));
        renderGlobalToggle();
        renderRules();
        saveLocal();
        showToast('Config imported successfully');
      } catch { showToast('Invalid JSON file', 'info'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ===== SIMULATOR =====
  function versionInRange(version, range) {
    if (!range || !version) return true;
    version = version.trim();
    range = range.trim();

    if (range.startsWith('>=')) {
      const min = range.slice(2).trim();
      return compareVer(version, min) >= 0;
    }
    if (range.startsWith('<=')) {
      const max = range.slice(2).trim();
      return compareVer(version, max) <= 0;
    }
    if (range.includes('-')) {
      const [min, max] = range.split('-').map(s => s.trim());
      return compareVer(version, min) >= 0 && compareVer(version, max) <= 0;
    }
    return version === range;
  }

  function compareVer(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pa[i]||0) - (pb[i]||0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  function runSimulator() {
    const input = {
      platform: document.getElementById('sim_platform').value,
      platVer: document.getElementById('sim_platVer').value.trim(),
      pkgVer: document.getElementById('sim_pkgVer').value.trim(),
      device: document.getElementById('sim_device').value.trim(),
      refId: document.getElementById('sim_refId').value.trim(),
      blockId: document.getElementById('sim_blockId').value.trim(),
    };

    const matched = [];
    for (const rule of state.rules) {
      if (!rule.enabled) continue;
      let match = true;
      const reasons = [];

      if (rule.platform && rule.platform !== input.platform) { match = false; }
      else if (rule.platform) reasons.push(`platform = ${input.platform}`);

      if (match && rule.platVer && !versionInRange(input.platVer, rule.platVer)) match = false;
      else if (match && rule.platVer) reasons.push(`platVer ${rule.platVer}`);

      if (match && rule.pkgVer && !versionInRange(input.pkgVer, rule.pkgVer)) match = false;
      else if (match && rule.pkgVer) reasons.push(`pkgVer ${rule.pkgVer}`);

      if (match && rule.device && !input.device.toLowerCase().includes(rule.device.toLowerCase())) match = false;
      else if (match && rule.device) reasons.push(`device "${rule.device}"`);

      if (match && rule.refId && rule.refId !== input.refId) match = false;
      else if (match && rule.refId) reasons.push(`refId = ${rule.refId}`);

      if (match && rule.blockId && rule.blockId !== input.blockId) match = false;
      else if (match && rule.blockId) reasons.push(`blockId = ${rule.blockId}`);

      if (match) matched.push({ rule, reasons });
    }

    const result = matched.length > 0 ? matched[0] : null;
    const finalFlow = result ? result.rule.flow : state.globalFlow;
    const isNative = finalFlow === 'native';

    const div = document.getElementById('simResult');
    div.style.display = 'block';
    div.innerHTML = `
    <div style="background:var(--surface); border:1px solid ${isNative ? 'var(--native)' : 'var(--rn)'}; border-radius:12px; padding:24px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
        <div style="font-size:32px;">${isNative ? '⚙' : '⚛'}</div>
        <div>
          <div style="font-family:var(--sans); font-size:22px; font-weight:800; color:${isNative ? 'var(--native)' : 'var(--rn)'}">
            ${isNative ? 'Cornerstone Native' : 'React Native'}
          </div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
            ${result ? 'Matched rule: ' + (result.rule.note || result.rule.id) : 'No rule matched — using global default'}
          </div>
        </div>
      </div>
      ${result ? `
        <div style="background:var(--surface2); border-radius:8px; padding:12px 16px; font-size:12px; color:var(--text-dim);">
          <div style="color:var(--text-muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:1px; font-size:10px;">Match conditions</div>
          ${result.reasons.map(r => `<div>✓ ${r}</div>`).join('')}
        </div>
      ` : `
        <div style="font-size:12px; color:var(--text-muted);">Fallback to global default: <strong style="color:${isNative ? 'var(--native)' : 'var(--rn)'}">${state.globalFlow}</strong></div>
      `}
    </div>
    ${matched.length > 1 ? `<div style="font-size:11px; color:var(--text-muted); padding:8px 0;">⚠ ${matched.length - 1} other rule(s) also matched but were not applied (first match wins)</div>` : ''}
  `;
  }

  // ===== LOCAL STORAGE =====
  function saveLocal() {
    try { localStorage.setItem('cs_flow_state', JSON.stringify(state)); } catch(e) {}
  }

  function loadLocal() {
    try {
      const s = localStorage.getItem('cs_flow_state');
      if (s) state = JSON.parse(s);
    } catch(e) {}
  }

  // ===== INIT =====
  loadLocal();
  renderGlobalToggle();
  renderRules();

  // ==================== SDUI GENERATOR ====================

  // Default SDUI Knowledge Base (built-in). User can override via upload.
  const SDUI_KB_DEFAULT = `# Hướng Dẫn SDUI Cấu Trúc Giao Diện & Dữ Liệu (MoMo Native Widget)

Tài liệu này là đặc tả kỹ thuật (Specification) chuẩn của hệ thống Server-Driven UI (SDUI) dành riêng cho MoMo Native Widget (Android & iOS).

## 1. Cấu Trúc Khung Của dataSchema

Cấu trúc cơ bản: "dataSchema" chứa "header" và các "content_*" (key tự định nghĩa theo biến thể: content_info, content_ranking, content...).

\`\`\`json
"dataSchema": {
  "header": { "showHeader": false, "backgroundImage": "" },
  "content_info": {
    "value": {
      "modifier": { ... },
      "header": { ... },
      "body": { "layout": "column", "modifier": { ... }, "children": [ ... ] },
      "footer": { ... }
    }
  }
}
\`\`\`

## 2. Layout System
- "layout": "row" — xếp ngang (Row / HStack)
- "layout": "column" — xếp dọc (Column / VStack)

## 3. Modifier
### Alignment & Arrangement
- arrangement (main axis):
  - row: start, center, end, spaceBetween, spaceAround, spaceEvenly
  - column: top, center, bottom, start, spaceBetween
- alignment (cross axis):
  - row: top, center, bottom, start
  - column: start, center, end

### Size
- fillMaxWidth (bool), fillMaxHeight (bool), fillMaxSize (bool)
- width (px), height (px)
- weight (number): Chỉ dùng trong children của layout để chiếm tỉ lệ dư, cực kỳ quan trọng để đẩy component dạt lề

### Styling
- padding: number hoặc {top, bottom, left, right}
- backgroundColor: hex string
- cornerRadius: number
- border: {width, color}

## 4. Components

### TEXT
\`\`\`json
{
  "componentType": "TEXT",
  "field": "name",
  "modifier": { "padding": { "bottom": 4 } },
  "style": {
    "typography": "labelXsMedium",
    "color": "#727272",
    "fontWeight": "500",
    "maxLines": 1
  }
}
\`\`\`
typography: labelXsMedium, headerSSemibold, descriptionDefaultRegular, actionSBold, headerXsSemibold, descriptionXsRegular

### ICON
\`\`\`json
{
  "componentType": "ICON",
  "field": "icon",
  "iconSize": 32,
  "modifier": { "padding": { "right": 4 } }
}
\`\`\`

### CTA_BUTTON
\`\`\`json
{ "componentType": "CTA_BUTTON", "modifier": { "alignment": "end" } }
\`\`\`

### ITEM_LIST (Dynamic Array)
\`\`\`json
{
  "componentType": "ITEM_LIST",
  "field": "items",
  "maxItems": 3,
  "modifier": { "alignment": "start", "fillMaxHeight": true },
  "itemTemplate": {
    "layout": "row",
    "modifier": { "fillMaxWidth": true, "alignment": "center" },
    "children": [
      { "componentType": "ICON", "field": "icon", "iconSize": 16 },
      { "componentType": "TEXT", "field": "label", "modifier": { "weight": 1 } },
      { "componentType": "TEXT", "field": "value", "style": { "typography": "headerXsSemibold", "color": "#303233" } }
    ]
  }
}
\`\`\`

## 5. Data Binding Fields
- Root: name, description, subDescription, icon, cardImage
- titleInformation.content, titleInformation.icon
- quantityLabel.content, quantityLabel.icon
- items (array, dùng với ITEM_LIST). Child fields: label, value, icon

## 6. Nguyên Tắc Sống Còn
1. alignment vs arrangement: column → arrangement = top-bottom, alignment = left-right. Row ngược lại.
2. Dán component vào góc Bottom Right: wrapper phải có fillMaxWidth: true, fillMaxHeight: true, arrangement: "bottom" hoặc "spaceBetween", alignment: "end"
3. Đẩy element sang mép: wrapper = row, Item trái có modifier: { weight: 1 }, Item phải tự động dạt lề
4. Mặc định text: maxLines: 1 trừ khi thiết kế cho thấy nhiều dòng
`;

  const SDUI_SYSTEM_PROMPT_DEFAULT = `# Role
Bạn là Senior Frontend/Mobile Engineer kiêm chuyên gia Server-Driven UI (SDUI). Nhiệm vụ: nhận ảnh bản thiết kế UI (mockup), phân tích layout và sinh mã JSON \`dataSchema\` chính xác theo đặc tả SDUI của MoMo.

# Data & Context
Luôn bám theo tài liệu SDUI_README trong Knowledge Base. TUYỆT ĐỐI không tự bịa modifier hoặc component không có trong spec.

# Workflow
1. Phân tích: xác định layout gốc (row/column), viền, màu nền, padding tổng thể
2. Cấu trúc cây: đi từ ngoài vào trong, xác định các khối Row/Column lồng nhau và Components (ICON, TEXT, ITEM_LIST)
3. Mapping data: phán đoán field từ visual (tên → name, biểu tượng → icon, mô tả → description, etc.)
4. Generate JSON: trả về khối JSON cho \`value\` của content_* chuẩn chỉnh

# Rules
- Dùng fillMaxWidth/fillMaxHeight khi cần căn lề với alignment/arrangement
- Phân biệt RÕ arrangement (trục chính) vs alignment (trục phụ)
- Dùng modifier: { "weight": 1 } để đẩy component dạt mép (cực kỳ phổ biến)
- Text mặc định maxLines: 1 trừ khi thiết kế cho nhiều dòng
- KHÔNG gen khóa thư viện ngoại lai, chỉ dùng JSON thuần như trong spec

# Output Format
QUAN TRỌNG: Trả về DUY NHẤT 1 code block JSON hợp lệ (bọc trong \`\`\`json ... \`\`\`). Không giải thích dài dòng. Có thể thêm 1-2 câu phân tích ngắn TRƯỚC code block nếu cần.

Cấu trúc:
\`\`\`json
{
  "layout": "row|column",
  "modifier": { ... },
  "children": [ ... ]
}
\`\`\``;

  // ===== SDUI STATE =====
  let sduiState = {
    apiKey: '',
    model: 'claude-sonnet-4-6',
    systemPrompt: SDUI_SYSTEM_PROMPT_DEFAULT,
    kb: SDUI_KB_DEFAULT,
    kbName: 'default (built-in)',
    preset: 'content_info',
    mode: 'api', // 'api' | 'prompt'
    outputFormat: 'full', // 'raw' | 'wrap' | 'full'
    currentImage: null, // { dataUrl, mediaType, filename, base64 }
    figmaSchema: null, // extracted node tree from Figma (only when imported via Figma)
    currentOutput: '',
    history: [] // [{ id, timestamp, thumbnail, title, preset, context, output, mode }]
  };

  function sduiLoadState() {
    try {
      const s = localStorage.getItem('sdui_state');
      if (s) {
        const parsed = JSON.parse(s);
        sduiState = { ...sduiState, ...parsed };
      }
    } catch(e) {}
  }

  function sduiSaveState() {
    try {
      // Don't persist the currentImage or figmaSchema (too big); persist everything else
      const { currentImage, figmaSchema, ...toSave } = sduiState;
      localStorage.setItem('sdui_state', JSON.stringify(toSave));
    } catch(e) {
      console.warn('SDUI state save failed (quota?)', e);
    }
  }

  // ===== SDUI UI RENDER =====
  function sduiRenderPills() {
    const apiPill = document.getElementById('sduiApiPill');
    const kbPill = document.getElementById('sduiKbPill');
    if (sduiState.apiKey) {
      apiPill.className = 'sdui-pill ok';
      apiPill.textContent = 'API: Ready';
    } else {
      apiPill.className = 'sdui-pill warn';
      apiPill.textContent = 'API: Not Set';
    }
    kbPill.className = sduiState.kbName.startsWith('default') ? 'sdui-pill' : 'sdui-pill ok';
    kbPill.textContent = 'KB: ' + (sduiState.kbName.startsWith('default') ? 'Default' : 'Custom');
    document.getElementById('sduiKbInfo').textContent = 'Using: ' + sduiState.kbName;
  }

  function sduiRenderMode() {
    // Toggle buttons
    document.querySelectorAll('#sduiModeToggle .sdui-mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === sduiState.mode);
    });
    // Mode-specific blocks
    document.getElementById('sduiModeApiBlock').classList.toggle('active', sduiState.mode === 'api');
    document.getElementById('sduiModePromptBlock').classList.toggle('active', sduiState.mode === 'prompt');
    // Schema preview (only visible in prompt mode + when schema available)
    sduiRenderSchemaPreview();
  }

  function sduiRenderSchemaPreview() {
    const wrap = document.getElementById('sduiSchemaWrap');
    const pre = document.getElementById('sduiSchemaPreview');
    if (!wrap || !pre) return;
    if (sduiState.mode === 'prompt' && sduiState.figmaSchema) {
      wrap.style.display = 'block';
      try {
        pre.textContent = JSON.stringify(sduiState.figmaSchema, null, 2);
      } catch { pre.textContent = '(unable to serialize schema)'; }
    } else {
      wrap.style.display = 'none';
    }
  }

  function sduiRenderAll() {
    sduiRenderPills();
    sduiRenderMode();
    document.getElementById('sduiModel').value = sduiState.model;
    document.getElementById('sduiApiKey').value = sduiState.apiKey || '';
    document.getElementById('sduiSystemPrompt').value = sduiState.systemPrompt;
    document.getElementById('sduiKbPreview').textContent = sduiState.kb;

    // Preset chips
    document.querySelectorAll('#sduiPresets .sdui-preset-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.preset === sduiState.preset);
    });

    // Format tabs
    document.querySelectorAll('.sdui-format-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.format === (sduiState.outputFormat || 'full'));
    });

    sduiRenderOutput();
    sduiRenderHistory();
  }

  // ===== CONFIG HANDLERS =====
  function sduiSaveApiKey() {
    sduiState.apiKey = document.getElementById('sduiApiKey').value.trim();
    sduiSaveState();
    sduiRenderPills();
    showToast(sduiState.apiKey ? 'API key saved' : 'API key cleared');
  }

  function sduiClearApiKey() {
    sduiState.apiKey = '';
    document.getElementById('sduiApiKey').value = '';
    sduiSaveState();
    sduiRenderPills();
    showToast('API key cleared');
  }

  document.getElementById('sduiModel').addEventListener('change', (e) => {
    sduiState.model = e.target.value;
    sduiSaveState();
  });

  function sduiUploadKB(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      sduiState.kb = e.target.result;
      sduiState.kbName = file.name;
      sduiSaveState();
      sduiRenderPills();
      document.getElementById('sduiKbPreview').textContent = sduiState.kb;
      showToast('KB uploaded: ' + file.name);
    };
    reader.readAsText(file);
  }

  function sduiResetKB() {
    sduiState.kb = SDUI_KB_DEFAULT;
    sduiState.kbName = 'default (built-in)';
    sduiSaveState();
    sduiRenderPills();
    document.getElementById('sduiKbPreview').textContent = sduiState.kb;
    showToast('KB reset to default');
  }

  function sduiSaveSystemPrompt() {
    sduiState.systemPrompt = document.getElementById('sduiSystemPrompt').value;
    sduiSaveState();
    showToast('System prompt saved');
  }

  function sduiResetSystemPrompt() {
    sduiState.systemPrompt = SDUI_SYSTEM_PROMPT_DEFAULT;
    document.getElementById('sduiSystemPrompt').value = sduiState.systemPrompt;
    sduiSaveState();
    showToast('System prompt reset');
  }

  // ===== IMAGE HANDLERS =====
  function sduiHandleImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    sduiLoadImage(file);
  }

  function sduiLoadImage(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'warn');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image too large (max 5MB)', 'warn');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      sduiState.currentImage = {
        dataUrl,
        mediaType: file.type,
        filename: file.name,
        base64: dataUrl.split(',')[1]
      };
      document.getElementById('sduiPreviewImg').src = dataUrl;
      document.getElementById('sduiPreview').classList.add('show');
    };
    reader.readAsDataURL(file);
  }

  function sduiClearImage() {
    sduiState.currentImage = null;
    sduiState.figmaSchema = null;
    document.getElementById('sduiPreview').classList.remove('show');
    document.getElementById('sduiPreviewImg').src = '';
    document.getElementById('sduiImgFile').value = '';
    sduiRenderSchemaPreview();
    // Reset step 1 done mark
    const step1 = document.getElementById('sduiStep1');
    if (step1) step1.classList.remove('done');
  }

  // Paste from clipboard via button click (Clipboard API — needs HTTPS or localhost)
  async function sduiPasteFromClipboard() {
    if (!navigator.clipboard || !navigator.clipboard.read) {
      showToast('Clipboard API not supported — use Ctrl/Cmd+V instead', 'warn');
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find(t => t.startsWith('image/'));
        if (imgType) {
          const blob = await item.getType(imgType);
          const file = new File([blob], 'clipboard.png', { type: imgType });
          sduiLoadImage(file);
          showToast('Image pasted from clipboard');
          return;
        }
      }
      showToast('No image in clipboard — copy an image from Figma first', 'warn');
    } catch(err) {
      if (err.name === 'NotAllowedError') {
        showToast('Clipboard permission denied — use Ctrl/Cmd+V instead', 'warn');
      } else {
        showToast('Paste failed: ' + err.message, 'warn');
      }
    }
  }

  // Load image from URL (e.g., Figma export link, Imgur, etc.)
  async function sduiLoadFromUrl(url) {
    url = (url || '').trim();
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) {
        showToast('URL does not point to an image', 'warn');
        return;
      }
      const file = new File([blob], 'from-url.' + (blob.type.split('/')[1] || 'png'), { type: blob.type });
      sduiLoadImage(file);
      document.getElementById('sduiImgUrl').value = '';
      document.getElementById('sduiImgUrl').classList.remove('show-url');
      showToast('Image loaded from URL');
    } catch(err) {
      showToast('Failed to load URL: ' + err.message + ' (CORS?)', 'warn');
    }
  }

  // Drag & drop
  (function setupSduiDrop() {
    const dz = document.getElementById('sduiDropzone');
    if (!dz) return;
    ['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      dz.classList.add('drag');
    }));
    ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      dz.classList.remove('drag');
    }));
    dz.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file) sduiLoadImage(file);
    });
    // Paste from clipboard (works anywhere in SDUI panel, including inside textareas for image paste)
    document.addEventListener('paste', (e) => {
      const sduiPanel = document.getElementById('panel-sdui');
      if (!sduiPanel.classList.contains('active')) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      // Only handle image paste — let text paste into textarea/input pass through normally
      let hasImage = false;
      for (const it of items) {
        if (it.type.startsWith('image/')) {
          hasImage = true;
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            sduiLoadImage(file);
            showToast('Image pasted from clipboard');
          }
          break;
        }
      }
    });
  })();

  // Preset chips
  document.getElementById('sduiPresets').addEventListener('click', (e) => {
    const chip = e.target.closest('.sdui-preset-chip');
    if (!chip) return;
    sduiState.preset = chip.dataset.preset;
    document.querySelectorAll('#sduiPresets .sdui-preset-chip').forEach(c => {
      c.classList.toggle('active', c === chip);
    });
    sduiSaveState();
    // 'full' format uses preset as content_* key → re-render
    sduiRenderOutput();
  });

  // Format tabs (Raw value / wrap / Full dataSchema)
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.sdui-format-tab');
    if (!tab) return;
    sduiSwitchFormat(tab.dataset.format);
  });

  // ===== GENERATE =====
  async function sduiGenerate() {
    if (!sduiState.apiKey) {
      showToast('Please set your API key first', 'warn');
      document.getElementById('sduiApiKey').focus();
      return;
    }
    if (!sduiState.currentImage) {
      showToast('Please upload an image first', 'warn');
      return;
    }

    const btn = document.getElementById('sduiGenBtn');
    const status = document.getElementById('sduiGenStatus');
    btn.disabled = true;
    btn.innerHTML = '<span class="sdui-spinner"></span> Generating...';
    status.innerHTML = '<span class="sdui-spinner"></span> Calling Claude API...';

    const context = document.getElementById('sduiContext').value.trim();
    const preset = sduiState.preset;

    // Build user message
    const userText = `Phân tích ảnh UI mockup này và tạo dataSchema JSON.

**Format preset**: ${preset}${preset === 'custom' ? ' (tự chọn key name phù hợp)' : ''}
${context ? `**Context bổ sung từ user**:\n${context}` : ''}

Trả về JSON hợp lệ theo đúng spec SDUI. Bọc trong \`\`\`json ... \`\`\``;

    // System prompt with KB embedded
    const fullSystem = sduiState.systemPrompt + '\n\n---\n\n# SDUI Knowledge Base (Specification Reference)\n\n' + sduiState.kb;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': sduiState.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: sduiState.model,
          max_tokens: 4096,
          system: fullSystem,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: sduiState.currentImage.mediaType,
                  data: sduiState.currentImage.base64
                }
              },
              { type: 'text', text: userText }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = `API error ${response.status}`;
        try {
          const errJson = JSON.parse(errText);
          errMsg += ': ' + (errJson.error?.message || errText.slice(0, 200));
        } catch { errMsg += ': ' + errText.slice(0, 200); }
        throw new Error(errMsg);
      }

      const data = await response.json();
      const fullText = data.content
              .filter(b => b.type === 'text')
              .map(b => b.text)
              .join('\n');

      // Try to extract JSON block
      let extractedJson = fullText;
      const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        extractedJson = jsonMatch[1].trim();
      } else {
        const anyMatch = fullText.match(/```\s*([\s\S]*?)\s*```/);
        if (anyMatch) extractedJson = anyMatch[1].trim();
      }

      sduiState.currentOutput = extractedJson;
      sduiRenderOutput();

      // Save to history
      sduiAddHistory({
        preset,
        context,
        output: extractedJson,
        imageDataUrl: sduiState.currentImage.dataUrl,
        filename: sduiState.currentImage.filename
      });

      const usage = data.usage;
      status.innerHTML = `✓ Generated (${usage.input_tokens} in / ${usage.output_tokens} out tokens)`;
      showToast('dataSchema generated');
    } catch(err) {
      console.error(err);
      status.innerHTML = `<span style="color:var(--danger);">✗ ${err.message}</span>`;
      showToast('Generation failed: ' + err.message, 'warn');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '✨ Generate dataSchema';
    }
  }

  // ===== OUTPUT RENDER =====

  // Build formatted output based on selected tab.
  // Returns a string that represents the output in the requested shape:
  //   'raw'  → the original JSON value AI returned (as-is)
  //   'wrap' → `"dataSchema": <value>`  (a single key-value fragment, ready to merge into parent JSON)
  //   'full' → a complete SDUI object with header + content_* wrapper per spec
  function sduiBuildFormattedOutput() {
    const raw = sduiState.currentOutput || '';
    if (!raw) return '';

    const fmt = sduiState.outputFormat || 'full';

    if (fmt === 'raw') return raw;

    // Try to parse the raw. If it fails, fall back to string embedding (still readable for user).
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) { parsed = null; }

    if (fmt === 'wrap') {
      if (parsed !== null) {
        // Produce a JS-style fragment: "dataSchema": { ... } — not a full object since user pastes inline
        return '"dataSchema": ' + JSON.stringify(parsed, null, 2);
      }
      return '"dataSchema": ' + raw;
    }

    if (fmt === 'full') {
      // Pick the content_* key based on the current preset
      const preset = sduiState.preset || 'content_info';
      const contentKey = (preset === 'custom') ? 'content_info' : preset;

      const innerValue = parsed !== null ? parsed : { __raw: raw };

      const full = {
        dataSchema: {
          header: {
            showHeader: false,
            backgroundImage: ''
          },
          [contentKey]: {
            value: innerValue
          }
        }
      };
      return JSON.stringify(full, null, 2);
    }

    return raw;
  }

  function sduiRenderOutput() {
    const out = document.getElementById('sduiOutput');
    const formatted = sduiBuildFormattedOutput();

    if (!formatted) {
      out.innerHTML = '<div class="sdui-json-empty">Generated dataSchema will appear here</div>';
      document.getElementById('sduiCharCount').textContent = '0 chars';
      return;
    }
    out.innerHTML = '<pre>' + sduiEscapeHtml(formatted) + '</pre>';
    document.getElementById('sduiCharCount').textContent = formatted.length + ' chars';
  }

  function sduiEscapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function sduiCopyOutput() {
    const formatted = sduiBuildFormattedOutput();
    if (!formatted) return showToast('Nothing to copy', 'warn');
    navigator.clipboard.writeText(formatted)
            .then(() => showToast('Copied (' + sduiState.outputFormat + ' format)'))
            .catch(() => {
              // Fallback: textarea trick
              const ta = document.createElement('textarea');
              ta.value = formatted;
              ta.style.position = 'fixed';
              ta.style.opacity = '0';
              document.body.appendChild(ta);
              ta.select();
              try { document.execCommand('copy'); showToast('Copied (fallback)'); }
              catch { showToast('Copy failed', 'warn'); }
              document.body.removeChild(ta);
            });
  }

  function sduiDownloadOutput() {
    const formatted = sduiBuildFormattedOutput();
    if (!formatted) return showToast('Nothing to download', 'warn');
    const blob = new Blob([formatted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = sduiState.outputFormat === 'full' ? 'full' :
            sduiState.outputFormat === 'wrap' ? 'wrapped' : 'raw';
    a.download = `dataSchema-${suffix}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Format = re-indent the raw JSON (pretty-print). Only affects the raw value, not the wrapper view.
  function sduiFormatOutput() {
    if (!sduiState.currentOutput) return;
    try {
      const parsed = JSON.parse(sduiState.currentOutput);
      sduiState.currentOutput = JSON.stringify(parsed, null, 2);
      sduiRenderOutput();
      showToast('Formatted');
    } catch(e) {
      showToast('Not valid JSON — cannot format', 'warn');
    }
  }

  // Format tab switch
  function sduiSwitchFormat(fmt) {
    sduiState.outputFormat = fmt;
    document.querySelectorAll('.sdui-format-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.format === fmt);
    });
    sduiRenderOutput();
    sduiSaveState();
  }

  // ===== HISTORY =====
  function sduiAddHistory(entry) {
    const item = {
      id: 'sh_' + Date.now().toString(36),
      timestamp: Date.now(),
      thumbnail: entry.imageDataUrl,
      title: entry.filename || 'untitled',
      preset: entry.preset,
      context: entry.context,
      output: entry.output,
      mode: entry.mode || sduiState.mode || 'api'
    };
    sduiState.history.unshift(item);
    // Cap history at 20 items to keep localStorage reasonable
    if (sduiState.history.length > 20) sduiState.history = sduiState.history.slice(0, 20);
    sduiSaveState();
    sduiRenderHistory();
  }

  function sduiRenderHistory() {
    const box = document.getElementById('sduiHistory');
    if (!sduiState.history.length) {
      box.innerHTML = '<div class="sdui-json-empty">No history yet</div>';
      return;
    }
    box.innerHTML = sduiState.history.map(h => {
      const date = new Date(h.timestamp);
      const timeStr = date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
      const modeBadge = h.mode === 'prompt'
              ? '<span style="color:var(--success);">📋</span>'
              : '<span style="color:var(--accent);">🔑</span>';
      return `
      <div class="sdui-history-item" onclick="sduiLoadHistory('${h.id}')">
        <div class="sdui-history-thumb">
          ${h.thumbnail ? `<img src="${h.thumbnail}" alt="">` : '🖼'}
        </div>
        <div class="sdui-history-meta">
          <div class="title">${sduiEscapeHtml(h.title)}</div>
          <div class="time">${timeStr} · ${modeBadge} ${h.preset}</div>
          ${h.context ? `<div class="time" style="margin-top:2px;">${sduiEscapeHtml(h.context.slice(0, 50))}${h.context.length > 50 ? '…' : ''}</div>` : ''}
        </div>
        <button class="sdui-history-del" onclick="event.stopPropagation(); sduiDeleteHistory('${h.id}')">✕</button>
      </div>
    `;
    }).join('');
  }

  function sduiLoadHistory(id) {
    const h = sduiState.history.find(x => x.id === id);
    if (!h) return;
    sduiState.currentOutput = h.output;
    sduiRenderOutput();
    if (h.thumbnail) {
      document.getElementById('sduiPreviewImg').src = h.thumbnail;
      document.getElementById('sduiPreview').classList.add('show');
      // Not setting currentImage — user needs to re-upload to re-generate
    }
    if (h.context) document.getElementById('sduiContext').value = h.context;
    sduiState.preset = h.preset;
    document.querySelectorAll('#sduiPresets .sdui-preset-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.preset === h.preset);
    });
    showToast('Loaded from history');
  }

  function sduiDeleteHistory(id) {
    sduiState.history = sduiState.history.filter(h => h.id !== id);
    sduiSaveState();
    sduiRenderHistory();
  }

  function sduiClearHistory() {
    if (!confirm('Clear all history?')) return;
    sduiState.history = [];
    sduiSaveState();
    sduiRenderHistory();
    showToast('History cleared');
  }

  // ===== SDUI INIT =====
  sduiLoadState();
  sduiRenderAll();

  // ==================== FIGMA PLUGIN BRIDGE ====================
  // Detect if running inside Figma plugin sandbox.
  // When running as standalone HTML (browser), these hooks are silently no-op.

  const IS_FIGMA_PLUGIN = (function() {
    // Figma plugin UI runs in an iframe with parent.postMessage to the plugin.
    // We also check for figma-specific globals that appear in the sandbox.
    try {
      // `parent !== window` is true in any iframe — tighten with pluginMessage convention.
      // We can't reliably detect Figma before any message, so fall back to user-agent/host.
      return window.location.protocol === 'null:' // Figma uses null origin
              || /figma/i.test(navigator.userAgent)
              || window.parent !== window; // conservative: any iframe enables the feature
    } catch (e) {
      return false;
    }
  })();

  if (IS_FIGMA_PLUGIN) {
    // Show Figma import button
    const figmaImport = document.getElementById('sduiFigmaImport');
    if (figmaImport) figmaImport.style.display = 'block';

    // Listen for messages from plugin (code.js)
    window.addEventListener('message', (event) => {
      const msg = event.data && event.data.pluginMessage;
      if (!msg || !msg.type) return;

      if (msg.type === 'FIGMA_EXPORT_READY') {
        sduiReceiveFigmaImage(msg);
      } else if (msg.type === 'FIGMA_EXPORT_ERROR') {
        showToast(msg.message || 'Figma export failed', 'warn');
        const btn = document.getElementById('sduiFigmaImportBtn');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '🎨 Import from Figma Selection';
        }
      }
    });
  }

  function sduiImportFromFigma() {
    const btn = document.getElementById('sduiFigmaImportBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="sdui-spinner"></span> Exporting from Figma...';
    }
    const scale = parseInt(document.getElementById('sduiFigmaScale').value, 10) || 2;
    // In Prompt mode we also extract the node schema — gives Claude a much richer context
    const messageType = sduiState.mode === 'prompt' ? 'EXPORT_WITH_SCHEMA' : 'EXPORT_SELECTION_AS_PNG';
    parent.postMessage({ pluginMessage: { type: messageType, scale } }, '*');
  }

  function sduiReceiveFigmaImage(msg) {
    const dataUrl = 'data:' + msg.mediaType + ';base64,' + msg.base64;
    sduiState.currentImage = {
      dataUrl,
      mediaType: msg.mediaType,
      filename: (msg.nodeName || 'figma-frame') + '.png',
      base64: msg.base64
    };
    // Schema (only when requested via EXPORT_WITH_SCHEMA)
    sduiState.figmaSchema = msg.schema || null;

    document.getElementById('sduiPreviewImg').src = dataUrl;
    document.getElementById('sduiPreview').classList.add('show');

    const btn = document.getElementById('sduiFigmaImportBtn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🎨 Import from Figma Selection';
    }

    sduiRenderSchemaPreview();

    const w = Math.round(msg.width || 0);
    const h = Math.round(msg.height || 0);
    const schemaHint = sduiState.figmaSchema ? ' + schema' : '';
    showToast('✓ Imported "' + (msg.nodeName || 'frame') + '" (' + w + '×' + h + ')' + schemaHint);
  }

  // ═════════════ MODE TOGGLE ═════════════
  document.getElementById('sduiModeToggle').addEventListener('click', (e) => {
    const btn = e.target.closest('.sdui-mode-btn');
    if (!btn) return;
    sduiState.mode = btn.dataset.mode;
    sduiRenderMode();
    sduiSaveState();

    // Update Figma import hint based on mode
    const hint = document.getElementById('sduiFigmaImportHint');
    if (hint && IS_FIGMA_PLUGIN) {
      hint.innerHTML = sduiState.mode === 'prompt'
              ? '💡 Chọn frame trong Figma → click để import <strong style="color:var(--success);">ảnh + schema</strong> (schema giúp AI chính xác hơn)'
              : '💡 Chọn 1 frame/component trong Figma → click để import ảnh';
    }
  });

  // ═════════════ MODE 2: PROMPT-BASED ═════════════

  function sduiBuildPromptText() {
    const preset = sduiState.preset;
    const context = document.getElementById('sduiContext').value.trim();

    let userText = '# Task\nPhân tích UI mockup đính kèm và sinh mã JSON `dataSchema` chuẩn SDUI.\n\n';
    userText += '**Format preset**: ' + preset + (preset === 'custom' ? ' (tự chọn key name phù hợp)' : '') + '\n\n';

    if (sduiState.figmaSchema) {
      userText += '# Figma Node Schema (extracted from source)\n\n';
      userText += 'Dùng schema này làm ground truth về structure, màu, kích thước chính xác. Ảnh để hiểu visual hierarchy.\n\n';
      userText += '```json\n' + JSON.stringify(sduiState.figmaSchema, null, 2) + '\n```\n\n';
    }

    if (context) {
      userText += '# Context bổ sung từ user\n' + context + '\n\n';
    }

    userText += '# Output Requirement\nTrả về DUY NHẤT 1 code block JSON hợp lệ (bọc trong ```json ... ```). Không giải thích dài dòng.';

    const fullPrompt = [
      '═══════════════════════════════════════════',
      '# SYSTEM INSTRUCTIONS',
      '═══════════════════════════════════════════',
      '',
      sduiState.systemPrompt,
      '',
      '═══════════════════════════════════════════',
      '# SDUI KNOWLEDGE BASE (Spec Reference)',
      '═══════════════════════════════════════════',
      '',
      sduiState.kb,
      '',
      '═══════════════════════════════════════════',
      '# USER REQUEST',
      '═══════════════════════════════════════════',
      '',
      userText,
      '',
      sduiState.currentImage
              ? '📎 [ẢNH: đã copy file ảnh riêng — hãy attach vào chat Claude.ai bằng cách download PNG ở plugin]'
              : '⚠ [Chưa có ảnh — vui lòng import/upload ảnh trước]'
    ].join('\n');

    return fullPrompt;
  }

  async function sduiBuildAndCopyPrompt() {
    if (!sduiState.currentImage) {
      setPromptStatus('✗ Cần import/upload ảnh trước', 'error');
      showToast('Upload or import an image first', 'warn');
      return;
    }
    const prompt = sduiBuildPromptText();
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptStatus('✓ Prompt đã copy (' + prompt.length + ' chars). Paste vào Claude.ai!', 'success');
      // Mark Step 1 as done
      document.getElementById('sduiStep1').classList.add('done');
      showToast('Prompt copied to clipboard');
    } catch(err) {
      // Fallback: textarea trick
      try {
        const ta = document.createElement('textarea');
        ta.value = prompt;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setPromptStatus('✓ Prompt đã copy (fallback). Paste vào Claude.ai!', 'success');
        document.getElementById('sduiStep1').classList.add('done');
        showToast('Prompt copied (fallback)');
      } catch(e2) {
        setPromptStatus('✗ Copy failed: ' + e2.message, 'error');
      }
    }
  }

  function sduiDownloadPreviewImage() {
    if (!sduiState.currentImage) {
      showToast('No image to download', 'warn');
      return;
    }
    const a = document.createElement('a');
    a.href = sduiState.currentImage.dataUrl;
    a.download = sduiState.currentImage.filename || 'sdui-mockup.png';
    a.click();
    showToast('Image downloaded — drag file vào chat Claude');
  }

  function sduiOpenClaudeAI() {
    window.open('https://claude.ai/new', '_blank');
  }

  async function sduiPasteFromClipboardToArea() {
    try {
      const txt = await navigator.clipboard.readText();
      document.getElementById('sduiPasteResponse').value = txt;
      showToast('Pasted from clipboard');
    } catch(err) {
      showToast('Clipboard read blocked — paste manually (Ctrl+V)', 'warn');
    }
  }

  function sduiParsePastedResponse() {
    const raw = document.getElementById('sduiPasteResponse').value.trim();
    if (!raw) {
      setPromptStatus('✗ Paste response first', 'error');
      return;
    }

    // Extract JSON block
    let extracted = raw;
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      extracted = jsonMatch[1].trim();
    } else {
      const anyMatch = raw.match(/```\s*([\s\S]*?)\s*```/);
      if (anyMatch) extracted = anyMatch[1].trim();
    }

    // Validate JSON
    try {
      const parsed = JSON.parse(extracted);
      extracted = JSON.stringify(parsed, null, 2); // pretty-print
    } catch(e) {
      setPromptStatus('⚠ Text không parse được thành JSON — dùng raw (có thể Claude response sai format)', 'warn');
    }

    sduiState.currentOutput = extracted;
    sduiRenderOutput();

    // Save to history
    sduiAddHistory({
      preset: sduiState.preset,
      context: document.getElementById('sduiContext').value.trim(),
      output: extracted,
      imageDataUrl: sduiState.currentImage?.dataUrl,
      filename: sduiState.currentImage?.filename || 'prompt-mode',
      mode: 'prompt'
    });

    setPromptStatus('✓ Response parsed & saved to history', 'success');
    showToast('JSON parsed successfully');
  }

  function setPromptStatus(text, kind) {
    const el = document.getElementById('sduiPromptStatus');
    if (!el) return;
    const colorMap = {
      success: 'var(--success)',
      error: 'var(--danger)',
      warn: 'var(--rn)'
    };
    el.textContent = text;
    el.style.color = colorMap[kind] || 'var(--text-dim)';
  }

  // ===== PLUGIN CONFIG GENERATOR =====
  let currentFlavor = 'marketing_sdui';
  
  function selectFlavor(flavor) {
    currentFlavor = flavor;
  }

  async function exportPluginConfig() {
    try {
      showToast('Generating zip package...', 'success');
      
      const configData = {
        flavor: currentFlavor,
        settings: {
          rootContainer: document.getElementById('cfg_root_container').value,
          strictMatching: document.getElementById('cfg_strict_matching').value === 'true',
          notes: document.getElementById('cfg_notes').value
        }
      };

      // Fetch the raw files
      const [manifestRes, uiRes, codeRes] = await Promise.all([
        fetch('manifest.json'),
        fetch('ui.html'),
        fetch('dist/code.js')
      ]);

      if (!manifestRes.ok || !uiRes.ok || !codeRes.ok) {
        throw new Error('Failed to fetch plugin source files. Make sure you are serving the root folder correctly.');
      }

      const manifestRaw = await manifestRes.text();
      let uiHtml = await uiRes.text();
      const codeJs = await codeRes.blob(); // Fetch as blob for pure binary integrity

      // 1. Modify Manifest
      const manifest = JSON.parse(manifestRaw);
      manifest.name = currentFlavor === 'marketing_sdui' ? 'SDUI Extractor (Marketing)' : 'RN Extractor (Promotion)';
      manifest.id = 'extr-' + currentFlavor.replace('_', '-');

      // 2. Inject Config into UI.html
      const injectedScript = '<scr' + 'ipt>window.PLUGIN_CONFIG = ' + JSON.stringify(configData) + ';</scr' + 'ipt>\n</head>';
      uiHtml = uiHtml.replace('</head>', injectedScript);

      // 3. Zip it up
      const zip = new JSZip();
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file("ui.html", uiHtml);
      zip.folder("dist").file("code.js", codeJs);

      const content = await zip.generateAsync({ type: "blob" });
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `figma-plugin-${currentFlavor.replace('_', '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);

      showToast(`Exported Plugin ZIP for ${currentFlavor}!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  }
