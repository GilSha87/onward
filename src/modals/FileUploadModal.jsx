import React, { useState } from 'react';
import { ICONS } from '../lib/data';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';
import { uploadFile, FILE_TYPES, MAX_FILE_BYTES, fmtBytes } from '../lib/files';

export default function FileUploadModal({ client, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState('Other');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const tooBig = file && file.size > MAX_FILE_BYTES;

  function pick(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setError('');
    if (f && !title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }

  async function save() {
    if (!file || tooBig || busy) return;
    setBusy(true);
    setError('');
    try {
      const created = await uploadFile({ clientId: client.id, file, title, fileType });
      onUploaded?.(created);
      onClose();
    } catch (err) {
      setError(err?.message || 'Upload failed. Please try again.');
      setBusy(false);
    }
  }

  return (
    <Modal size="md" onClose={onClose}>
      <ModalHead title="Upload file" eyebrow={client.name} onClose={onClose} />
      <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>File *</label>
          <input
            type="file"
            className="input"
            onChange={pick}
            accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg"
          />
          {file && (
            <div className="muted text-xs" style={{ marginTop: 6 }}>
              {file.name} · {fmtBytes(file.size)}
            </div>
          )}
          {tooBig && (
            <div className="text-xs" style={{ marginTop: 6, color: 'var(--bad, #c0392b)' }}>
              File exceeds the 25 MB limit.
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div className="field">
            <label>Title</label>
            <input className="input" placeholder="Display name" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Type</label>
            <select className="input" value={fileType} onChange={e => setFileType(e.target.value)}>
              {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {error && (
          <div className="text-xs" style={{ color: 'var(--bad, #c0392b)' }}>{error}</div>
        )}
      </div>
      <div className="modal-foot">
        <span className="muted text-xs">Max 25 MB · PDF, Office docs, images.</span>
        <div className="flex gap-2">
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={!file || tooBig || busy}>
            {busy ? 'Uploading…' : <>{ICONS.plus} Upload</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}
