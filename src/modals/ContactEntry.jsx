import React from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../lib/data';
import DesignationPicker from './DesignationPicker';

export default function ContactEntry({ contact, onChange, onRemove, canRemove }) {
  const { t } = useTranslation();
  return (
    <div className="contact-entry">
      {canRemove && (
        <button type="button" className="close remove-contact" onClick={onRemove} title={t('modals.contact.remove_contact')}>
          {ICONS.close}
        </button>
      )}
      <div className="contact-fields">
        <input className="input" placeholder={t('modals.contact.full_name')} value={contact.name}
          onChange={e => onChange({ ...contact, name: e.target.value })} />
        <input className="input" placeholder={t('modals.contact.role_title')} value={contact.role}
          onChange={e => onChange({ ...contact, role: e.target.value })} />
        <input className="input" placeholder={t('modals.contact.email_ph')} value={contact.email}
          onChange={e => onChange({ ...contact, email: e.target.value })} />
      </div>
      <DesignationPicker
        selected={contact.designations || []}
        onChange={desigs => onChange({ ...contact, designations: desigs })}
      />
    </div>
  );
}
