import React, { useState } from 'react';
import { SAMPLE_STEPS, ICONS } from '../lib/data';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';
import ContactEntry from './ContactEntry';
import StepTemplatePicker from './StepTemplatePicker';

const COLORS = ['#1F3A5F', '#B8543A', '#5C6B4A', '#B8854A', '#A0392E', '#4F5A66', '#6E2F1E', '#1A1714'];
const COUNTRIES = ['🇺🇸 United States', '🇪🇺 European Union', '🇩🇪 Germany', '🇳🇱 Netherlands', '🇫🇷 France', '🇬🇧 United Kingdom', '🇦🇺 Australia', '🇨🇦 Canada', '🇧🇷 Brazil', '🇮🇱 Israel', '🇲🇽 Mexico', '🇯🇵 Japan', '🇰🇷 South Korea'];

export default function AddClientModal({ onClose, onSave }) {
  const [tab, setTab] = useState('info');
  const [color, setColor] = useState('#B8543A');
  const [icp, setIcp] = useState('Agency');
  const [flow, setFlow] = useState('DIFM');
  const [touch, setTouch] = useState('High-Touch');
  const [name, setName] = useState('');
  const [kickoff, setKickoff] = useState(new Date().toISOString().slice(0, 10));
  const [country, setCountry] = useState('🇺🇸 United States');
  const [language, setLanguage] = useState('English');
  const [contacts, setContacts] = useState([
    { name: '', role: '', email: '', designations: ['Primary'] }
  ]);
  const [excludedSteps, setExcludedSteps] = useState([]);
  const [customSteps, setCustomSteps] = useState([]);

  function updateContact(i, c) {
    const next = [...contacts]; next[i] = c; setContacts(next);
  }
  function removeContact(i) {
    setContacts(contacts.filter((_, j) => j !== i));
  }
  function addContact() {
    setContacts([...contacts, { name: '', role: '', email: '', designations: [] }]);
  }

  function handleSave() {
    if (!name.trim()) { alert('Please enter a company name.'); return; }
    const mono = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
    const flagParts = country.match(/^(\S+)\s+(.+)/);
    const flag = flagParts ? flagParts[1] : '🌐';
    const countryName = flagParts ? flagParts[2] : country;
    const included = SAMPLE_STEPS.length - excludedSteps.length + customSteps.length;
    if (onSave) {
      onSave({
        id: 'c' + Math.random().toString(36).slice(2, 8),
        name: name.trim(), icp, flow, touch,
        country: countryName, flag, color, mono,
        kickoff, am: 'Maya Levin', dayIn: 0, phase: 'pre',
        lang: language,
        contacts: contacts.filter(c => c.name.trim()),
        progress: { done: 0, total: included },
        excludedSteps,
        customSteps,
      });
    }
    onClose();
  }

  return (
    <Modal size="lg" onClose={onClose}>
      <ModalHead title="New client" eyebrow="Onboarding setup" onClose={onClose} />
      <div style={{ padding: '0 24px', borderBottom: '1px solid var(--hairline)', background: 'var(--paper)' }}>
        <div className="tab-row" style={{ borderBottom: 0, marginBottom: 0 }}>
          <button className={tab === 'info' ? 'on' : ''} onClick={() => setTab('info')}>① Client info</button>
          <button className={tab === 'contacts' ? 'on' : ''} onClick={() => setTab('contacts')}>② Contacts</button>
          <button className={tab === 'brand' ? 'on' : ''} onClick={() => setTab('brand')}>③ Branding</button>
          <button className={tab === 'steps' ? 'on' : ''} onClick={() => setTab('steps')}>④ Steps</button>
        </div>
      </div>

      <div className="modal-body" style={{ background: 'var(--paper-soft)' }}>
        {tab === 'info' && (
          <div className="flex flex-col gap-5">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <div className="field">
                <label>Company name *</label>
                <input className="input" placeholder="e.g. Northwind Marketing" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div className="field">
                <label>Kickoff date</label>
                <input className="input" type="date" value={kickoff} onChange={e => setKickoff(e.target.value)} />
              </div>
            </div>
            <div className="rule rule-soft" style={{ margin: '4px 0' }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label>Country / Region</label>
                <select className="input" value={country} onChange={e => setCountry(e.target.value)}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Language</label>
                <select className="input" value={language} onChange={e => setLanguage(e.target.value)}>
                  <option>English</option><option>Español</option><option>Deutsch</option>
                  <option>Nederlands</option><option>Français</option><option>Português</option><option>עברית</option><option>日本語</option>
                </select>
              </div>
            </div>
            <div className="rule rule-soft" style={{ margin: '4px 0' }}></div>
            <div className="field">
              <label>ICP *</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {['Agency', 'SaaS Platform', 'Hosting', 'Listing / YP', 'POS / eCommerce'].map(o => (
                  <button key={o} type="button" className={`btn sm ${icp === o ? 'primary' : ''}`} onClick={() => setIcp(o)}>{o}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Build flow *</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {['DIFM', 'DIY', 'Hybrid', 'Migration', 'Marketplace'].map(o => (
                  <button key={o} type="button" className={`btn sm ${flow === o ? 'primary' : ''}`} onClick={() => setFlow(o)}>{o}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Touch level</label>
              <div className="seg" style={{ alignSelf: 'flex-start' }}>
                <button className={touch === 'High-Touch' ? 'on' : ''} onClick={() => setTouch('High-Touch')}>High-Touch</button>
                <button className={touch === 'Low-Touch' ? 'on' : ''} onClick={() => setTouch('Low-Touch')}>Low-Touch</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'contacts' && (
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div>
                <div className="eyebrow">Client contacts</div>
                <p className="muted text-sm" style={{ marginTop: 4 }}>
                  Add all stakeholders. Assign designations: Champion, Executive, Primary, Technical.
                  Each person can have multiple designations.
                </p>
              </div>
              <button type="button" className="btn sm" onClick={addContact}>{ICONS.plus} Add contact</button>
            </div>
            {contacts.map((c, i) => (
              <ContactEntry key={i} contact={c}
                onChange={upd => updateContact(i, upd)}
                onRemove={() => removeContact(i)}
                canRemove={contacts.length > 1} />
            ))}
          </div>
        )}

        {tab === 'brand' && (
          <div className="flex flex-col gap-6">
            <div>
              <div className="eyebrow">Logo</div>
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '160px 1fr', gap: 24 }}>
                <div style={{
                  width: 160, height: 160, border: '1.5px dashed var(--ink-faint)', borderRadius: 8,
                  background: 'var(--paper-soft)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--ink-muted)', cursor: 'pointer',
                }}>
                  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="4" y="6" width="28" height="22" rx="2" /><circle cx="13" cy="14" r="2.5" /><path d="M4 22l8-7 9 8M18 22l5-4 9 5" />
                  </svg>
                  <div className="text-sm">Click or drag here</div>
                  <div className="text-xs faint">PNG, SVG, JPG · 2 MB</div>
                </div>
                <div>
                  <p className="muted text-sm" style={{ lineHeight: 1.55 }}>
                    The logo appears on the client-facing tracker, plan summaries, and exported PDFs.
                  </p>
                  <div className="field" style={{ marginTop: 16 }}>
                    <label>or paste a URL</label>
                    <input className="input" placeholder="https://…/logo.svg" />
                  </div>
                </div>
              </div>
            </div>
            <div className="rule rule-soft"></div>
            <div>
              <div className="eyebrow">Brand color</div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    style={{
                      width: 40, height: 40, borderRadius: 999, background: c,
                      border: color === c ? '2px solid var(--ink)' : '1px solid var(--hairline)',
                      outline: color === c ? '2px solid var(--paper)' : 'none', outlineOffset: '-4px', cursor: 'pointer',
                    }} />
                ))}
                <input type="text" value={color} onChange={e => setColor(e.target.value)} className="input mono" style={{ width: 100, fontSize: 12 }} />
              </div>
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="muted text-xs">Preview</div>
                <span className="client-logo lg" style={{ background: color }}>
                  {name ? name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??'}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{name || 'Company name'}</div>
                  <div className="muted text-sm">{icp} · {flow}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'steps' && (
          <StepTemplatePicker
            steps={SAMPLE_STEPS}
            excludedSteps={excludedSteps}
            setExcludedSteps={setExcludedSteps}
            customSteps={customSteps}
            setCustomSteps={setCustomSteps}
            icp={icp}
            flow={flow}
          />
        )}
      </div>

      <div className="modal-foot">
        <span className="muted text-xs">{name ? <><b>{name}</b> · {contacts.filter(c => c.name).length} contacts · {SAMPLE_STEPS.length - excludedSteps.length + customSteps.length} steps</> : 'Fill in client info above'}</span>
        <div className="flex gap-2">
          <button className="btn" onClick={onClose}>Cancel</button>
          {tab !== 'info' && <button className="btn" onClick={() => setTab(tab === 'contacts' ? 'info' : tab === 'brand' ? 'contacts' : 'brand')}>{ICONS.arrowL} Back</button>}
          {tab !== 'steps' && <button className="btn primary" onClick={() => setTab(tab === 'info' ? 'contacts' : tab === 'contacts' ? 'brand' : 'steps')}>Continue {ICONS.arrow}</button>}
          {tab === 'steps' && <button className="btn primary" onClick={handleSave}>Save client {ICONS.check}</button>}
        </div>
      </div>
    </Modal>
  );
}
