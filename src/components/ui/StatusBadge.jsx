import React from 'react';
import { useTranslation } from 'react-i18next';

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const key = ['active', 'inactive', 'archived'].includes(status) ? status : 'active';
  return <span className={`status-badge ${status || 'active'}`}>{t('statusBadge.' + key)}</span>;
}
