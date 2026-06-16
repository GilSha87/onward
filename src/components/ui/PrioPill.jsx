import React from 'react';
import { useTranslation } from 'react-i18next';
import { PRIO } from '../../lib/data';

export default function PrioPill({ prio }) {
  const { t } = useTranslation();
  return <span className={`pill ${PRIO[prio]?.cls || prio}`}>{t('prio.' + prio, { defaultValue: PRIO[prio]?.label || prio })}</span>;
}
