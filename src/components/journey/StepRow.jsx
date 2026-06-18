import React from 'react';
import { ICONS } from '../../lib/data';
import Pill from '../ui/Pill';
import PrioPill from '../ui/PrioPill';

export default function StepRow({ step, onClick, onToggle, dayIn = 0 }) {
  // A negative due day is a pre-kickoff prep item — show it neutrally, never as
  // "overdue". Red is reserved for items genuinely past due in the live
  // timeline (today/dayIn has passed a non-negative due day).
  const preKickoff = step.due < 0;
  const overdue = !preKickoff && step.due < dayIn && step.status !== 'done' && step.status !== 'skip';
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
      <span className={`due ${overdue ? 'late' : ''} ${preKickoff ? 'prekick' : ''}`}>
        {preKickoff ? 'Pre-kickoff' : `Day ${step.due}`}
      </span>
      <Pill kind={step.status} />
      <button className="close" onClick={e => { e.stopPropagation(); }}>{ICONS.dots}</button>
    </div>
  );
}
