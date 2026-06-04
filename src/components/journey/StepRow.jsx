import React from 'react';
import { ICONS } from '../../lib/data';
import Pill from '../ui/Pill';
import PrioPill from '../ui/PrioPill';

export default function StepRow({ step, onClick, onToggle, dayIn = 0 }) {
  const overdue = step.due < dayIn && step.status !== 'done' && step.status !== 'skip';
  return (
    <div className={`step-row ${step.status}`} onClick={onClick}>
      <span
        className="step-check clickable"
        title={step.status === 'done' ? 'Mark not started' : 'Mark complete'}
        onClick={e => { e.stopPropagation(); onToggle?.(step.id); }}
      >
        {step.status === 'done' && ICONS.check}
      </span>
      <div className="title">
        <b>{step.title}</b>
        <div className="why">{step.why}</div>
      </div>
      <div className="owner">
        <span className="faint">Owner · </span>{step.owner}
      </div>
      <PrioPill prio={step.prio} />
      <span className={`due ${overdue ? 'late' : ''}`}>
        {`Day ${step.due}`}
      </span>
      <Pill kind={step.status} />
      <button className="close" onClick={e => { e.stopPropagation(); }}>{ICONS.dots}</button>
    </div>
  );
}
