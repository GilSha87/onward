import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PHASES, STATUS, PRIO } from '../lib/data';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';

export default function EditStepModal({ step, onClose, onSave }) {
  const { t } = useTranslation();
  const ownerLabel = (o) => o === 'Duda' ? t('owner.duda') : o === 'Both' ? t('owner.both') : o === 'Client' ? t('owner.client') : o;
  const [title, setTitle] = useState(step.title);
  const [why, setWhy] = useState(step.why);
  const [status, setStatus] = useState(step.status);
  const [owner, setOwner] = useState(step.owner);
  const [prio, setPrio] = useState(step.prio);
  const savedRef = useRef(false);

  return (
    <Modal size="md" onClose={onClose}>
      <ModalHead title={step.title} eyebrow={t('modals.editStep.phase_eyebrow', { num: PHASES.find(p => p.id === step.phase)?.num || '?' })} onClose={onClose} />
      <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>{t('modals.editStep.task_title')}</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>{t('modals.editStep.status')}</label>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {Object.keys(STATUS).map(k => (
              <button key={k} onClick={() => setStatus(k)}
                className={`btn sm ${status === k ? 'primary' : ''}`}>
                {t('status.' + k, { defaultValue: STATUS[k].label })}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div className="field">
            <label>{t('modals.editStep.owner')}</label>
            <div className="seg" style={{ alignSelf: 'flex-start' }}>
              {['Duda', 'Client', 'Both'].map(o => (
                <button key={o} className={owner === o ? 'on' : ''} onClick={() => setOwner(o)}>{ownerLabel(o)}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>{t('modals.editStep.priority')}</label>
            <select className="input" value={prio} onChange={e => setPrio(e.target.value)}>
              {Object.keys(PRIO).map(k => <option key={k} value={k}>{t('prio.' + k, { defaultValue: PRIO[k].label })}</option>)}
            </select>
          </div>
        </div>
        <div className="rule rule-soft"></div>
        <div style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--duda-ink)' }}>{t('modals.editStep.am_note')}</div>
          <textarea className="input" placeholder={t('modals.editStep.am_note_ph')}></textarea>
        </div>
        <div style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>{t('modals.editStep.why_label')}</div>
          <textarea className="input" value={why} onChange={e => setWhy(e.target.value)}></textarea>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn ghost" onClick={() => { if (savedRef.current) return; savedRef.current = true; if (onSave) onSave({ ...step, _delete: true }); onClose(); }}>{t('modals.editStep.delete_step')}</button>
        <div className="flex gap-2">
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn primary" onClick={() => { if (savedRef.current) return; savedRef.current = true; if (onSave) onSave({ ...step, title, why, status, owner, prio }); onClose(); }}>{t('modals.editStep.save_step')}</button>
        </div>
      </div>
    </Modal>
  );
}
