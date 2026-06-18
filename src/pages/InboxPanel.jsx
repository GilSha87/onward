import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/supabase';
import { reportApiError } from '../lib/monitoring';
import { showToast } from '../components/ui/Toast';

// Live client questions inbox. Questions/replies are owned by the parent
// (Tracker) so the Inbox tab badge and this panel's sub-counter derive from the
// same `questions` source. Respond appends a persisted reply; Mark resolved
// flips status to 'resolved'. Both are optimistic with revert on failure.
export default function InboxPanel({ onStep, questions = [], setQuestions, steps = [] }) {
  const { t, i18n } = useTranslation();
  const [sub, setSub] = useState('questions');
  const [respondingTo, setRespondingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const openCount = questions.filter(q => q.status === 'open').length;
  const stepTitle = id => steps.find(s => s.id === id)?.title;
  const fmtWhen = iso => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString(i18n.language || undefined, { month: 'short', day: 'numeric' }); }
    catch { return ''; }
  };

  function startReply(id) { setRespondingTo(id); setReplyText(''); }
  function cancelReply() { setRespondingTo(null); setReplyText(''); }

  // Respond: append a persisted reply (does not resolve — that's a separate action).
  async function submitReply(id) {
    const text = replyText.trim();
    if (!text) return;
    const q = questions.find(x => x.id === id);
    if (!q) return;
    const newReplies = [...(q.replies || []), { author: t('inbox.you'), body: text, at: new Date().toISOString() }];
    setQuestions(prev => prev.map(x => (x.id === id ? { ...x, replies: newReplies } : x)));
    setRespondingTo(null);
    setReplyText('');
    const { error } = await db.from('questions').update({ replies: newReplies }).eq('id', id);
    if (error) {
      reportApiError('questions.reply', error, { id });
      showToast(t('inbox.reply_failed', { defaultValue: 'Failed to send reply.' }), 'error');
      setQuestions(prev => prev.map(x => (x.id === id ? q : x))); // revert
    }
  }

  async function markResolved(id) {
    const q = questions.find(x => x.id === id);
    if (!q) return;
    setQuestions(prev => prev.map(x => (x.id === id ? { ...x, status: 'resolved' } : x)));
    if (respondingTo === id) cancelReply();
    const { error } = await db.from('questions').update({ status: 'resolved' }).eq('id', id);
    if (error) {
      reportApiError('questions.resolve', error, { id });
      showToast(t('inbox.resolve_failed', { defaultValue: 'Failed to resolve question.' }), 'error');
      setQuestions(prev => prev.map(x => (x.id === id ? q : x))); // revert
    }
  }

  return (
    <div className="rail">
      <div>
        <div className="seg" style={{ marginBottom: 20 }}>
          <button className={sub === 'questions' ? 'on' : ''} onClick={() => setSub('questions')}>{t('inbox.questions_tab', { count: openCount })}</button>
          <button className={sub === 'notes' ? 'on' : ''} onClick={() => setSub('notes')}>{t('inbox.notes_tab')}</button>
        </div>
        {sub === 'questions' && questions.length === 0 && (
          <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>
            {t('inbox.empty', { defaultValue: 'No questions yet.' })}
          </div>
        )}
        {sub === 'questions' && questions.map(q => {
          const isOpen = q.status === 'open';
          const onStepTitle = stepTitle(q.step_id);
          return (
          <div key={q.id} className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
              <span className="tag" style={{ background: isOpen ? 'var(--duda-soft)' : undefined, color: isOpen ? 'var(--duda-deep)' : undefined, borderColor: 'transparent' }}>{isOpen ? t('inbox.status_open') : t('inbox.status_resolved')}</span>
              {onStepTitle && <span className="muted text-sm">{t('inbox.on_step')} <b style={{ color: 'var(--ink)' }}>{onStepTitle}</b></span>}
              <span className="muted text-xs num" style={{ marginLeft: 'auto' }}>{fmtWhen(q.created_at)}</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="avatar" style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--hairline)', width: 28, height: 28 }}>{(q.author || '').split(' ').map(n => n[0]).join('')}</span>
              <div style={{ flex: 1 }}>
                <div className="text-sm semibold">{q.author}</div>
                <p style={{ marginTop: 6, fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)' }}>"{q.body}"</p>
                {q.replies && q.replies.length > 0 && (
                  <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid var(--hairline)' }}>
                    {q.replies.map((r, ri) => (
                      <div key={ri} style={{ marginTop: ri === 0 ? 0 : 10 }}>
                        <div className="text-xs semibold">{r.author} <span className="muted num" style={{ fontWeight: 400 }}>· {fmtWhen(r.at)}</span></div>
                        <p style={{ marginTop: 3, fontSize: 14, lineHeight: 1.45, color: 'var(--ink-2)' }}>{r.body}</p>
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
                {isOpen && respondingTo !== q.id && (
                  <div className="flex gap-2" style={{ marginTop: 14 }}>
                    <button className="btn primary sm" onClick={() => startReply(q.id)}>{t('inbox.respond')}</button>
                    <button className="btn sm" onClick={() => markResolved(q.id)}>{t('inbox.mark_resolved')}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })}
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
