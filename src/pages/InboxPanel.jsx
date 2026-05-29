import React, { useState } from 'react';
import { QUESTIONS } from '../lib/data';

export default function InboxPanel({ onStep }) {
  const [sub, setSub] = useState('questions');
  return (
    <div className="rail">
      <div>
        <div className="seg" style={{ marginBottom: 20 }}>
          <button className={sub === 'questions' ? 'on' : ''} onClick={() => setSub('questions')}>Questions · {QUESTIONS.length}</button>
          <button className={sub === 'notes' ? 'on' : ''} onClick={() => setSub('notes')}>Internal notes</button>
        </div>
        {sub === 'questions' && QUESTIONS.map(q => (
          <div key={q.id} className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
              <span className="tag" style={{ background: q.status === 'Open' ? 'var(--duda-soft)' : undefined, color: q.status === 'Open' ? 'var(--duda-deep)' : undefined, borderColor: 'transparent' }}>{q.status}</span>
              <span className="muted text-sm">on <b style={{ color: 'var(--ink)' }}>{q.step}</b></span>
              <span className="muted text-xs num" style={{ marginLeft: 'auto' }}>{q.when}</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="avatar" style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--hairline)', width: 28, height: 28 }}>{q.from.split(' ').map(n => n[0]).join('')}</span>
              <div style={{ flex: 1 }}>
                <div className="text-sm semibold">{q.from}</div>
                <p style={{ marginTop: 6, fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)' }}>"{q.text}"</p>
                {q.status === 'Open' && (
                  <div className="flex gap-2" style={{ marginTop: 14 }}>
                    <button className="btn primary sm">Respond</button>
                    <button className="btn sm">Mark resolved</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {sub === 'notes' && (
          <div className="card card-pad">
            <div className="eyebrow">AM internal</div>
            <textarea className="input" style={{ marginTop: 12, minHeight: 280, fontSize: 14 }} defaultValue="Adrian wants to push the launch window into early Q3."></textarea>
          </div>
        )}
      </div>
      <aside>
        <div className="rail-card">
          <h4>How this works</h4>
          <p className="text-sm muted" style={{ lineHeight: 1.55 }}>Client questions flow in from any step. Notes here are internal.</p>
        </div>
      </aside>
    </div>
  );
}
