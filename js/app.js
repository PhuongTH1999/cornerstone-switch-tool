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

  // Copy text mạnh: thử Clipboard API, fallback execCommand (cho file:// / http không-secure)
  function csCopyText(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast(okMsg || 'Copied'))
        .catch(() => csFallbackCopy(text, okMsg));
    } else {
      csFallbackCopy(text, okMsg);
    }
  }
  function csFallbackCopy(text, okMsg) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(ok ? (okMsg || 'Copied') : 'Copy thất bại — copy thủ công nhé', ok ? 'success' : 'warn');
    } catch (e) {
      showToast('Copy thất bại: ' + e.message, 'warn');
    }
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

  // ===== NAVIGATION (top sections + per-section subnav) =====
  const SECTIONS = [
    { id: 'introduction', label: 'Introduction', ico: '📖', kind: 'doc', src: 'docs/introduction.md' },
    { id: 'integrate',    label: 'Integrate',    ico: '🔌', kind: 'doc', src: 'cornerstone-integration.md' },
    { id: 'api',          label: 'API',          ico: '🛰️', kind: 'doc', src: 'docs/api.md' },
    { id: 'sdui',         label: 'SDUI',         ico: '🎨', kind: 'list', items: [
        { id: 'gen',       label: 'Generator (ảnh→JSON)', ico: '✨', kind: 'panel', target: 'panel-coming', soon: true },
        { id: 'builder',   label: 'Builder',          ico: '🧱', kind: 'panel', target: 'panel-builder' },
        { id: 'guide',     label: 'Guide', ico: '📦', kind: 'doc',   src: 'sdui-guide.md' },
        { id: 'schema',    label: 'JSON Schema',      ico: '🧱', kind: 'doc',   src: 'sdui-json-schema.md' },
        { id: 'interface', label: 'Data Interface',   ico: '🧩', kind: 'doc',   src: 'sdui-data-interface.md' },
        { id: 'templates', label: 'Templates',        ico: '🧬', kind: 'panel', target: 'panel-templates' },
    ] },
    { id: 'tools',        label: 'Tools',        ico: '🛠️', kind: 'list', items: [
        { id: 'rules',  label: 'Flow Switch Rules', ico: '📋', kind: 'panel', target: 'panel-rules' },
        { id: 'json',   label: 'JSON Config',       ico: '📄', kind: 'panel', target: 'panel-json' },
        { id: 'plugin', label: 'Plugin Config',     ico: '🔌', kind: 'panel', target: 'panel-pluginconfig' },
    ] },
    { id: 'changelog',    label: 'Changelog',    ico: '🗓️', kind: 'list', items: [
        { id: 'highlights', label: 'Highlights',   ico: '✨', kind: 'doc', src: 'docs/changelog.md' },
        { id: 'dev',        label: 'Dev (GitLab)', ico: '🛠️', kind: 'doc', src: 'docs/changelog-dev.md' },
    ] },
  ];

  let currentSection = null;
  let currentItemId = null;
  let currentDocSrc = null;
  let _suppressNextHash = false;  // bỏ qua hashchange do chính app sinh ra (tránh lặp)

  // ---- Hash routing: mỗi tab có URL riêng (#/<section>/<item>) ----
  function parseHash() {
    const parts = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
    return { sec: parts[0] || null, item: parts[1] || null };
  }
  function syncHash() {
    let h = '#/' + (currentSection ? currentSection.id : '');
    if (currentItemId) h += '/' + currentItemId;
    if (location.hash !== h) { _suppressNextHash = true; location.hash = h; }
  }
  function applyRoute() {
    const { sec, item } = parseHash();
    if (sec && SECTIONS.find(s => s.id === sec)) {
      goSection(sec, item);
    } else {
      let start = 'introduction';
      try { start = localStorage.getItem('cs_section') || 'introduction'; } catch (e) {}
      if (!SECTIONS.find(s => s.id === start)) start = 'introduction';
      goSection(start);
    }
  }

  function buildTopNav() {
    const nav = document.getElementById('topnav');
    if (!nav) return;
    nav.innerHTML = SECTIONS.map(s =>
      '<button class="topnav-link" data-sec="' + s.id + '" onclick="goSection(\'' + s.id + '\')">' +
      '<span class="nav-ico">' + s.ico + '</span>' + s.label + '</button>').join('');
  }

  function goSection(secId, itemId) {
    const sec = SECTIONS.find(s => s.id === secId);
    if (!sec) return;
    currentSection = sec;
    document.querySelectorAll('.topnav-link').forEach(b =>
      b.classList.toggle('active', b.dataset.sec === secId));
    try { localStorage.setItem('cs_section', secId); } catch (e) {}

    if (sec.kind === 'doc') {
      currentItemId = null;
      showPanel('panel-doc');
      renderDoc(sec.src, () => buildDocSubnav(sec));
      syncHash();
    } else {
      buildListSubnav(sec);
      const it = sec.items.find(i => i.id === itemId) || sec.items[0];
      selectItem(sec, it);
    }
    closeSubnav();
  }

  function showPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    const showFlow = (id === 'panel-rules' || id === 'panel-json');
    const fb = document.getElementById('flowBanner');
    if (fb) fb.style.display = showFlow ? 'flex' : 'none';
    const badge = document.getElementById('globalBadge');
    if (badge) badge.style.display = showFlow ? 'inline-flex' : 'none';
    // Panel rộng (2 cột) cần nhiều chiều ngang hơn
    const wide = (id === 'panel-builder' || id === 'panel-sdui');
    const ci = document.querySelector('.content-inner');
    if (ci) ci.classList.toggle('wide', wide);
    window.scrollTo(0, 0);
  }

  // ---- Doc rendering (markdown → inline) ----
  function renderDoc(src, done) {
    const host = document.getElementById('docContent');
    if (!host) return;
    if (currentDocSrc === src) { if (done) done(); return; }
    host.innerHTML = '<p style="color:var(--text-muted)">Đang tải tài liệu…</p>';
    fetch(src, { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(md => {
        host.innerHTML = window.marked ? window.marked.parse(md) : '<pre>' + sduiEscapeHtml(md) + '</pre>';
        host.querySelectorAll('h2, h3').forEach((h, i) => { h.id = 'doc-h-' + i; });
        currentDocSrc = src;
        window.scrollTo(0, 0);
        if (done) done();
      })
      .catch(err => {
        currentDocSrc = null;
        host.innerHTML = '<p style="color:var(--danger)">Không tải được <code>' + sduiEscapeHtml(src) +
          '</code> (' + sduiEscapeHtml(err.message) + ').</p>' +
          '<p style="color:var(--text-dim); margin-top:8px;">Nếu mở bằng <code>file://</code>, hãy chạy qua server (vd <code>npx serve</code>) hoặc xem trên bản deploy.</p>';
        if (done) done();
      });
  }

  // Đang chạy qua dev server local? (chỉ khi đó endpoint /api/sync-changelog mới tồn tại)
  function isLocalDev() {
    return ['localhost', '127.0.0.1', '0.0.0.0', ''].includes(location.hostname);
  }
  // Sync changelog từ GitLab nội bộ — gọi endpoint của dev server (server.js).
  // Chỉ chạy được khi mở qua `npm run dev` (máy có VPN + .gitlab-token).
  async function syncChangelog() {
    showToast('Đang sync changelog từ GitLab…', 'info');
    try {
      const res = await fetch('/api/sync-changelog', { method: 'POST' });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Endpoint không tồn tại — hãy chạy bằng `npm run dev` (không phải bản deploy).');
      }
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
      currentDocSrc = null;  // ép load lại file mới
      // Load lại đúng mục đang xem (Highlights/Dev đều vừa được cập nhật)
      const item = (currentSection && currentSection.id === 'changelog' && currentItemId) ? currentItemId : 'highlights';
      selectItemById('changelog', item);
      showToast('Đã sync ✓ — cập nhật cả Highlights & Dev (' + data.bytes + ' bytes)');
    } catch (e) {
      showToast('Sync lỗi: ' + e.message, 'warn');
    }
  }

  // ---- Subnav builders ----
  function buildDocSubnav(sec) {
    const sub = document.getElementById('subnav');
    const host = document.getElementById('docContent');
    const heads = host ? [...host.querySelectorAll('h2, h3')] : [];
    let html = '<div class="subnav-section-title"><span class="nav-ico">' + sec.ico + '</span><span class="subnav-title-text">' + sec.label + '</span></div>';
    if (!heads.length) {
      html += '<a class="subnav-link active">Nội dung</a>';
    } else {
      html += heads.map((h, i) => {
        const isSub = h.tagName === 'H3';
        return '<a class="subnav-link' + (isSub ? ' sub' : '') + (i === 0 ? ' active' : '') +
          '" onclick="scrollToHeading(\'doc-h-' + i + '\', this)">' + sduiEscapeHtml(h.textContent) + '</a>';
      }).join('');
    }
    sub.innerHTML = html;
  }

  function buildListSubnav(sec) {
    const sub = document.getElementById('subnav');
    let html = '<div class="subnav-section-title"><span class="nav-ico">' + sec.ico + '</span><span class="subnav-title-text">' + sec.label + '</span></div>';
    html += sec.items.map(it =>
      '<a class="subnav-link" data-item="' + it.id + '" title="' + sduiEscapeHtml(it.label) + '" onclick="selectItemById(\'' + sec.id + '\',\'' + it.id + '\')">' +
      '<span class="nav-ico">' + it.ico + '</span><span class="subnav-link-text">' + it.label + '</span>' +
      (it.soon ? '<span class="soon-badge">soon</span>' : '') + '</a>').join('');
    // Nút Sync chỉ có tác dụng khi chạy qua dev server (localhost) → ẩn trên bản deploy.
    if (sec.id === 'changelog' && isLocalDev()) {
      html += '<button class="btn btn-ghost changelog-sync-btn" style="width:100%;justify-content:center;margin-top:10px;font-size:11px;" onclick="syncChangelog()" title="Kéo CHANGELOG mới nhất từ GitLab (cần VPN + token)">🔄 Sync from GitLab</button>';
    }
    sub.innerHTML = html;
  }

  function selectItemById(secId, itemId) {
    const sec = SECTIONS.find(s => s.id === secId);
    if (!sec) return;
    const it = sec.items.find(i => i.id === itemId);
    if (it) selectItem(sec, it);
  }

  function selectItem(sec, it) {
    currentSection = sec;
    currentItemId = it.id;
    document.querySelectorAll('#subnav .subnav-link').forEach(l =>
      l.classList.toggle('active', l.dataset.item === it.id));
    syncHash();
    if (it.kind === 'panel') {
      showPanel(it.target);
      if (it.target === 'panel-json') renderJSON();
      if (it.target === 'panel-templates') { sduiRenderTemplateChips(); sduiSelectTemplate(sduiActiveTpl || 0); }
      if (it.target === 'panel-builder') builderInit();
    } else if (it.kind === 'doc') {
      showPanel('panel-doc');
      renderDoc(it.src, () => {});
    }
    closeSubnav();
  }

  function scrollToHeading(id, el) {
    const h = document.getElementById(id);
    if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('#subnav .subnav-link').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');
    closeSubnav();
  }

  // ---- Mobile drawer ----
  function toggleSubnav() {
    const sb = document.getElementById('subnav');
    const bd = document.getElementById('subnavBackdrop');
    if (!sb) return;
    const open = sb.classList.toggle('open');
    if (bd) bd.classList.toggle('show', open);
  }
  function closeSubnav() {
    document.getElementById('subnav')?.classList.remove('open');
    document.getElementById('subnavBackdrop')?.classList.remove('show');
  }
  // Desktop: thu gọn sidebar trái (.subnav) để có thêm không gian cho nội dung
  function applyNavCollapsed(collapsed) {
    const bl = document.querySelector('.body-layout');
    if (bl) bl.classList.toggle('nav-collapsed', collapsed);
    const btn = document.getElementById('navCollapseToggle');
    if (btn) { btn.textContent = '☰'; btn.title = collapsed ? 'Mở menu trái' : 'Thu gọn menu trái'; }
  }
  function toggleNavCollapse() {
    const collapsed = !document.querySelector('.body-layout')?.classList.contains('nav-collapsed');
    applyNavCollapsed(collapsed);
    try { localStorage.setItem('cs_nav_collapsed', collapsed ? '1' : '0'); } catch (e) {}
  }
  try { applyNavCollapsed(localStorage.getItem('cs_nav_collapsed') === '1'); } catch (e) {}

  // ---- CNS version dropdown ----
  const CNS_VERSIONS = ['1.0.4-cns-rc.9', '1.0.4-cns-rc.8', '1.0.4-cns-rc.7', '1.0.4-cns-rc.5', '1.0.4-cns-rc.1'];
  function buildVersionSelect() {
    const sel = document.getElementById('versionSelect');
    if (!sel) return;
    let saved = '';
    try { saved = localStorage.getItem('cs_cns_version') || ''; } catch (e) {}
    const cur = CNS_VERSIONS.includes(saved) ? saved : CNS_VERSIONS[0];
    sel.innerHTML = CNS_VERSIONS.map(v =>
      '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + v + '</option>').join('');
  }
  function onVersionChange(v) {
    try { localStorage.setItem('cs_cns_version', v); } catch (e) {}
    showToast('CNS version: ' + v, 'info');
  }

  function initNav() {
    buildTopNav();
    buildVersionSelect();
    applyRoute();   // chọn tab theo URL (#/section/item), fallback localStorage rồi default
    window.addEventListener('hashchange', () => {
      if (_suppressNextHash) { _suppressNextHash = false; return; }
      applyRoute();   // người dùng đổi URL / bấm back-forward
    });
  }
  document.addEventListener('DOMContentLoaded', initNav);

  // ===== THEME (light / dark) =====
  function syncThemeIcon() {
    const t = document.documentElement.getAttribute('data-theme') || 'dark';
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = t === 'light' ? '☀️' : '🌙';
      btn.title = t === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
    }
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('cornerstone-theme', next); } catch (e) {}
    syncThemeIcon();
  }
  document.addEventListener('DOMContentLoaded', syncThemeIcon);

  // ===== SDUI TEMPLATES =====
  // --- JSON templates (trích từ sdui-json-schema.md §10) ---
  const SDUI_TEMPLATES = [
    {
      name: 'Card khuyến mãi (scroll ngang)',
      json: {
        type: 'template_widget',
        templateType: 'SDUI_WIDGET',
        data: [
          {
            type: 'container',
            style: { padding: { all: 0 } },
            property: { layout: 'scrollRow', spacing: 8 },
            widgetId: '260615_promo_widget_1',
            trackTypes: { containerType: 'widget' },
            value: {
              children: [
                {
                  type: 'container',
                  style: {
                    backgroundColor: '#FFFFFF', cornerRadius: 12,
                    border: { width: 1, color: '#E8EAED' },
                    padding: { all: 12 }, width: 305
                  },
                  property: { layout: 'row', spacing: 10, alignment: 'center' },
                  trackTypes: { containerType: 'item' },
                  value: {
                    children: [
                      {
                        type: 'image',
                        style: { width: 52, height: 52, cornerRadius: 26 },
                        property: { contentMode: 'fill' },
                        value: 'https://static.momocdn.net/app/icon/promotion/logo.png'
                      },
                      {
                        type: 'container',
                        style: { fillMaxWidth: true },
                        property: { layout: 'column', spacing: 2, alignment: 'left' },
                        value: {
                          children: [
                            { type: 'text', style: {}, property: { typography: 'labelXsMedium', color: '#727272', lineLimit: 1 }, value: 'Highlands Coffee' },
                            { type: 'text', style: {}, property: { typography: 'headerSSemibold', color: '#303233', lineLimit: 1 }, value: 'Giảm 50.000đ cho hóa đơn từ 150.000đ' }
                          ]
                        }
                      },
                      {
                        type: 'button',
                        style: {},
                        property: { ctaType: 'BUTTON', color: '#303233', actions: [{ actionType: 'REDIRECT', featureCode: 'refund_handbook', params: {} }] },
                        value: { title: 'Thu thập', type: 'text' }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      name: 'Spacer đẩy nút sang phải (row)',
      json: {
        type: 'container',
        style: { fillMaxWidth: true },
        property: { layout: 'row', spacing: 0 },
        value: {
          children: [
            { type: 'spacer', style: {}, property: {}, value: '' },
            { type: 'button', style: {}, property: { ctaType: 'BUTTON' }, value: { title: 'Thu thập' } }
          ]
        }
      }
    },
    {
      name: 'Insight card (onTap)',
      json: {
        type: 'template_widget',
        templateType: 'SDUI_WIDGET',
        data: [
          {
            type: 'container',
            style: { backgroundColor: '#FFFFFF', cornerRadius: 12, padding: { all: 12 } },
            property: { layout: 'column', spacing: 8 },
            trackTypes: { containerType: 'widget' },
            value: {
              children: [
                {
                  type: 'container',
                  style: {},
                  property: { layout: 'row', spacing: 8 },
                  value: {
                    children: [
                      { type: 'text', style: {}, property: { typography: 'headerDefaultBold', color: '#303233', lineLimit: 1 }, value: 'Có thể bạn quan tâm' },
                      { type: 'spacer', style: {}, property: {}, value: '' },
                      {
                        type: 'image',
                        style: { width: 22, height: 22 },
                        property: { contentMode: 'fill' },
                        onTap: { actions: [{ actionType: 'REDIRECT', featureCode: 'see_more' }] },
                        value: 'https://static.momocdn.net/app/icon/promotion/icon.png'
                      }
                    ]
                  }
                },
                {
                  type: 'container',
                  style: {},
                  property: { layout: 'scrollRow', spacing: 8 },
                  value: {
                    children: [
                      {
                        type: 'container',
                        style: { backgroundColor: '#FFFFFF', cornerRadius: 12, border: { width: 1, color: '#E8EAED' }, padding: { all: 12 }, width: 150 },
                        property: { layout: 'column', spacing: 8 },
                        onTap: { actions: [{ actionType: 'REDIRECT', featureCode: 'spending_insight' }] },
                        trackTypes: { containerType: 'item' },
                        value: {
                          children: [
                            { type: 'text', style: { fillMaxWidth: true }, property: { typography: 'labelXsMedium', color: '#727272', lineLimit: 1 }, value: 'Ngân sách' },
                            { type: 'spacer', style: {}, property: { minLength: 14 }, value: '' },
                            { type: 'text', style: {}, property: { typography: 'headerXsSemibold', color: '#303233', lineLimit: 1 }, value: 'Còn 274.673đ' },
                            { type: 'text', style: {}, property: { typography: 'descriptionXsRegular', color: '#727272', lineLimit: 1 }, value: 'Chi trong 25 ngày tới' }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ];

  let sduiActiveTpl = 0;

  function sduiRenderTemplateChips() {
    const wrap = document.getElementById('sduiTplChips');
    if (!wrap) return;
    wrap.innerHTML = SDUI_TEMPLATES.map((t, i) =>
      '<div class="sdui-tpl-chip' + (i === sduiActiveTpl ? ' active' : '') +
      '" onclick="sduiSelectTemplate(' + i + ')">' + sduiEscapeHtml(t.name) + '</div>'
    ).join('');
  }

  function sduiSelectTemplate(i) {
    sduiActiveTpl = i;
    const tpl = SDUI_TEMPLATES[i];
    sduiRenderTemplateChips();
    document.getElementById('sduiTplTitle').textContent = tpl.name;
    const json = JSON.stringify(tpl.json, null, 2);
    document.getElementById('sduiTplOutput').innerHTML = sduiEscapeHtml(json);
    const pv = document.getElementById('sduiTplPreview');
    if (pv) sduiRenderPreview(tpl.json, pv);
  }

  // JSON đang hiển thị: custom (paste/builder) khi sduiActiveTpl === -1, ngược lại là template
  function sduiCurrentTplJSON() {
    if (sduiActiveTpl === -1) {
      const ta = document.getElementById('sduiTplCustom');
      return ta ? ta.value : '';
    }
    return JSON.stringify(SDUI_TEMPLATES[sduiActiveTpl].json, null, 2);
  }

  function sduiCopyTemplate() {
    const json = sduiCurrentTplJSON();
    if (!json.trim()) return showToast('Chưa có JSON', 'warn');
    csCopyText(json, 'JSON copied');
  }

  function sduiDownloadTemplate() {
    const json = sduiCurrentTplJSON();
    if (!json.trim()) return showToast('Chưa có JSON', 'warn');
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (sduiActiveTpl === -1 ? 'sdui-custom' : 'sdui-template-' + (sduiActiveTpl + 1)) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON downloaded');
  }

  // Lấy schema hiện tại từ Builder
  function sduiTplLoadBuilder() {
    if (typeof builderTree === 'undefined') return showToast('Builder chưa sẵn sàng', 'warn');
    if (!builderTree) builderTree = builderSeed();
    const json = JSON.stringify(builderCurrentSchema(), null, 2);
    const ta = document.getElementById('sduiTplCustom');
    if (ta) ta.value = json;
    sduiTplPreviewCustom();
    showToast('Đã lấy schema từ Builder');
  }

  // Preview JSON đang dán trong ô custom
  function sduiTplPreviewCustom() {
    const ta = document.getElementById('sduiTplCustom');
    const val = ta ? ta.value.trim() : '';
    if (!val) return showToast('Chưa có JSON để preview', 'warn');
    sduiActiveTpl = -1;
    document.querySelectorAll('#sduiTplChips .sdui-tpl-chip').forEach(c => c.classList.remove('active'));
    document.getElementById('sduiTplTitle').textContent = 'Custom / from Builder';
    document.getElementById('sduiTplOutput').innerHTML = sduiEscapeHtml(val);
    sduiRenderPreview(val, document.getElementById('sduiTplPreview'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    sduiRenderTemplateChips();
    sduiSelectTemplate(0);
  });

  // ==================== SDUI PREVIEW RENDERER ====================
  // Dựng lại UI (best-effort) từ schema, hỗ trợ 2 dialect:
  //  A) Widget node tree  : { type:'container'|'text'|'image'|'button'|'tag'|'spacer', style, property, value }
  //  B) dataSchema content: { layout, modifier, children } + leaf { componentType, field, style, modifier }
  const SDUI_TYPO_MAP = {
    labelxsmedium:   { s: 11, w: 500 },
    labelsmedium:    { s: 12, w: 500 },
    headerxssemibold:{ s: 13, w: 600 },
    headerssemibold: { s: 15, w: 600 },
    headerdefaultbold:{ s: 16, w: 700 },
    descriptionxsregular: { s: 11, w: 400 },
    descriptiondefaultregular: { s: 13, w: 400 },
    actionsbold:     { s: 13, w: 700 },
  };
  function sduiTypo(token) {
    if (!token) return { s: 13, w: 400 };
    const t = String(token).toLowerCase();
    if (SDUI_TYPO_MAP[t]) return SDUI_TYPO_MAP[t];
    let s = 13, w = 400;
    if (t.includes('xs')) s = 11; else if (t.includes('header')) s = 15; else if (t.includes('default')) s = 15;
    if (t.includes('bold')) w = 700; else if (t.includes('semibold')) w = 600; else if (t.includes('medium')) w = 500;
    return { s, w };
  }

  function sduiApplyBox(el, m) {
    if (!m) return;
    if (m.backgroundColor) el.style.background = m.backgroundColor;
    if (m.cornerRadius != null) el.style.borderRadius = m.cornerRadius + 'px';
    if (m.border) el.style.border = (m.border.width || 1) + 'px solid ' + (m.border.color || '#e0e0e0');
    if (m.width != null) el.style.width = m.width + 'px';
    if (m.height != null) el.style.height = m.height + 'px';
    // cross-axis stretch (fillMaxWidth/Height) được xử lý trong sduiRenderLayout theo hướng layout
    const p = m.padding;
    if (p != null) {
      if (typeof p === 'number') el.style.padding = p + 'px';
      else if (p.all != null) el.style.padding = p.all + 'px';
      else el.style.padding = (p.top || 0) + 'px ' + (p.right || 0) + 'px ' + (p.bottom || 0) + 'px ' + (p.left || 0) + 'px';
    }
  }

  const SDUI_FLEX_MAP = {
    start: 'flex-start', top: 'flex-start', left: 'flex-start', leading: 'flex-start',
    center: 'center',
    end: 'flex-end', bottom: 'flex-end', right: 'flex-end', trailing: 'flex-end',
    spaceBetween: 'space-between', spaceAround: 'space-around', spaceEvenly: 'space-evenly',
  };

  function sduiEl(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function sduiRenderLayout(layout, spacing, align, box, children, dialect) {
    const isRow = /row/i.test(layout || 'column');
    const scroll = /scroll/i.test(layout || '');
    const el = sduiEl('div');
    el.style.display = 'flex';
    el.style.flexDirection = isRow ? 'row' : 'column';
    if (spacing != null) el.style.gap = spacing + 'px';
    el.style.justifyContent = SDUI_FLEX_MAP[align && align.arrangement] || 'flex-start';
    el.style.alignItems = SDUI_FLEX_MAP[align && align.alignment] || (isRow ? 'center' : 'stretch');
    if (scroll) { el.style.overflowX = isRow ? 'auto' : 'hidden'; el.style.overflowY = isRow ? 'hidden' : 'auto'; }
    sduiApplyBox(el, box);
    (children || []).forEach(c => {
      const ch = sduiRenderNode(c, dialect);
      if (!ch) return;
      const f = sduiFillFlags(c);
      const cst = (c && c.style) || {}, cmod = (c && c.modifier) || {};
      const hasW = cst.width != null || cmod.width != null;
      if (isRow) {
        // main = ngang
        if (f.weight != null) { ch.style.flex = String(f.weight); ch.style.minWidth = '0'; }
        else if (f.fillW || f.spacer) { ch.style.flex = '1'; ch.style.minWidth = '0'; }
        else if (hasW) { ch.style.flexShrink = '0'; }  // giữ nguyên width, không bị bóp
        // cross = dọc → item đều chiều cao
        if (f.fillH) ch.style.alignSelf = 'stretch';
      } else {
        // main = dọc
        if (f.weight != null) { ch.style.flex = String(f.weight); ch.style.minHeight = '0'; }
        else if (f.fillH || f.spacer) { ch.style.flex = '1'; ch.style.minHeight = '0'; }
        // cross = ngang
        if (f.fillW) ch.style.alignSelf = 'stretch';
      }
      if (c && c._bid != null) ch.setAttribute('data-bid', c._bid);
      el.appendChild(ch);
    });
    return el;
  }

  function sduiFillFlags(c) {
    const st = (c && c.style) || {}, mod = (c && c.modifier) || {};
    return {
      fillW: !!(st.fillMaxWidth || mod.fillMaxWidth || mod.fillMaxSize),
      fillH: !!(st.fillMaxHeight || mod.fillMaxHeight || mod.fillMaxSize),
      weight: (mod.weight != null) ? mod.weight : null,
      spacer: c && c.type === 'spacer',
    };
  }

  // ─── Placeholder Image Generator ───
  function sduiGetPlaceholderImage(width, height) {
    // Use a default image from assets instead of SVG placeholder
    // This is a hardcoded template image that looks clean and professional
    return '/assets/widget/template_image.png';
  }

  function sduiRenderNode(node, dialect) {
    if (!node || typeof node !== 'object') return null;

    // ---- Dialect A: widget node tree (has `type`) ----
    if (typeof node.type === 'string' && ['container', 'text', 'image', 'button', 'tag', 'spacer'].includes(node.type)) {
      const st = node.style || {}, pr = node.property || {};
      if (node.type === 'container') {
        const el = sduiRenderLayout(pr.layout, pr.spacing, { alignment: pr.alignment }, st,
          (node.value && node.value.children) || [], dialect);
        if (node.onTap) el.style.cursor = 'pointer';
        return el;
      }
      if (node.type === 'text') {
        const el = sduiEl('div'); const tp = sduiTypo(pr.typography);
        el.textContent = (typeof node.value === 'string') ? node.value : '';
        el.style.fontSize = tp.s + 'px'; el.style.fontWeight = tp.w;
        el.style.color = pr.color || '#222';
        if (pr.textAlignment) el.style.textAlign = pr.textAlignment;
        if (pr.lineLimit) { el.style.display = '-webkit-box'; el.style.webkitLineClamp = pr.lineLimit; el.style.webkitBoxOrient = 'vertical'; el.style.overflow = 'hidden'; }
        sduiApplyBox(el, st);
        return el;
      }
      if (node.type === 'image') {
        const el = sduiEl('img');
        const imgWidth = st.width || 48;
        const imgHeight = st.height || 48;

        // Determine if value is a valid URL or just a label
        let imgUrl = sduiGetPlaceholderImage(imgWidth, imgHeight);
        if (typeof node.value === 'string') {
          const val = node.value.trim();
          // Check if it's a URL (starts with http, https, data, or //)
          if (val.match(/^(https?:|data:|\/\/)/i)) {
            imgUrl = val;
          }
          // Else it's a label like "image 41" - use placeholder
        }

        el.src = imgUrl;
        el.referrerPolicy = 'no-referrer';
        el.style.objectFit = (pr.contentMode === 'fill') ? 'cover' : 'contain';
        el.style.width = imgWidth + 'px';
        el.style.height = imgHeight + 'px';
        if (st.cornerRadius != null) el.style.borderRadius = st.cornerRadius + 'px';
        else if (pr.cornerRadius != null) el.style.borderRadius = pr.cornerRadius + 'px';
        el.style.background = '#eee'; el.style.flexShrink = '0';
        el.onerror = function () { this.src = sduiGetPlaceholderImage(imgWidth, imgHeight); this.style.background = 'transparent'; };
        return el;
      }
      if (node.type === 'button') {
        const v = node.value || {}; const el = sduiEl('button');
        el.textContent = v.title || 'Button';
        const bt = (v.type || 'primary');
        sduiStyleButton(el, bt, pr.color);
        return el;
      }
      if (node.type === 'tag') {
        const el = sduiEl('span'); el.textContent = (typeof node.value === 'string') ? node.value : 'TAG';
        sduiStyleTag(el, pr.tagType, pr.backgroundColor, pr.textColor);
        return el;
      }
      if (node.type === 'spacer') {
        const el = sduiEl('div');
        if (pr.minLength) { el.style.minWidth = pr.minLength + 'px'; el.style.minHeight = pr.minLength + 'px'; }
        el.style.flex = '1'; return el;
      }
    }

    // ---- Dialect B: dataSchema leaf (has `componentType`) ----
    if (node.componentType) {
      const ct = node.componentType, st = node.style || {}, mod = node.modifier || {};
      if (ct === 'TEXT') {
        const el = sduiEl('div'); const tp = sduiTypo(st.typography);
        el.textContent = '{' + (node.field || 'text') + '}';
        el.style.fontSize = tp.s + 'px'; el.style.fontWeight = st.fontWeight || tp.w;
        el.style.color = st.color || '#222';
        el.style.fontStyle = 'italic'; el.style.opacity = '0.85';
        sduiApplyBox(el, mod);
        return el;
      }
      if (ct === 'ICON') {
        const el = sduiEl('img'); const sz = node.iconSize || 24;
        el.src = sduiGetPlaceholderImage(sz, sz);
        el.title = node.field || 'icon';
        el.style.width = sz + 'px'; el.style.height = sz + 'px';
        el.style.display = 'flex'; el.style.flexShrink = '0';
        el.style.borderRadius = '6px';
        el.style.objectFit = 'contain';
        el.onerror = function () { this.src = sduiGetPlaceholderImage(sz, sz); };
        sduiApplyBox(el, mod);
        return el;
      }
      if (ct === 'IMAGE') {
        const el = sduiEl('img');
        el.src = sduiGetPlaceholderImage(200, 120);
        el.title = node.field || 'image';
        el.style.minHeight = '60px'; el.style.width = '100%'; el.style.maxWidth = '100%';
        el.style.borderRadius = '8px';
        el.style.objectFit = 'cover';
        el.style.background = '#f0f0f3';
        el.onerror = function () { this.src = sduiGetPlaceholderImage(200, 120); };
        sduiApplyBox(el, mod); return el;
      }
      if (ct === 'CTA_BUTTON') {
        const el = sduiEl('button'); el.textContent = 'Action';
        sduiStyleButton(el, 'primary'); sduiApplyBox(el, mod); return el;
      }
      if (ct === 'TAG') {
        const el = sduiEl('span'); el.textContent = '{' + (node.field || 'tag') + '}';
        sduiStyleTag(el, st.tagType); return el;
      }
      if (ct === 'ITEM_LIST') {
        const wrap = sduiEl('div'); wrap.style.display = 'flex'; wrap.style.flexDirection = 'column'; wrap.style.gap = '8px';
        wrap.style.width = '100%';
        sduiApplyBox(wrap, mod);
        const n = Math.min(node.maxItems || 2, 3);
        for (let i = 0; i < n; i++) {
          const item = sduiRenderNode(node.itemTemplate, dialect);
          if (item) wrap.appendChild(item);
        }
        return wrap;
      }
      // unknown component
      const el = sduiEl('div'); el.textContent = ct; el.style.fontSize = '11px'; el.style.color = '#999'; return el;
    }

    // ---- Dialect B: layout container (has `layout`/`children`) ----
    if (node.layout || node.children) {
      const mod = node.modifier || {};
      return sduiRenderLayout(node.layout, mod.spacing, mod, mod, node.children || [], dialect);
    }

    // ---- content_* value: header/body/footer ----
    if (node.body || node.footer || node.header) {
      const wrap = sduiEl('div'); wrap.style.display = 'flex'; wrap.style.flexDirection = 'column'; wrap.style.gap = '8px';
      ['header', 'body', 'footer'].forEach(k => { if (node[k]) { const c = sduiRenderNode(node[k], dialect); if (c) wrap.appendChild(c); } });
      return wrap;
    }
    return null;
  }

  function sduiStyleButton(el, type, colorOverride) {
    el.style.padding = '7px 14px'; el.style.borderRadius = '8px'; el.style.fontSize = '12px';
    el.style.fontWeight = '600'; el.style.cursor = 'pointer'; el.style.border = '1px solid transparent';
    el.style.fontFamily = 'inherit'; el.style.flexShrink = '0';
    const map = {
      primary:  ['#a50064', '#fff', '#a50064'],
      secondary:['#f0f0f3', '#333', '#f0f0f3'],
      tonal:    ['#fce4f1', '#a50064', '#fce4f1'],
      outline:  ['transparent', colorOverride || '#a50064', colorOverride || '#a50064'],
      danger:   ['#e53935', '#fff', '#e53935'],
      text:     ['transparent', colorOverride || '#a50064', 'transparent'],
      disabled: ['#eaeaea', '#aaa', '#eaeaea'],
    };
    const [bg, fg, bd] = map[type] || map.primary;
    el.style.background = bg; el.style.color = fg; el.style.borderColor = bd;
  }

  function sduiStyleTag(el, tagType, bgOverride, fgOverride) {
    el.style.padding = '2px 8px'; el.style.borderRadius = '10px'; el.style.fontSize = '10px';
    el.style.fontWeight = '700'; el.style.display = 'inline-block'; el.style.alignSelf = 'flex-start';
    const map = {
      info:     ['#e3f2fd', '#1565c0'], success: ['#e6f7ed', '#1b873f'],
      error:    ['#fdecea', '#c62828'], warning: ['#fff3e0', '#e65100'],
      highlight:['#fde7f1', '#a50064'],
    };
    const [bg, fg] = map[tagType] || map.highlight;
    el.style.background = bgOverride || bg; el.style.color = fgOverride || fg;
  }

  // Bóc tách node gốc từ nhiều dạng input rồi render vào hostEl.
  function sduiRenderPreview(raw, hostEl) {
    hostEl.innerHTML = '';
    if (!raw || !String(raw).trim()) {
      hostEl.innerHTML = '<div class="sdui-pv-empty">Chưa có schema để preview</div>';
      return;
    }
    let parsed;
    try { parsed = (typeof raw === 'string') ? JSON.parse(raw) : raw; }
    catch (e) { hostEl.innerHTML = '<div class="sdui-pv-empty">⚠️ JSON không hợp lệ — không thể preview</div>'; return; }

    let root = parsed;
    // unwrap dataSchema → content_* → value
    if (parsed.dataSchema) {
      const ds = parsed.dataSchema;
      const key = Object.keys(ds).find(k => k.startsWith('content'));
      if (key && ds[key] && ds[key].value) root = ds[key].value;
    }
    // unwrap zone → data[0]
    if (root && root.type === 'template_widget') {
      root = Array.isArray(root.data) ? root.data[0] : root.data;
    }
    if (Array.isArray(root)) root = root[0];

    const canvas = sduiEl('div', 'sdui-pv-canvas');
    const rendered = sduiRenderNode(root, 'auto');
    if (!rendered) { hostEl.innerHTML = '<div class="sdui-pv-empty">Không nhận diện được cấu trúc schema</div>'; return; }
    if (root && root._bid != null) rendered.setAttribute('data-bid', root._bid);
    canvas.appendChild(rendered);
    hostEl.appendChild(canvas);
  }

  // Toggle JSON / Preview trong Output của Generator
  function sduiToggleOutputView(mode) {
    const jsonWrap = document.getElementById('sduiOutputJsonWrap');
    const pv = document.getElementById('sduiOutPreview');
    document.querySelectorAll('.sdui-view-tab').forEach(t => t.classList.toggle('active', t.dataset.view === mode));
    if (mode === 'preview') {
      jsonWrap.style.display = 'none'; pv.style.display = 'flex';
      sduiRenderPreview(sduiState.currentOutput, pv);
    } else {
      jsonWrap.style.display = ''; pv.style.display = 'none';
    }
  }

  // Export preview (schema → ảnh PNG)
  function sduiExportPng(frameId, name) {
    const frame = document.getElementById(frameId);
    const canvasEl = frame && frame.querySelector('.sdui-pv-canvas');
    if (!canvasEl) { showToast('Chưa có preview để export', 'warn'); return; }
    if (!window.html2canvas) { showToast('html2canvas chưa tải xong', 'warn'); return; }
    showToast('Đang render ảnh…', 'info');
    window.html2canvas(canvasEl, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false })
      .then(canvas => {
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = (name || 'sdui-preview') + '-' + Date.now() + '.png';
          a.click();
          URL.revokeObjectURL(url);
          showToast('Đã export PNG');
        }, 'image/png');
      })
      .catch(err => { console.error(err); showToast('Export thất bại: ' + err.message, 'warn'); });
  }

  // ==================== COMPONENT BUILDER (nested tree + live preview) ====================
  const B_TYPO = ['labelXsMedium', 'labelSMedium', 'headerXsSemibold', 'headerSSemibold', 'headerDefaultBold', 'descriptionXsRegular', 'descriptionDefaultRegular', 'actionSBold'];
  const B_BTN = ['primary', 'secondary', 'tonal', 'outline', 'danger', 'text', 'disabled'];
  const B_TAG = ['info', 'success', 'error', 'warning', 'highlight'];
  const B_CHILD_TYPES = ['text', 'image', 'button', 'tag', 'spacer', 'container'];

  let builderTree = null;
  let builderUid = 0;
  let builderSelectedId = null;

  function bNum(v) { if (v === '' || v == null) return undefined; const n = Number(v); return isNaN(n) ? undefined : n; }
  function bAttr(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function bNewNode(type) {
    const id = 'b' + (++builderUid);
    switch (type) {
      case 'container': return { _id: id, type: 'container', layout: 'column', spacing: 8, alignment: '', padding: 0, bg: '', radius: 0, width: '', height: '', fillMaxWidth: false, fillMaxHeight: false, children: [] };
      case 'text':      return { _id: id, type: 'text', value: 'Text', typography: 'headerSSemibold', color: '#303233', lineLimit: 1 };
      case 'image':     return { _id: id, type: 'image', url: 'https://static.momocdn.net/app/icon/promotion/logo.png', width: 52, height: 52, radius: 8, contentMode: 'fill' };
      case 'button':    return { _id: id, type: 'button', title: 'Thu thập', btype: 'primary', color: '#303233' };
      case 'tag':       return { _id: id, type: 'tag', value: 'HOT', tagType: 'highlight' };
      case 'spacer':    return { _id: id, type: 'spacer', minLength: 0 };
    }
    return { _id: id, type: 'text', value: '' };
  }

  function builderSeed() {
    const root = bNewNode('container'); root.bg = '#FFFFFF'; root.radius = 12; root.padding = 12; root.spacing = 8;
    const row = bNewNode('container'); row.layout = 'row'; row.alignment = 'center'; row.spacing = 10;
    const img = bNewNode('image'); img.radius = 26;
    const col = bNewNode('container'); col.spacing = 2; col.fillMaxWidth = true;
    const t1 = bNewNode('text'); t1.value = 'Highlands Coffee'; t1.typography = 'labelXsMedium'; t1.color = '#727272';
    const t2 = bNewNode('text'); t2.value = 'Giảm 50.000đ cho hóa đơn từ 150.000đ'; t2.typography = 'headerSSemibold'; t2.color = '#303233';
    col.children = [t1, t2];
    const btn = bNewNode('button');
    row.children = [img, col, btn];
    root.children = [row];
    return root;
  }

  // --- tree lookup ---
  function builderFind(id, node, parent) {
    node = node || builderTree;
    if (!node) return null;
    if (node._id === id) return { node: node, parent: parent };
    if (node.children) { for (const c of node.children) { const r = builderFind(id, c, node); if (r) return r; } }
    return null;
  }

  // --- mutations ---
  function builderSet(id, key, val) { const f = builderFind(id); if (f) { f.node[key] = val; builderRefresh(); } }
  function builderChangeType(id, type) {
    const f = builderFind(id); if (!f || !f.parent) return;
    const nn = bNewNode(type); nn._id = id;
    const i = f.parent.children.indexOf(f.node); f.parent.children[i] = nn;
    builderRenderTree(); builderRefresh();
  }
  function builderAddChild(id, type) {
    const f = builderFind(id); if (f && f.node.type === 'container') { f.node.children.push(bNewNode(type)); builderRenderTree(); builderRefresh(); }
  }
  function builderRemove(id) {
    const f = builderFind(id); if (f && f.parent) { const i = f.parent.children.indexOf(f.node); f.parent.children.splice(i, 1); builderRenderTree(); builderRefresh(); }
  }
  function builderMove(id, dir) {
    const f = builderFind(id); if (!f || !f.parent) return;
    const arr = f.parent.children, i = arr.indexOf(f.node), j = i + dir;
    if (j < 0 || j >= arr.length) return;
    arr[i] = arr[j]; arr[j] = f.node;
    builderRenderTree(); builderRefresh();
  }

  // --- form helpers ---
  function bInp(id, key, val, type) {
    return '<input class="form-input" type="' + (type || 'text') + '" value="' + bAttr(val) + '" oninput="builderSet(\'' + id + '\',\'' + key + '\',this.value)">';
  }
  function bSel(id, key, opts, cur) {
    return '<select class="form-select" onchange="builderSet(\'' + id + '\',\'' + key + '\',this.value)">' +
      opts.map(o => '<option value="' + bAttr(o) + '"' + (o === cur ? ' selected' : '') + '>' + (o === '' ? '(default)' : bAttr(o)) + '</option>').join('') + '</select>';
  }
  function bField(label, inner) { return '<div class="form-group"><label>' + label + '</label>' + inner + '</div>'; }

  function builderNodeFields(node) {
    const id = node._id, t = node.type;
    if (t === 'container') {
      return '<div class="form-grid">' +
        bField('Layout', bSel(id, 'layout', ['column', 'row', 'scrollRow', 'scrollColumn'], node.layout)) +
        bField('Alignment', bSel(id, 'alignment', ['', 'center', 'left', 'right', 'top', 'bottom'], node.alignment)) +
        bField('Spacing', bInp(id, 'spacing', node.spacing, 'number')) +
        bField('Padding', bInp(id, 'padding', node.padding, 'number')) +
        bField('Width', bInp(id, 'width', node.width, 'number')) +
        bField('Height', bInp(id, 'height', node.height, 'number')) +
        bField('Background', bInp(id, 'bg', node.bg)) +
        bField('Radius', bInp(id, 'radius', node.radius, 'number')) +
        '</div>' +
        '<div style="display:flex; gap:16px; flex-wrap:wrap;">' +
        '<label class="builder-check"><input type="checkbox" ' + (node.fillMaxWidth ? 'checked' : '') +
        ' onchange="builderSet(\'' + id + '\',\'fillMaxWidth\',this.checked)"> fillMaxWidth</label>' +
        '<label class="builder-check"><input type="checkbox" ' + (node.fillMaxHeight ? 'checked' : '') +
        ' onchange="builderSet(\'' + id + '\',\'fillMaxHeight\',this.checked)"> fillMaxHeight (item đều nhau trong row)</label>' +
        '</div>';
    }
    if (t === 'text') {
      return '<div class="form-grid">' +
        bField('Value', bInp(id, 'value', node.value)) +
        bField('Typography', bSel(id, 'typography', B_TYPO, node.typography)) +
        bField('Color', bInp(id, 'color', node.color)) +
        bField('Line limit', bInp(id, 'lineLimit', node.lineLimit, 'number')) +
        '</div>';
    }
    if (t === 'image') {
      return '<div class="form-grid">' +
        bField('URL', bInp(id, 'url', node.url)) +
        bField('Content mode', bSel(id, 'contentMode', ['fit', 'fill'], node.contentMode)) +
        bField('Width', bInp(id, 'width', node.width, 'number')) +
        bField('Height', bInp(id, 'height', node.height, 'number')) +
        bField('Radius', bInp(id, 'radius', node.radius, 'number')) +
        '</div>';
    }
    if (t === 'button') {
      return '<div class="form-grid">' +
        bField('Title', bInp(id, 'title', node.title)) +
        bField('Type', bSel(id, 'btype', B_BTN, node.btype)) +
        bField('Color', bInp(id, 'color', node.color)) +
        '</div>';
    }
    if (t === 'tag') {
      return '<div class="form-grid">' +
        bField('Value', bInp(id, 'value', node.value)) +
        bField('Tag type', bSel(id, 'tagType', B_TAG, node.tagType)) +
        '</div>';
    }
    if (t === 'spacer') {
      return '<div class="form-grid">' + bField('Min length', bInp(id, 'minLength', node.minLength, 'number')) + '</div>';
    }
    return '';
  }

  function bTypeSel(id, cur) {
    return '<select class="builder-type-sel" onclick="event.stopPropagation()" onchange="builderChangeType(\'' + id + '\',this.value)">' +
      B_CHILD_TYPES.map(o => '<option value="' + o + '"' + (o === cur ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>';
  }

  const B_TYPE_ICO = { container: '📦', text: '🔤', image: '🖼', button: '🔘', tag: '🏷', spacer: '↔' };

  function builderSummary(node) {
    const t = node.type;
    if (t === 'container') return (node.layout || 'column') + ' · ' + ((node.children || []).length) + ' con';
    if (t === 'text') return '“' + (node.value || '') + '”';
    if (t === 'button') return node.title || 'button';
    if (t === 'tag') return node.value || 'tag';
    if (t === 'image') return 'image';
    if (t === 'spacer') return 'spacer';
    return '';
  }

  function builderRenderNode(node, isRoot) {
    // Mặc định GẬP property (chỉ mở khi bấm caret/expand). Children luôn hiện để thấy cấu trúc.
    const collapsed = node._collapsed !== false;
    const sel = node._id === builderSelectedId;
    let h = '<div class="builder-node' + (sel ? ' selected' : '') + '" data-node="' + node._id + '">';
    h += '<div class="builder-node-head" onclick="builderSelectNode(\'' + node._id + '\')">';
    h += '<button class="builder-caret" title="Thu / mở property" onclick="event.stopPropagation();builderToggleCollapse(\'' + node._id + '\')">' + (collapsed ? '▸' : '▾') + '</button>';
    if (isRoot) {
      h += '<span class="builder-node-type">📦 Root</span>';
    } else {
      h += '<span class="builder-node-ico">' + (B_TYPE_ICO[node.type] || '') + '</span>' + bTypeSel(node._id, node.type);
    }
    h += '<span class="builder-summary">' + bAttr(builderSummary(node)) + '</span>';
    h += '<span style="flex:1"></span>';
    if (!isRoot) {
      h += '<button class="builder-mini" title="Lên" onclick="event.stopPropagation();builderMove(\'' + node._id + '\',-1)">↑</button>';
      h += '<button class="builder-mini" title="Xuống" onclick="event.stopPropagation();builderMove(\'' + node._id + '\',1)">↓</button>';
      h += '<button class="builder-mini danger" title="Xoá" onclick="event.stopPropagation();builderRemove(\'' + node._id + '\')">✕</button>';
    }
    h += '</div>';
    if (!collapsed) h += builderNodeFields(node);
    if (node.type === 'container') {
      h += '<div class="builder-children">';
      h += (node.children || []).map(c => builderRenderNode(c, false)).join('');
      h += '<div class="builder-add" onclick="event.stopPropagation()">' +
        '<select class="form-select" id="addsel_' + node._id + '">' +
        B_CHILD_TYPES.map(o => '<option value="' + o + '">' + o + '</option>').join('') + '</select>' +
        '<button class="btn btn-ghost" onclick="builderAddChild(\'' + node._id + '\',document.getElementById(\'addsel_' + node._id + '\').value)">＋ Add child</button>' +
        '</div>';
      h += '</div>';
    }
    h += '</div>';
    return h;
  }

  function builderToggleCollapse(id) {
    const f = builderFind(id);
    if (f) { f.node._collapsed = (f.node._collapsed !== false) ? false : true; builderRenderTree(); }
  }
  function builderSetAllCollapsed(val) {
    (function walk(n) {
      n._collapsed = val;
      if (n.children) n.children.forEach(walk);
    })(builderTree);
    builderRenderTree();
  }

  function builderRenderTree() {
    const host = document.getElementById('builderTree');
    if (host && builderTree) host.innerHTML = builderRenderNode(builderTree, true);
    builderRenderInspector();
  }

  // --- Inspector: property của node đang chọn (panel bên phải) ---
  function builderRenderInspector() {
    const host = document.getElementById('builderInspectorBody');
    const insp = document.getElementById('builderInspector');
    if (!host) return;
    const hint = '<div class="builder-insp-hint">👈 Click vào component trong <strong>Preview</strong> (hoặc trong cây) để chỉnh thuộc tính tại đây.</div>';
    if (!builderSelectedId) { if (insp) insp.classList.remove('open'); host.innerHTML = hint; return; }
    const f = builderFind(builderSelectedId);
    if (!f) { builderSelectedId = null; if (insp) insp.classList.remove('open'); host.innerHTML = hint; return; }
    if (insp) insp.classList.add('open');
    const node = f.node, isRoot = (node === builderTree);
    let h = '<div class="builder-insp-head">';
    h += '<span class="builder-node-ico">' + (B_TYPE_ICO[node.type] || '📦') + '</span> ';
    h += '<strong>' + (isRoot ? 'Root container' : node.type) + '</strong>';
    h += '<span style="flex:1"></span>';
    if (!isRoot) {
      h += '<button class="builder-mini" title="Lên" onclick="builderMove(\'' + node._id + '\',-1)">↑</button>';
      h += '<button class="builder-mini" title="Xuống" onclick="builderMove(\'' + node._id + '\',1)">↓</button>';
      h += '<button class="builder-mini danger" title="Xoá" onclick="builderRemove(\'' + node._id + '\')">✕</button>';
    }
    h += '</div>';
    h += builderNodeFields(node);
    if (node.type === 'container') {
      h += '<div class="builder-add" style="margin-top:12px;">' +
        '<select class="form-select" id="inspaddsel">' +
        B_CHILD_TYPES.map(o => '<option value="' + o + '">' + o + '</option>').join('') + '</select>' +
        '<button class="btn btn-ghost" onclick="builderAddChild(\'' + node._id + '\',document.getElementById(\'inspaddsel\').value)">＋ Add child</button>' +
        '</div>';
    }
    host.innerHTML = h;
  }

  function builderHighlightPreview(bid) {
    const pv = document.getElementById('builderPreview');
    if (!pv) return;
    pv.querySelectorAll('.bld-sel').forEach(e => e.classList.remove('bld-sel'));
    if (bid) { const el = pv.querySelector('[data-bid="' + bid + '"]'); if (el) el.classList.add('bld-sel'); }
  }

  // --- schema build (widget node tree dialect) ---
  function builderToSchema(node, withBid) {
    const t = node.type;
    let out;
    if (t === 'container') {
      const style = {};
      if (node.bg) style.backgroundColor = node.bg;
      if (bNum(node.radius)) style.cornerRadius = bNum(node.radius);
      if (bNum(node.padding) != null) style.padding = { all: bNum(node.padding) };
      if (node.fillMaxWidth) style.fillMaxWidth = true;
      if (node.fillMaxHeight) style.fillMaxHeight = true;
      if (bNum(node.width) != null) style.width = bNum(node.width);
      if (bNum(node.height) != null) style.height = bNum(node.height);
      const property = { layout: node.layout || 'column' };
      if (bNum(node.spacing) != null) property.spacing = bNum(node.spacing);
      if (node.alignment) property.alignment = node.alignment;
      out = { type: 'container', style: style, property: property, value: { children: (node.children || []).map(c => builderToSchema(c, withBid)) } };
    } else if (t === 'text') {
      const p = {};
      if (node.typography) p.typography = node.typography;
      if (node.color) p.color = node.color;
      if (bNum(node.lineLimit) != null) p.lineLimit = bNum(node.lineLimit);
      out = { type: 'text', style: {}, property: p, value: node.value || '' };
    } else if (t === 'image') {
      const s = {};
      if (bNum(node.width) != null) s.width = bNum(node.width);
      if (bNum(node.height) != null) s.height = bNum(node.height);
      if (bNum(node.radius) != null) s.cornerRadius = bNum(node.radius);
      const p = {};
      if (node.contentMode) p.contentMode = node.contentMode;
      out = { type: 'image', style: s, property: p, value: node.url || '' };
    } else if (t === 'button') {
      const p = { ctaType: 'BUTTON' };
      if (node.color) p.color = node.color;
      const v = { title: node.title || 'Button' };
      if (node.btype) v.type = node.btype;
      out = { type: 'button', style: {}, property: p, value: v };
    } else if (t === 'tag') {
      const p = {};
      if (node.tagType) p.tagType = node.tagType;
      out = { type: 'tag', style: {}, property: p, value: node.value || '' };
    } else if (t === 'spacer') {
      const p = {};
      if (bNum(node.minLength)) p.minLength = bNum(node.minLength);
      out = { type: 'spacer', style: {}, property: p, value: '' };
    } else {
      out = { type: 'text', style: {}, property: {}, value: '' };
    }
    if (withBid) out._bid = node._id;
    return out;
  }

  function builderCurrentSchema() {
    if (!builderTree) builderTree = builderSeed();
    return { type: 'template_widget', templateType: 'SDUI_WIDGET', data: [builderToSchema(builderTree)] };
  }
  // Bản có gắn _bid để preview map ngược về node (không dùng cho JSON output)
  function builderTaggedSchema() {
    if (!builderTree) builderTree = builderSeed();
    return { type: 'template_widget', templateType: 'SDUI_WIDGET', data: [builderToSchema(builderTree, true)] };
  }

  // Live refresh: cập nhật JSON + preview ngay khi chỉnh
  // Lưu vị trí cuộn của các vùng cuộn BÊN TRONG preview (vd hàng card cuộn ngang),
  // theo data-bid — vì các element này bị huỷ & tạo lại khi re-render. Kèm theo
  // các ancestor có thể cuộn + window cho chắc.
  function builderCaptureScrolls(pv) {
    const inner = {};
    pv.querySelectorAll('[data-bid]').forEach(el => {
      if (el.scrollLeft || el.scrollTop) inner[el.getAttribute('data-bid')] = [el.scrollLeft, el.scrollTop];
    });
    const outer = [];
    for (let n = pv; n && n.nodeType === 1; n = n.parentElement) {
      if (n.scrollHeight > n.clientHeight || n.scrollWidth > n.clientWidth) outer.push([n, n.scrollLeft, n.scrollTop]);
    }
    outer.push([window, window.scrollX, window.scrollY]);
    return { inner, outer };
  }
  function builderRestoreScrolls(pv, saved) {
    pv.querySelectorAll('[data-bid]').forEach(el => {
      const s = saved.inner[el.getAttribute('data-bid')];
      if (s) { el.scrollLeft = s[0]; el.scrollTop = s[1]; }
    });
    saved.outer.forEach(s => {
      if (s[0] === window) window.scrollTo(s[1], s[2]);
      else { s[0].scrollLeft = s[1]; s[0].scrollTop = s[2]; }
    });
  }
  function builderRefresh() {
    if (!builderTree) return;
    const json = JSON.stringify(builderCurrentSchema(), null, 2);
    const out = document.getElementById('builderOutput');
    if (out) out.innerHTML = sduiEscapeHtml(json);
    const pv = document.getElementById('builderPreview');
    if (pv) {
      const saved = builderCaptureScrolls(pv);   // giữ vị trí cuộn trước khi re-render
      sduiRenderPreview(builderTaggedSchema(), pv);
      builderHighlightPreview(builderSelectedId);
      builderRestoreScrolls(pv, saved);
      requestAnimationFrame(() => builderRestoreScrolls(pv, saved));
    }
    builderSaveDraft();
  }

  // --- click-to-select (Figma style): click preview/cây → mở Inspector của node đó ---
  function builderSelectNode(bid) {
    builderSelectedId = bid;
    // highlight trong cây (không re-render để giữ focus khi đang gõ)
    document.querySelectorAll('#builderTree .builder-node').forEach(n =>
      n.classList.toggle('selected', n.getAttribute('data-node') === bid));
    // auto-scroll tới node trong cây (preview sticky nên không bị mất)
    const card = document.querySelector('#builderTree .builder-node[data-node="' + bid + '"]');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    builderHighlightPreview(bid);
    builderRenderInspector();
  }
  function builderCloseInspector() {
    builderSelectedId = null;
    document.querySelectorAll('#builderTree .builder-node.selected').forEach(n => n.classList.remove('selected'));
    builderHighlightPreview(null);
    builderRenderInspector();
  }

  function builderPreviewClick(e) {
    const el = e.target.closest('[data-bid]');
    if (!el) return;
    builderSelectNode(el.getAttribute('data-bid'));
  }

  // --- persist current tree (nháp) ---
  function builderSaveDraft() { try { localStorage.setItem('cs_builder_tree', JSON.stringify(builderTree)); } catch (e) {} }
  function builderSyncUid(node) {
    if (!node) return;
    const m = /^b(\d+)$/.exec(node._id || '');
    if (m) builderUid = Math.max(builderUid, +m[1]);
    (node.children || []).forEach(builderSyncUid);
  }

  // --- import: JSON schema → builder tree ---
  function schemaToBuilderNode(node) {
    const ok = ['container', 'text', 'image', 'button', 'tag', 'spacer'];
    const type = ok.includes(node && node.type) ? node.type : 'text';
    const n = bNewNode(type);
    const st = (node && node.style) || {}, pr = (node && node.property) || {};
    if (type === 'container') {
      if (pr.layout) n.layout = pr.layout;
      n.spacing = pr.spacing != null ? pr.spacing : '';
      n.alignment = pr.alignment || '';
      n.padding = (st.padding == null) ? '' : (typeof st.padding === 'object' ? (st.padding.all != null ? st.padding.all : (st.padding.top || 0)) : st.padding);
      n.bg = st.backgroundColor || '';
      n.radius = st.cornerRadius != null ? st.cornerRadius : 0;
      n.width = st.width != null ? st.width : '';
      n.height = st.height != null ? st.height : '';
      n.fillMaxWidth = !!st.fillMaxWidth;
      n.fillMaxHeight = !!st.fillMaxHeight;
      n.children = ((node.value && node.value.children) || []).map(schemaToBuilderNode);
    } else if (type === 'text') {
      n.value = typeof node.value === 'string' ? node.value : '';
      if (pr.typography) n.typography = pr.typography;
      if (pr.color) n.color = pr.color;
      n.lineLimit = pr.lineLimit != null ? pr.lineLimit : '';
    } else if (type === 'image') {
      n.url = typeof node.value === 'string' ? node.value : '';
      if (st.width != null) n.width = st.width;
      if (st.height != null) n.height = st.height;
      n.radius = st.cornerRadius != null ? st.cornerRadius : (pr.cornerRadius != null ? pr.cornerRadius : 0);
      if (pr.contentMode) n.contentMode = pr.contentMode;
    } else if (type === 'button') {
      const v = node.value || {};
      n.title = v.title || '';
      if (v.type) n.btype = v.type;
      if (pr.color) n.color = pr.color;
    } else if (type === 'tag') {
      n.value = typeof node.value === 'string' ? node.value : '';
      if (pr.tagType) n.tagType = pr.tagType;
    } else if (type === 'spacer') {
      n.minLength = pr.minLength != null ? pr.minLength : 0;
    }
    return n;
  }

  // Parse a full schema object → builder tree (returns null if not a widget node tree)
  function builderParseSchemaToTree(parsed) {
    let root = parsed;

    // Unwrap lazy_loads structure (from Figma extraction)
    if (root && root.lazy_loads && Array.isArray(root.lazy_loads) && root.lazy_loads.length > 0) {
      const lazyLoad = root.lazy_loads[0];
      if (lazyLoad && lazyLoad.data && Array.isArray(lazyLoad.data)) {
        root = lazyLoad.data[0]; // Get first server_driven_widget → template_widget
      }
    }

    // Unwrap dataSchema (from AI generation)
    if (root && root.dataSchema) {
      const ds = root.dataSchema, k = Object.keys(ds).find(x => x.startsWith('content'));
      if (k && ds[k] && ds[k].value) root = ds[k].value;
    }

    // Unwrap template_widget
    if (root && root.type === 'template_widget') {
      root = Array.isArray(root.data) ? root.data[0] : root.data;
    }

    // Handle array of components (compact format)
    if (Array.isArray(root)) root = root[0];

    const ok = ['container', 'text', 'image', 'button', 'tag', 'spacer'];
    if (!root || !ok.includes(root.type)) return null;
    const tree = schemaToBuilderNode(root);
    builderSyncUid(tree);
    return tree;
  }

  function builderImport() {
    const ta = document.getElementById('builderImportText');
    const val = ta ? ta.value.trim() : '';
    if (!val) return showToast('Chưa có JSON', 'warn');
    let parsed;
    try { parsed = JSON.parse(val); } catch (e) { return showToast('JSON không hợp lệ', 'warn'); }
    const tree = builderParseSchemaToTree(parsed);
    if (!tree) return showToast('Không phải widget node tree (chỉ import dạng type/value)', 'warn');
    builderTree = tree;
    builderRenderTree(); builderRefresh();
    showToast('Đã import schema');
  }
  function builderImportFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const ta = document.getElementById('builderImportText');
      if (ta) ta.value = ev.target.result;
      builderImport();
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // --- saved schemas library (Supabase-backed, localStorage fallback) ---
  // When Supabase is configured (js/supabase-config.js) the library is shared: Save/Edit/Delete
  // write straight to the DB so everyone sees changes on next load — no commit/redeploy needed.
  // When it isn't configured, everything falls back to per-browser localStorage (offline mode).
  let builderSavedCache = null; // in-memory mirror of the library, list of {id?, name, tree, ts}

  function builderHasCloud() {
    var u = window.SUPABASE_URL, k = window.SUPABASE_ANON_KEY;
    return !!(u && k && u.indexOf('YOUR_') === -1 && k.indexOf('YOUR_') === -1);
  }
  function builderCloudUrl(path) { return window.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + path; }
  function builderCloudHeaders(extra) {
    return Object.assign({
      'apikey': window.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + window.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    }, extra || {});
  }

  // localStorage mirror (offline + fallback cache)
  function builderLocalGet() { try { return JSON.parse(localStorage.getItem('cs_builder_saved') || '[]'); } catch (e) { return []; } }
  function builderLocalSet(arr) { try { localStorage.setItem('cs_builder_saved', JSON.stringify(arr)); } catch (e) {} }

  // Synchronous accessor used by render/edit handlers
  function builderGetSaved() { return builderSavedCache || (builderSavedCache = builderLocalGet()); }

  // Load the library: from Supabase if configured, else from localStorage. Updates cache + UI.
  async function builderLoadLibrary() {
    if (builderHasCloud()) {
      try {
        const res = await fetch(builderCloudUrl('schemas?select=*&order=ts.desc'), { headers: builderCloudHeaders() });
        if (res.ok) {
          const rows = await res.json();
          builderSavedCache = rows.map(r => ({ id: r.id, name: r.name, tree: r.tree, ts: r.ts }));
          builderLocalSet(builderSavedCache); // keep an offline mirror
          builderRenderSavedList();
          return;
        }
      } catch (e) { /* fall through to local */ }
      showToast('Không kết nối được Supabase — đang dùng bản local', 'warn');
    }
    builderSavedCache = builderLocalGet();
    builderRenderSavedList();
  }

  async function builderSaveCurrent() {
    const name = prompt('Tên schema muốn lưu:', 'Schema ' + (builderGetSaved().length + 1));
    if (!name) return;
    const item = { name: name, tree: JSON.parse(JSON.stringify(builderTree)), ts: Date.now() };
    if (builderHasCloud()) {
      try {
        const res = await fetch(builderCloudUrl('schemas'), {
          method: 'POST', headers: builderCloudHeaders({ 'Prefer': 'return=representation' }),
          body: JSON.stringify({ name: item.name, tree: item.tree, ts: item.ts })
        });
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json(); if (rows[0]) item.id = rows[0].id;
      } catch (e) { showToast('Lưu lên Supabase lỗi — lưu local: ' + (e.message || ''), 'warn'); }
    }
    const arr = builderGetSaved(); arr.unshift(item);
    builderSavedCache = arr; builderLocalSet(arr);
    builderRenderSavedList();
    showToast('Đã lưu “' + name + '”');
  }
  function builderRenderSavedList() {
    const arr = builderGetSaved();
    const cnt = document.getElementById('builderSavedCount');
    if (cnt) cnt.textContent = arr.length;
    const badge = document.getElementById('builderCloudBadge');
    if (badge) badge.innerHTML = builderHasCloud()
      ? '<span style="color:var(--success);">🌐 Chia sẻ (Supabase)</span>'
      : '<span style="color:var(--text-muted);" title="Chưa cấu hình Supabase — lưu trên máy bạn">💾 Local</span>';
    const host = document.getElementById('builderSavedList');
    if (!host) return;
    if (!arr.length) { host.innerHTML = '<div class="sdui-pv-empty" style="padding:10px;">Chưa lưu schema nào</div>'; return; }
    host.innerHTML = arr.map((s, i) =>
      '<div class="builder-saved-item">' +
        '<span class="builder-saved-name" title="' + bAttr(s.name) + '">' + bAttr(s.name) + '</span>' +
        '<button class="btn btn-ghost" style="font-size:10px;padding:4px 10px;" onclick="builderLoadSaved(' + i + ')">Load</button>' +
        '<button class="btn btn-ghost" style="font-size:10px;padding:4px 10px;" onclick="builderEditSaved(' + i + ')" title="Sửa tên & JSON">Edit</button>' +
        '<button class="builder-mini danger" onclick="builderDeleteSaved(' + i + ')">✕</button>' +
      '</div>' +
      '<div id="builderEditBox_' + i + '" class="builder-edit-box" style="display:none;"></div>'
    ).join('');
  }
  function builderLoadSaved(i) {
    const arr = builderGetSaved(), s = arr[i]; if (!s) return;
    builderTree = JSON.parse(JSON.stringify(s.tree));
    builderSyncUid(builderTree);
    builderRenderTree(); builderRefresh();
    showToast('Đã load “' + s.name + '”');
  }
  // Inline editor: edit name + the schema JSON of an existing saved item, then save back in place.
  function builderEditSaved(i) {
    const arr = builderGetSaved(), s = arr[i]; if (!s) return;
    const box = document.getElementById('builderEditBox_' + i);
    if (!box) return;
    if (box.style.display === 'block') { box.style.display = 'none'; box.innerHTML = ''; return; }
    document.querySelectorAll('.builder-edit-box').forEach(b => { b.style.display = 'none'; b.innerHTML = ''; });
    let schemaJson = '{}';
    try { schemaJson = JSON.stringify({ type: 'template_widget', templateType: 'SDUI_WIDGET', data: [builderToSchema(s.tree)] }, null, 2); }
    catch (e) {}
    box.innerHTML =
      '<input class="sdui-input" id="builderEditName_' + i + '" value="' + bAttr(s.name) + '" placeholder="Tên schema" style="margin:6px 0;width:100%;">' +
      '<textarea class="sdui-textarea" id="builderEditJson_' + i + '" spellcheck="false" style="min-height:150px;font-family:var(--mono);font-size:11px;">' + bAttr(schemaJson) + '</textarea>' +
      '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">' +
        '<button class="btn btn-primary" style="font-size:11px;padding:5px 12px;" onclick="builderSaveEdit(' + i + ')">💾 Lưu thay đổi</button>' +
        '<button class="btn btn-ghost" style="font-size:11px;padding:5px 12px;" onclick="builderEditSaved(' + i + ')">Huỷ</button>' +
      '</div>';
    box.style.display = 'block';
  }
  async function builderSaveEdit(i) {
    const arr = builderGetSaved(), s = arr[i]; if (!s) return;
    const nameEl = document.getElementById('builderEditName_' + i);
    const jsonEl = document.getElementById('builderEditJson_' + i);
    const name = nameEl ? nameEl.value.trim() : s.name;
    if (!name) return showToast('Tên không được trống', 'warn');
    let parsed;
    try { parsed = JSON.parse(jsonEl.value); } catch (e) { return showToast('JSON không hợp lệ', 'warn'); }
    const tree = builderParseSchemaToTree(parsed);
    if (!tree) return showToast('Không phải widget node tree hợp lệ', 'warn');
    const updated = { id: s.id, name: name, tree: JSON.parse(JSON.stringify(tree)), ts: Date.now() };
    if (builderHasCloud() && s.id != null) {
      try {
        const res = await fetch(builderCloudUrl('schemas?id=eq.' + encodeURIComponent(s.id)), {
          method: 'PATCH', headers: builderCloudHeaders(),
          body: JSON.stringify({ name: updated.name, tree: updated.tree, ts: updated.ts })
        });
        if (!res.ok) throw new Error(await res.text());
      } catch (e) { showToast('Cập nhật Supabase lỗi — lưu local: ' + (e.message || ''), 'warn'); }
    }
    arr[i] = updated; builderSavedCache = arr; builderLocalSet(arr);
    builderRenderSavedList();
    showToast('Đã cập nhật “' + name + '”');
  }
  async function builderDeleteSaved(i) {
    const arr = builderGetSaved(); const s = arr[i]; if (!s) return;
    if (!confirm('Xoá “' + s.name + '”?' + (builderHasCloud() ? ' (xoá khỏi DB chung)' : ''))) return;
    if (builderHasCloud() && s.id != null) {
      try {
        const res = await fetch(builderCloudUrl('schemas?id=eq.' + encodeURIComponent(s.id)), { method: 'DELETE', headers: builderCloudHeaders() });
        if (!res.ok) throw new Error(await res.text());
      } catch (e) { showToast('Xoá trên Supabase lỗi — xoá local: ' + (e.message || ''), 'warn'); }
    }
    arr.splice(i, 1); builderSavedCache = arr; builderLocalSet(arr);
    builderRenderSavedList();
    showToast('Đã xoá “' + s.name + '”');
  }
  // Export the whole library to a JSON file (backup / seed for Supabase or another env).
  function builderExportShared() {
    const arr = builderGetSaved();
    if (!arr.length) return showToast('Chưa có schema nào để export', 'warn');
    const out = { schemas: arr.map(s => ({ name: s.name, tree: s.tree, ts: s.ts || Date.now() })) };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'schemas.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('Đã export schemas.json');
  }

  function builderSubmit() { builderRefresh(); showToast('Đã tạo schema cuối'); }
  function builderCopy() {
    let json;
    try { json = JSON.stringify(builderCurrentSchema(), null, 2); }
    catch (e) { showToast('Không tạo được schema: ' + e.message, 'warn'); return; }
    csCopyText(json, 'Schema copied');
  }
  function builderDownload() {
    const blob = new Blob([JSON.stringify(builderCurrentSchema(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sdui-builder-' + Date.now() + '.json'; a.click();
    URL.revokeObjectURL(url);
  }
  function builderReset() { builderTree = builderSeed(); builderRenderTree(); builderRefresh(); showToast('Builder reset'); }
  function builderInit() {
    if (!builderTree) {
      try { const s = localStorage.getItem('cs_builder_tree'); if (s) builderTree = JSON.parse(s); } catch (e) {}
      if (!builderTree) builderTree = builderSeed();
      builderSyncUid(builderTree);
    }
    builderRenderTree();
    builderLoadLibrary();
    builderRefresh();
    const pv = document.getElementById('builderPreview');
    if (pv && !pv._clickBound) { pv.addEventListener('click', builderPreviewClick); pv._clickBound = true; }
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
    csCopyText(JSON.stringify(buildConfig(), null, 2), 'JSON copied to clipboard');
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

    // Nếu đang xem Preview, refresh theo output mới
    const pv = document.getElementById('sduiOutPreview');
    if (pv && pv.style.display !== 'none') sduiRenderPreview(sduiState.currentOutput, pv);
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

      // Validate manifest.json is actually JSON, not HTML error
      const manifestCt = manifestRes.headers.get('content-type') || '';
      if (!manifestCt.includes('application/json') && !manifestCt.includes('text/plain')) {
        throw new Error('manifest.json served with wrong content-type: ' + manifestCt + '. Expected application/json');
      }

      const manifestRaw = await manifestRes.text();
      let uiHtml = await uiRes.text();
      const codeJs = await codeRes.blob();

      // 1. Modify Manifest
      let manifest;
      try {
        manifest = JSON.parse(manifestRaw);
      } catch (e) {
        throw new Error('manifest.json format invalid (expected JSON). Received: ' + manifestRaw.substring(0, 100) + '...');
      }
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
