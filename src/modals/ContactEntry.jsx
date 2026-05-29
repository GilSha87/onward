import React from 'react';
import { ICONS } from '../lib/data';
import DesignationPicker from './DesignationPicker';

export default function ContactEntry({ contact, onChange, onRemove, canRemove }) {
  return (
    <div className="contact-entry">
      {canRemove && (
        <button type="button" className="close remove-contact" onClick={onRemove} title="Remove contact">
          {ICONS.close}
        </button>
      )}
      <div className="contact-fields">
        <input className="input" placeholder="Full name *" value={contact.name}
          onChange={e => onChange({ ...contact, name: e.target.value })} />
        <input className="input" placeholder="Role / title" value={contact.role}
          onChange={e => onChange({ ...contact, role: e.target.value })} />
        <input className="input" placeholder="email@company.com" value={contact.email}
          onChange={e => onChange({ ...contact, email: e.target.value })} />
      </div>
      <DesignationPicker
        selected={contact.designations || []}
        onChange={desigs => onChange({ ...contact, designations: desigs })}
      />
    </div>
  );
}
