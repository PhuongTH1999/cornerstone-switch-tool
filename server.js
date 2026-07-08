// Dev server: phục vụ web tĩnh + endpoint sync changelog từ GitLab nội bộ.
// Chạy: npm run dev   (cần Node 18+, máy đang trên VPN, và file .gitlab-token)
//
// Endpoint: POST /api/sync-changelog  → kéo CHANGELOG.md từ GitLab API, ghi docs/changelog.md.
// Token đọc theo thứ tự: env GITLAB_TOKEN  →  file .gitlab-token (cùng thư mục).
//
// Cấu hình (override bằng env nếu cần):
//   GITLAB_HOST, GITLAB_PROJECT, GITLAB_REF, GITLAB_FILE
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 8085;

const GITLAB = {
  host:    process.env.GITLAB_HOST    || 'https://gitlab.mservice.com.vn',
  project: process.env.GITLAB_PROJECT || 'momo-platform/mini-app',
  ref:        process.env.GITLAB_REF        || 'vn.momo.cornerstonesdk/master',
  file:       process.env.GITLAB_FILE       || 'packages/CHANGELOG.md',
  out:        process.env.GITLAB_OUT        || 'docs/changelog-dev.md',  // bản raw đầy đủ (cho dev)
  highlights: process.env.GITLAB_HIGHLIGHTS || 'docs/changelog.md',      // bản tóm nổi bật (tự sinh)
};

// Lọc changelog raw → bản Highlights: giữ Features/Fixes/Perf, bỏ Chores + dòng meta,
// làm sạch message (viết hoa, chuẩn hoá acronym, bỏ prefix conventional), gỡ trùng, format ngày.
const ACRONYMS = {
  ios: 'iOS', android: 'Android', json: 'JSON', api: 'API', ui: 'UI', ux: 'UX',
  css: 'CSS', html: 'HTML', eslint: 'ESLint', sdk: 'SDK', sdui: 'SDUI', rn: 'RN',
  url: 'URL', npm: 'npm', cdn: 'CDN', ci: 'CI', cd: 'CD',
};
function fmtDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  return m ? m[3] + '/' + m[2] + '/' + m[1] : (s || '');
}
function cleanMsg(s) {
  let t = s.replace(/\s*\(`[^`]+`\)\s*$/, '')                                            // bỏ commit hash
           .replace(/^(feat|feature|fix|bugfix|chore|refactor|perf|docs|style|test)(\([^)]*\))?:\s*/i, '') // bỏ prefix conventional
           .replace(/[.\s]+$/, '').trim();                                                // bỏ chấm/space cuối
  t = t.replace(/[A-Za-z]+/g, w => ACRONYMS[w.toLowerCase()] || w);                        // chuẩn hoá acronym
  const first = t.split(/\s/)[0];
  if (t && /^[a-z]/.test(t) && !Object.values(ACRONYMS).includes(first)) t = t[0].toUpperCase() + t.slice(1); // viết hoa câu
  return t;
}
function toHighlights(raw) {
  const versions = [];
  let cur = null, section = null;
  raw.split('\n').forEach(l0 => {
    const line = l0.replace(/\s+$/, '');
    let m;
    if ((m = line.match(/^##\s+(.+)/))) {
      const parts = m[1].trim().split(/\s+[-–—]\s+/);
      cur = { ver: parts[0].trim(), date: (parts[1] || '').trim(), items: [], seen: new Set() };
      versions.push(cur); section = null;
    } else if ((m = line.match(/^###\s+(.+)/))) {
      const t = m[1].toLowerCase();
      section = t.includes('feature') ? 'feature'
        : (t.includes('fix') || t.includes('bug')) ? 'fix'
        : t.includes('perf') ? 'perf' : 'skip';
    } else if (cur && section && section !== 'skip' && (m = line.match(/^[-*]\s+(.+)/))) {
      const text = cleanMsg(m[1]);
      const key = section + '|' + text.toLowerCase();
      if (text && !cur.seen.has(key)) { cur.seen.add(key); cur.items.push({ section, text }); }
    }
  });
  const out = ['# Changelog — Highlights', '',
    '> Tự sinh từ changelog GitLab khi bấm **🔄 Sync**. Bản đầy đủ (mọi commit) ở tab **Dev (GitLab)**.'];
  const EMO = { feature: '✨', fix: '🐛', perf: '⚡' };
  versions.forEach((v, idx) => {
    const date = fmtDate(v.date);
    out.push('', '## ' + v.ver + (date ? ' — ' + date : '') + (idx === 0 ? ' · 🆕 mới nhất' : ''));
    if (!v.items.length) { out.push('🧹 Bảo trì nội bộ, không có thay đổi tính năng.'); return; }
    v.items.forEach(it => out.push('- ' + (EMO[it.section] || '•') + ' ' + it.text));
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
};

function readToken() {
  if (process.env.GITLAB_TOKEN) return process.env.GITLAB_TOKEN.trim();
  try { return fs.readFileSync(path.join(ROOT, '.gitlab-token'), 'utf8').trim(); } catch (e) { return null; }
}

async function syncChangelog() {
  const token = readToken();
  if (!token) throw new Error('Thiếu token. Tạo file .gitlab-token (hoặc set env GITLAB_TOKEN).');
  const api = GITLAB.host.replace(/\/+$/, '') +
    '/api/v4/projects/' + encodeURIComponent(GITLAB.project) +
    '/repository/files/' + encodeURIComponent(GITLAB.file) +
    '/raw?ref=' + encodeURIComponent(GITLAB.ref);
  const res = await fetch(api, { headers: { 'PRIVATE-TOKEN': token } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('GitLab API ' + res.status + ' ' + res.statusText + (body ? ' — ' + body.slice(0, 200) : ''));
  }
  const md = await res.text();
  fs.writeFileSync(path.join(ROOT, GITLAB.out), md, 'utf8');               // bản raw (Dev)
  fs.writeFileSync(path.join(ROOT, GITLAB.highlights), toHighlights(md), 'utf8'); // bản Highlights
  return { bytes: Buffer.byteLength(md), out: GITLAB.out, highlights: GITLAB.highlights };
}

const server = http.createServer(async (req, res) => {
  // --- API: sync changelog ---
  if (req.method === 'POST' && req.url.split('?')[0] === '/api/sync-changelog') {
    try {
      const info = await syncChangelog();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, ...info }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // --- static files ---
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('▶ Dev server: http://localhost:' + PORT);
  console.log('  Sync changelog: POST /api/sync-changelog  (GitLab: ' + GITLAB.project + ' @ ' + GITLAB.ref + ')');
  console.log('  Token: ' + (readToken() ? 'đã có' : 'CHƯA có — tạo .gitlab-token'));
});
