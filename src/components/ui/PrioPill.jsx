import React from 'react';
import { PRIO } from '../../lib/data';

export default function PrioPill({ prio }) {
  return <span className={`pill ${PRIO[prio].cls}`}>{PRIO[prio].label}</span>;
}
