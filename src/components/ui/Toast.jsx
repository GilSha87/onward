import React, { useState, useEffect, useCallback } from 'react';

let _addToast = null;

export function showToast(message, type = 'error') {
  if (_addToast) _addToast(message, type);
  else console.warn('[Toast]', message);
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  const colors = {
    error:   { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
    warning: { bg: '#FFF3E9', border: '#F3D6C2', text: '#8A3D1E' },
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' },
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360,
    }}>
      {toasts.map(t => {
        const c = colors[t.type] || colors.error;
        return (
          <div key={t.id} role="alert" style={{
            padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: c.bg, border: `1px solid ${c.border}`, color: c.text,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}>
            <span>{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{
                border: 'none', background: 'transparent', color: c.text,
                fontWeight: 700, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
