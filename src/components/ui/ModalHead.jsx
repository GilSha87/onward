import React from 'react';
import { ICONS } from '../../lib/data';

export default function ModalHead({ title, onClose, eyebrow }) {
  return (
    <div className="modal-head">
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
        <h3 className="h2">{title}</h3>
      </div>
      <button className="close" onClick={onClose}>{ICONS.close}</button>
    </div>
  );
}
