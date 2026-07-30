// Minimal, dependency-free "markdown-lite" -> safe HTML converter.
// Security model: escape everything first, then only ever insert a small
// whitelist of tags via string replacement on the already-escaped text.
// Raw HTML typed by an editor never passes through unescaped, so there is
// no HTML/script injection surface — this is the sanitization boundary.

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineFormat(escaped) {
  let out = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return out;
}

export function markdownLiteToHtml(raw) {
  if (!raw) return '';
  const lines = raw.split(/\r?\n/);
  let html = '';
  let listBuffer = [];
  let paraBuffer = [];

  function flushList() {
    if (listBuffer.length) {
      html += '<ul>' + listBuffer.map((l) => '<li>' + inlineFormat(escapeHtml(l)) + '</li>').join('') + '</ul>';
      listBuffer = [];
    }
  }
  function flushPara() {
    if (paraBuffer.length) {
      html += '<p>' + paraBuffer.map((l) => inlineFormat(escapeHtml(l))).join('<br>') + '</p>';
      paraBuffer = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      flushPara();
      listBuffer.push(trimmed.slice(2));
    } else if (trimmed === '') {
      flushList();
      flushPara();
    } else {
      flushList();
      paraBuffer.push(trimmed);
    }
  }
  flushList();
  flushPara();
  return html;
}
