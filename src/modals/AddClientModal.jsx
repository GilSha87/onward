import React, { useState, useRef, useEffect } from 'react';
import { SAMPLE_STEPS, FLOWS, SEGMENTS, ICONS } from '../lib/data';
import { db } from '../lib/supabase';
import { showToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import ModalHead from '../components/ui/ModalHead';
import ContactEntry from './ContactEntry';
import StepTemplatePicker from './StepTemplatePicker';

const COLORS = ['#1F3A5F', '#B8543A', '#5C6B4A', '#B8854A', '#A0392E', '#4F5A66', '#6E2F1E', '#1A1714'];
const COUNTRIES = ['🇺🇸 United States', '🇪🇺 European Union', '🇩🇪 Germany', '🇳🇱 Netherlands', '🇫🇷 France', '🇬🇧 United Kingdom', '🇦🇺 Australia', '🇨🇦 Canada', '🇧🇷 Brazil', '🇮🇱 Israel', '🇲🇽 Mexico', '🇯🇵 Japan', '🇰🇷 South Korea'];

export default function AddClientModal({ onClose, onSave, currentUser }) {
  const [tab, setTab] = useState('info');
  const [color, setColor] = useState('#B8543A');
  const [icp, setIcp] = useState('Agency');
  const [flow, setFlow] = useState('DIFM');
  const [touch, setTouch] = useState('High-Touch');
  const [name, setName] = useState('');
  const [kickoff, setKickoff] = useState(new Date().toISOString().slice(0, 10));
  const [country, setCountry] = useState('🇺🇸 United States');
  const [language, setLanguage] = useState('English');
  const [mrr, setMrr] = useState('');
  const [mrrCurrency, setMrrCurrency] = useState('USD');
  const [goLiveDate, setGoLiveDate] = useState('');
  const [sfId, setSfId] = useState('');
  const [boxUrl, setBoxUrl] = useState('');
  const [contacts, setContacts] = useState([
    { name: '', role: '', email: '', designations: ['Primary'] }
  ]);
  const [excludedSteps, setExcludedSteps] = useState([]);
  const [customSteps, setCustomSteps] = useState([]);

  // Reset step selections when ICP or flow changes so stale exclusions don't carry over
  useEffect(() => { setExcludedSteps([]); setCustomSteps([]); }, [icp, flow]);
  const [logo, setLogo] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef(null);

  function updateContact(i, c) {
    const next = [...contacts]; next[i] = c; setContacts(next);
  }
  function removeContact(i) {
    setContacts(contacts.filter((_, j) => j !== i));
  }
  function addContact() {
    setContacts([...contacts, { name: '', role: '', email: '', designations: [] }]);
  }

  async function handleLogoFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG, JPG, SVG, or WebP).', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo must be under 2 MB.', 'error');
      return;
    }
    setLogoUploading(true);
    try {
      const { data: userData } = await db.auth.getUser();
      const uid = userData?.user?.id || 'anon';
      const uuid = (crypto?.randomUUID?.() || `${Date.now()}${Math.random().toString(36).slice(2)}`);
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${uid}/logos/${uuid}_${safeName}`;
      const { error: upErr } = await db.storage
        .from('account-files')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = await db.storage
        .from('account-files')
        .createSignedUrl(path, 31536000); // 1-year signed URL
      if (urlData?.signedUrl) setLogo(urlData.signedUrl);
    } catch {
      showToast('Logo upload failed. You can paste a URL instead.', 'error');
    } finally {
      setLogoUploading(false);
    }
  }

  function handleSave() {
    if (!name.trim()) { showToast('Please enter a company name.', 'error'); return; }
    const mono = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
    const flagParts = country.match(/^(\S+)\s+(.+)/);
    const flag = flagParts ? flagParts[1] : '🌐';
    const countryName = flagParts ? flagParts[2] : country;
    const included = SAMPLE_STEPS.filter(s => {
      const flowOk = !s.flows || s.flows.includes('All') || s.flows.includes(flow);
      const segOk = !s.segments || s.segments.includes('All') || s.segments.includes(icp);
      return flowOk && segOk && !excludedSteps.includes(s.id);
    }).length + customSteps.length;
    const amName = currentUser?.name || 'Account Manager';
    if (onSave) {
      onSave({
        id: 'c' + Math.random().toString(36).slice(2, 8),
        name: name.trim(), icp, flow, touch,
        country: countryName, flag, color, mono,
        kickoff, am: amName, dayIn: 0, phase: 'pre',
        lang: language,
        mrr: mrr ? Number(mrr) : null,
        mrrCurrency,
        goLiveDate: goLiveDate || null,
        sfId: sfId.trim() || null,
        boxUrl: boxUrl.trim() || null,
        contacts: contacts.filter(c => c.name.trim()),
        progress: { done: 0, total: included },
        logoUrl: logo || null,
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label>Monthly Recurring Revenue (MRR)</label>
                <input className="input" type="number" min="0" step="1" inputMode="decimal"
                  placeholder="e.g. 2500" value={mrr} onChange={e => setMrr(e.target.value)} />
              </div>
              <div className="field">
                <label>Currency</label>
                <select className="input" value={mrrCurrency} onChange={e => setMrrCurrency(e.target.value)}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="ILS">ILS (₪)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="BRL">BRL (R$)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>
            {mrr && !isNaN(Number(mrr)) && (
              <div className="muted text-xs" style={{ marginTop: -8 }}>
                Annual Recurring Revenue (ARR): <b>{new Intl.NumberFormat(undefined, { style: 'currency', currency: mrrCurrency, maximumFractionDigits: 0 }).format(Number(mrr) * 12)}</b> · calculated automatically (MRR × 12)
              </div>
            )}
            <div className="rule rule-soft" style={{ margin: '4px 0' }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label>Target go-live date</label>
                <input className="input" type="date" value={goLiveDate} onChange={e => setGoLiveDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Salesforce ID</label>
                <input className="input" placeholder="e.g. 0013X00002AbCdE" value={sfId} onChange={e => setSfId(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Box contract URL</label>
              <input className="input" placeholder="https://app.box.com/…" value={boxUrl} onChange={e => setBoxUrl(e.target.value)} />
            </div>
            <div className="rule rule-soft" style={{ margin: '4px 0' }}></div>
            <div className="field">
              <label>ICP *</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {SEGMENTS.map(o => (
                  <button key={o} type="button" className={`btn sm ${icp === o ? 'primary' : ''}`} onClick={() => setIcp(o)}>{o}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Build flow *</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {FLOWS.map(o => (
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
                {/* Hidden file input */}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  style={{ display: 'none' }}
                  onChange={e => handleLogoFile(e.target.files?.[0])}
                />
                {/* Drop zone / preview */}
                <div
                  onClick={() => !logoUploading && logoInputRef.current?.click()}
                  style={{
                    width: 160, height: 160, border: '1.5px dashed var(--ink-faint)', borderRadius: 8,
                    background: 'var(--paper-soft)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexDirection: 'column', gap: 8,
                    color: 'var(--ink-muted)', cursor: logoUploading ? 'wait' : 'pointer',
                    overflow: 'hidden', position: 'relative',
                  }}
                >
                  {logo ? (
                    <>
                      <img src={logo} alt="Logo preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setLogo(''); }}
                        style={{
                          position: 'absolute', top: 4, right: 4, width: 20, height: 20,
                          background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
                          borderRadius: 999, cursor: 'pointer', fontSize: 12, lineHeight: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >×</button>
                    </>
                  ) : logoUploading ? (
                    <div className="text-sm">Uploading…</div>
                  ) : (
                    <>
                      <svg width="32" height="32" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="4" y="6" width="28" height="22" rx="2" /><circle cx="13" cy="14" r="2.5" /><path d="M4 22l8-7 9 8M18 22l5-4 9 5" />
                      </svg>
                      <div className="text-sm">Click to upload</div>
                      <div className="text-xs faint">PNG, SVG, JPG · 2 MB</div>
                    </>
                  )}
                </div>
                <div>
                  <p className="muted text-sm" style={{ lineHeight: 1.55 }}>
                    The logo appears on the client-facing tracker, plan summaries, and exported PDFs.
                  </p>
                  <div className="field" style={{ marginTop: 16 }}>
                    <label>or paste a URL</label>
                    <input
                      className="input"
                      placeholder="https://…/logo.svg"
                      value={logo}
                      onChange={e => setLogo(e.target.value)}
                    />
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
                {logo ? (
                  <span className="client-logo lg" style={{ background: color, overflow: 'hidden', padding: 0 }}>
                    <img src={logo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  </span>
                ) : (
                  <span className="client-logo lg" style={{ background: color }}>
                    {name ? name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??'}
                  </span>
                )}
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
        <span className="muted text-xs">{name ? <><b>{name}</b> · {contacts.filter(c => c.name).length} contacts · {SAMPLE_STEPS.filter(s => {
          const flowOk = !s.flows || s.flows.includes('All') || s.flows.includes(flow);
          const segOk = !s.segments || s.segments.includes('All') || s.segments.includes(icp);
          return flowOk && segOk && !excludedSteps.includes(s.id);
        }).length + customSteps.length} steps</> : 'Fill in client info above'}</span>
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
