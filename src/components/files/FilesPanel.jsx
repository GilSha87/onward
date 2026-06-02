import React, { useEffect, useState, useCallback } from 'react';
import { ICONS } from '../../lib/data';
import { fmtDate } from '../../lib/helpers';
import { listFiles, getSignedUrl, deleteFile, fmtBytes } from '../../lib/files';
import FileUploadModal from '../../modals/FileUploadModal';

export default function FilesPanel({ client }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const rows = await listFiles(client.id);
    setFiles(rows);
    setLoading(false);
  }, [client.id]);

  useEffect(() => { refresh(); }, [refresh]);

  async function download(f) {
    setBusyId(f.id);
    const url = await getSignedUrl(f.storagePath);
    setBusyId(null);
    if (url) window.open(url, '_blank', 'noopener');
  }

  async function remove(f) {
    if (!window.confirm(`Delete "${f.title}"?`)) return;
    setBusyId(f.id);
    const ok = await deleteFile(f);
    setBusyId(null);
    if (ok) setFiles(prev => prev.filter(x => x.id !== f.id));
  }

  if (loading) {
    return <div className="empty"><p className="muted">Loading files…</p></div>;
  }

  if (!files.length) {
    return (
      <>
        <div className="empty">
          <div className="empty-icon">{ICONS.cal}</div>
          <h3>No files yet</h3>
          <p>Logos, brand assets, contracts will appear here.</p>
          <div className="empty-actions">
            <button className="btn primary" onClick={() => setShowUpload(true)}>{ICONS.plus} Upload file</button>
          </div>
        </div>
        {showUpload && (
          <FileUploadModal
            client={client}
            onClose={() => setShowUpload(false)}
            onUploaded={f => setFiles(prev => [f, ...prev])}
          />
        )}
      </>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 className="h2">Files <span className="count">{files.length}</span></h2>
        <button className="btn primary sm" onClick={() => setShowUpload(true)}>{ICONS.plus} Upload file</button>
      </div>
      <div className="flex flex-col gap-2">
        {files.map(f => (
          <div key={f.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="avatar" style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--hairline)' }}>{ICONS.cal}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-sm semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
              <div className="muted text-xs" style={{ marginTop: 2 }}>
                {f.fileType} · {fmtBytes(f.fileSize)} · {fmtDate(f.createdAt)}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn sm" onClick={() => download(f)} disabled={busyId === f.id}>{ICONS.link} Open</button>
              <button className="btn sm" onClick={() => remove(f)} disabled={busyId === f.id}>{ICONS.close}</button>
            </div>
          </div>
        ))}
      </div>
      {showUpload && (
        <FileUploadModal
          client={client}
          onClose={() => setShowUpload(false)}
          onUploaded={f => setFiles(prev => [f, ...prev])}
        />
      )}
    </div>
  );
}
