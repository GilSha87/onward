import React from 'react';

export default function StatusBadge({ status }) {
  const labels = { active: 'Active', inactive: 'Inactive', archived: 'Archived' };
  return <span className={`status-badge ${status || 'active'}`}>{labels[status] || 'Active'}</span>;
}
