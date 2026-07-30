import { useRef, useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { compressImage } from '../lib/imageCompress';

const MAX_IMAGES = 5;
const MAX_FILES = 3;
const MAX_IMAGE_MB = 5;
const MAX_FILE_MB = 10;
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DOC_TYPES = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
};

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function ServiceImagesField({ serviceId, images, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const replaceIndexRef = useRef(null);

  async function handleFiles(fileList, replaceIndex = null) {
    const file = fileList[0];
    if (!file) return;
    setError('');
    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Formato no permitido. Usa JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`La imagen supera los ${MAX_IMAGE_MB}MB.`);
      return;
    }
    if (replaceIndex === null && images.length >= MAX_IMAGES) {
      setError(`Máximo ${MAX_IMAGES} imágenes por servicio.`);
      return;
    }

    setBusy(true);
    try {
      const compressed = await compressImage(file);
      const path = `services/${serviceId}/images/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(storageRef);

      if (replaceIndex !== null) {
        const old = images[replaceIndex];
        const next = images.slice();
        next[replaceIndex] = { ...old, url, path };
        onChange(next);
        if (old?.path) {
          deleteObject(ref(storage, old.path)).catch(() => {});
        }
      } else {
        const next = [...images, { url, path, alt: '', order: images.length, isPrimary: images.length === 0 }];
        onChange(next);
      }
    } catch (e) {
      setError('No se pudo subir la imagen: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  function updateAlt(idx, alt) {
    const next = images.slice();
    next[idx] = { ...next[idx], alt };
    onChange(next);
  }

  function setPrimary(idx) {
    onChange(images.map((img, i) => ({ ...img, isPrimary: i === idx })));
  }

  function move(idx, dir) {
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= images.length) return;
    const next = images.slice();
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onChange(next.map((img, i) => ({ ...img, order: i })));
  }

  function removeImage(idx) {
    const img = images[idx];
    onChange(images.filter((_, i) => i !== idx));
    if (img?.path) deleteObject(ref(storage, img.path)).catch(() => {});
  }

  return (
    <div className="media-field">
      <label>Imágenes ({images.length}/{MAX_IMAGES})</label>
      <div className="media-grid">
        {images.map((img, idx) => (
          <div className="media-thumb" key={img.path || idx}>
            <img src={img.url} alt={img.alt || ''} />
            {img.isPrimary && <span className="media-primary-tag">Principal</span>}
            <input
              type="text"
              className="media-alt-input"
              placeholder="Texto alternativo (alt)"
              value={img.alt || ''}
              onChange={(e) => updateAlt(idx, e.target.value)}
            />
            <div className="media-thumb-actions">
              <button type="button" className="icon-btn" disabled={idx === 0} onClick={() => move(idx, 'up')} title="Mover antes">
                ↑
              </button>
              <button type="button" className="icon-btn" disabled={idx === images.length - 1} onClick={() => move(idx, 'down')} title="Mover después">
                ↓
              </button>
              {!img.isPrimary && (
                <button type="button" className="icon-btn" onClick={() => setPrimary(idx)} title="Marcar como principal">
                  ⭐
                </button>
              )}
              <button
                type="button"
                className="icon-btn"
                title="Reemplazar"
                onClick={() => {
                  replaceIndexRef.current = idx;
                  inputRef.current.click();
                }}
              >
                🔁
              </button>
              <button type="button" className="icon-btn" title="Eliminar" onClick={() => removeImage(idx)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            className="media-add-btn"
            disabled={busy}
            onClick={() => {
              replaceIndexRef.current = null;
              inputRef.current.click();
            }}
          >
            {busy ? 'Subiendo...' : '+ Agregar imagen'}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          handleFiles(e.target.files, replaceIndexRef.current);
          e.target.value = '';
        }}
      />
      {error && <div className="banner error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}

export function ServiceFilesField({ serviceId, files, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const replaceIndexRef = useRef(null);

  async function handleFiles(fileList, replaceIndex = null) {
    const file = fileList[0];
    if (!file) return;
    setError('');
    if (!DOC_TYPES[file.type]) {
      setError('Formato no permitido. Usa PDF, DOC, DOCX, XLS o XLSX.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`El archivo supera los ${MAX_FILE_MB}MB.`);
      return;
    }
    if (replaceIndex === null && files.length >= MAX_FILES) {
      setError(`Máximo ${MAX_FILES} archivos por servicio.`);
      return;
    }

    setBusy(true);
    try {
      const path = `services/${serviceId}/files/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      const meta = { url, path, name: file.name, type: DOC_TYPES[file.type], size: file.size, uploadedAt: Date.now() };

      if (replaceIndex !== null) {
        const old = files[replaceIndex];
        const next = files.slice();
        next[replaceIndex] = meta;
        onChange(next);
        if (old?.path) deleteObject(ref(storage, old.path)).catch(() => {});
      } else {
        onChange([...files, meta]);
      }
    } catch (e) {
      setError('No se pudo subir el archivo: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  function removeFile(idx) {
    const f = files[idx];
    onChange(files.filter((_, i) => i !== idx));
    if (f?.path) deleteObject(ref(storage, f.path)).catch(() => {});
  }

  return (
    <div className="media-field">
      <label>Archivos descargables ({files.length}/{MAX_FILES})</label>
      {files.map((f, idx) => (
        <div className="file-row" key={f.path || idx}>
          <span className="file-type-badge">{f.type}</span>
          <div className="file-info">
            <strong>{f.name}</strong>
            <span>{formatSize(f.size)}</span>
          </div>
          <a href={f.url} target="_blank" rel="noopener noreferrer" className="icon-btn" title="Ver / Descargar">
            👁️
          </a>
          <button
            type="button"
            className="icon-btn"
            title="Reemplazar"
            onClick={() => {
              replaceIndexRef.current = idx;
              inputRef.current.click();
            }}
          >
            🔁
          </button>
          <button type="button" className="icon-btn" title="Eliminar" onClick={() => removeFile(idx)}>
            🗑️
          </button>
        </div>
      ))}
      {files.length < MAX_FILES && (
        <button
          type="button"
          className="btn-sm"
          disabled={busy}
          onClick={() => {
            replaceIndexRef.current = null;
            inputRef.current.click();
          }}
        >
          {busy ? 'Subiendo...' : '+ Agregar archivo'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        style={{ display: 'none' }}
        onChange={(e) => {
          handleFiles(e.target.files, replaceIndexRef.current);
          e.target.value = '';
        }}
      />
      {error && <div className="banner error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
