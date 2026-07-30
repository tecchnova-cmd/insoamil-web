import { useRef, useState } from 'react';
import { markdownLiteToHtml } from '../lib/richtext';
import './rich-text-field.css';

export default function RichTextField({ label, value, onChange }) {
  const textareaRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);

  function wrapSelection(before, after = before) {
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || 'texto';
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function bulletize() {
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end) || 'elemento';
    const after = value.slice(end);
    const bulleted = selected
      .split('\n')
      .map((l) => (l.trim().startsWith('- ') ? l : '- ' + l))
      .join('\n');
    onChange(before + bulleted + after);
  }

  function insertLink() {
    const url = window.prompt('URL del enlace (debe empezar con http:// o https://):', 'https://');
    if (!url || !/^https?:\/\//.test(url)) return;
    wrapSelection('[', '](' + url + ')');
  }

  return (
    <div className="rtf-wrap">
      {label && <label>{label}</label>}
      <div className="rtf-toolbar">
        <button type="button" onClick={() => wrapSelection('**')} title="Negrita">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => wrapSelection('*')} title="Cursiva">
          <em>I</em>
        </button>
        <button type="button" onClick={bulletize} title="Viñetas">
          ☰
        </button>
        <button type="button" onClick={insertLink} title="Enlace">
          🔗
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" className="rtf-preview-toggle" onClick={() => setShowPreview((v) => !v)}>
          {showPreview ? 'Ocultar vista previa' : 'Vista previa'}
        </button>
      </div>
      <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} rows={5} />
      <p className="rtf-hint">Formato: **negrita**, *cursiva*, líneas con "- " para viñetas, [texto](https://...) para enlaces.</p>
      {showPreview && <div className="rtf-preview" dangerouslySetInnerHTML={{ __html: markdownLiteToHtml(value) }} />}
    </div>
  );
}
