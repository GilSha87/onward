import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QUESTIONS } from '../lib/data';

export default function InboxPanel({ onStep }) {
  const { t } = useTranslation();
  const [sub, setSub] = useState('questions');
  const [questions, setQuestions] = useState(() => QUESTIONS.map(q => ({ ...q, replies: q.replies || [] })));
  const [respondingTo, setRespondingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const openCount = questions.filter(q => q.status === 'Open').length;

  function startReply(id) {
    setRespondingTo(id);
    setReplyText('');
  }

  function cancelReply() {
    setRespondingTo(null);
    setReplyText('');
  }

  function submitReply(id) {
    const text = replyText.trim();
    if (!text) return;
    setQuestions(prev =>
      prev.map(q =>
        q.id === id
          ? { ...q, status: 'Resolved', replies: [...(q.replies || []), { from: t('inbox.you'), text, when: t('inbox.just_now') }] }
          : q
      )
    );
    setRespondingTo(null);
    setReplyText('');
  }

  function markResolved(id) {
    setQuestions(prev => prev.map(q => (q.id === id ? { ...q, status: 'Resolved' } : q)));
    if (respondingTo === id) cancelReply();
  }

  return (
    <div className="rail">
      <div>
        <div className="seg" style={{ marginBottom: 20 }}>
          <button className={sub === 'questions' ? 'on' : ''} onClick={() => setSub('questions')}>{t('inbox.questions_tab', { count: openCount })}</button>
          <button className={sub === 'notes' ? 'on' : ''} onClick={() => setSub('notes')}>{t('inbox.notes_tab')}</button>
        </div>
        {sub === 'questions' && (
          <div className="eyebrow" style={{ fontSize: 10, opacity: 0.5, marginBottom: 12 }}>{t('inbox.sample_note')}</div>
        )}
        {sub === 'questions' && questions.map(q => (
          <div key={q.id} className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
              <span className="tag" style={{ background: q.status === 'Open' ? 'var(--duda-soft)' : undefined, color: q.status === 'Open' ? 'var(--duda-deep)' : undefined, borderColor: 'transparent' }}>{q.status === 'Open' ? t('inbox.status_open') : t('inbox.status_resolved')}</span>
              <span className="muted text-sm">{t('inbox.on_step')} <b style={{ color: 'var(--ink)' }}>{q.step}</b></span>
              <span className="muted text-xs num" style={{ marginLeft: 'auto' }}>{q.when}</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="avatar" style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--hairline)', width: 28, height: 28 }}>{q.from.split(' ').map(n => n[0]).join('')}</span>
              <div style={{ flex: 1 }}>
                <div className="text-sm semibold">{q.from}</div>
                <p style={{ marginTop: 6, fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)' }}>"{q.text}"</p>
                {q.replies && q.replies.length > 0 && (
                  <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid var(--hairline)' }}>
                    {q.replies.map((r, ri) => (
                      <div key={ri} style={{ marginTop: ri === 0 ? 0 : 10 }}>
                        <div className="text-xs semibold">{r.from} <span className="muted num" style={{ fontWeight: 400 }}>· {r.when}</span></div>
                        <p style={{ marginTop: 3, fontSize: 14, lineHeight: 1.45, color: 'var(--ink-2)' }}>{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                {respondingTo === q.id && (
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      className="input"
                      autoFocus
                      placeholder={t('inbox.reply_ph')}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      style={{ minHeight: 80, fontSize: 14, width: '100%' }}
                    />
                    <div className="flex gap-2" style={{ marginTop: 10 }}>
                      <button className="btn primary sm" onClick={() => submitReply(q.id)} disabled={!replyText.trim()}>{t('inbox.send_reply')}</button>
                      <button className="btn sm" onClick={cancelReply}>{t('common.cancel')}</button>
                    </div>
                  </div>
                )}
                {q.status === 'Open' && respondingTo !== q.id && (
                  <div className="flex gap-2" style={{ marginTop: 14 }}>
                    <button className="btn primary sm" onClick={() => startReply(q.id)}>{t('inbox.respond')}</button>
                    <button className="btn sm" onClick={() => markResolved(q.id)}>{t('inbox.mark_resolved')}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {sub === 'notes' && (
          <div className="card card-pad">
            <div className="eyebrow">{t('inbox.am_internal')}</div>
            <textarea className="input" style={{ marginTop: 12, minHeight: 280, fontSize: 14 }} defaultValue="Adrian wants to push the launch window into early Q3."></textarea>
          </div>
        )}
      </div>
      <aside>
        <div className="rail-card">
          <h4>{t('inbox.how_it_works')}</h4>
          <p className="text-sm muted" style={{ lineHeight: 1.55 }}>{t('inbox.how_it_works_body')}</p>
        </div>
      </aside>
    </div>
  );
}
