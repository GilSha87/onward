import React from 'react';

const DESIGNATIONS = ['Champion', 'Executive', 'Primary', 'Technical'];

export default function DesignationPicker({ selected, onChange }) {
  function toggle(d) {
    if (selected.includes(d)) {
      onChange(selected.filter(x => x !== d));
    } else {
      onChange([...selected, d]);
    }
  }
  return (
    <div className="contact-tags">
      {DESIGNATIONS.map(d => (
        <button key={d} type="button"
          className={`contact-tag ${d.toLowerCase()} ${selected.includes(d) ? 'on' : ''}`}
          onClick={() => toggle(d)}>
          {d}
        </button>
      ))}
    </div>
  );
}
