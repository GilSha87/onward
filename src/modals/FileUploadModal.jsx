import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../lib/data';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';
import { uploadFile, FILE_TYPES, MAX_FILE_BYTES, fmtBytes, isAllowedFile, ACCEPT_ATTR } from '../lib/files';

export default function FileUploadModal({ client, onClose, onUploaded }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState('Other');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const tooBig = file && file.size > MAX_FILE_BYTES;
  const badType = file && !isAllowedFile(file);
  const canUpload = !!file && !tooBig && !badType && !busy;

  function pick(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    // Surface a specific, immediate error for an unsupported type on pick.
    setError(f && !isAllowedFile(f) ? t('modals.fileUpload.bad_type', { defaultValue: 'Unsupported file type. Use PDF, Office documents, or images.' }) : '');
    if (f && !title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }

  async function save() {
    if (!file) {
      setError(t('modals.fileUpload.no_file', { defaultValue: 'Choose a file to upload.' }));
      return;
    }
    if (!canUpload) return;
    setBusy(true);
    setError('');
    try {
      const created = await uploadFile({ clientId: client.id, file, title, fileType });
      onUploaded?.(created);
      onClose();
    } catch (err) {
      setError(err?.message || t('modals.fileUpload.err_failed'));
      setBusy(false);
    }
  }

  return (
    <Modal size="md" onClose={onClose}>
      <ModalHead title={t('modals.fileUpload.title')} eyebrow={client.name} onClose={onClose} />
      <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>{t('modals.fileUpload.file_label')}</label>
          <input
            type="file"
            className="input"
            onChange={pick}
            accept={ACCEPT_ATTR}
          />
          {file && (
            <div className="muted text-xs" style={{ marginTop: 6 }}>
              {file.name} · {fmtBytes(file.size)}
            </div>
          )}
          {tooBig && (
            <div className="text-xs" style={{ marginTop: 6, color: 'var(--bad, #c0392b)' }}>
              {t('modals.fileUpload.too_big')}
            </div>
          )}
          {badType && !tooBig && (
            <div className="text-xs" style={{ marginTop: 6, color: 'var(--bad, #c0392b)' }}>
              {t('modals.fileUpload.bad_type', { defaultValue: 'Unsupported file type. Use PDF, Office documents, or images.' })}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div className="field">
            <label>{t('modals.fileUpload.title_label')}</label>
            <input className="input" placeholder={t('modals.fileUpload.title_ph')} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('modals.fileUpload.type_label')}</label>
            <select className="input" value={fileType} onChange={e => setFileType(e.target.value)}>
              {FILE_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
            </select>
          </div>
        </div>
        {error && (
          <div className="text-xs" style={{ color: 'var(--bad, #c0392b)' }}>{error}</div>
        )}
      </div>
      <div className="modal-foot">
        <span className="muted text-xs">{t('modals.fileUpload.foot')}</span>
        <div className="flex gap-2">
          <button className="btn" onClick={onClose} disabled={busy}>{t('common.cancel')}</button>
          <button className="btn primary" onClick={save} disabled={!canUpload}>
            {busy ? t('modals.fileUpload.uploading') : <>{ICONS.plus} {t('modals.fileUpload.upload')}</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}
