import React from 'react';

export const PHASES = [
  { id: 'pre', num: '00', name: 'Pre-Onboarding',         short: 'Pre',     blurb: 'Contract & access' },
  { id: 'p1',  num: '01', name: 'Kickoff & Discovery',    short: 'Kickoff', blurb: 'Goals, scope & team' },
  { id: 'p2',  num: '02', name: 'Platform Setup & Build', short: 'Build',   blurb: 'Templates & integrations' },
  { id: 'p3',  num: '03', name: 'Enablement & GTM',       short: 'GTM',     blurb: 'Training & launch plan' },
  { id: 'p4',  num: '04', name: 'Pilot, Launch & Scale',  short: 'Scale',   blurb: 'Sites live, expand' },
];

export const STATUS = {
  done:     { label: 'Done',        cls: 'done',     ic: 'st_done'  },
  progress: { label: 'In progress', cls: 'progress', ic: 'st_prog'  },
  blocked:  { label: 'Blocked',     cls: 'blocked',  ic: 'st_block' },
  not:      { label: 'Not started', cls: 'not',      ic: 'st_not'   },
  skip:     { label: 'Skipped',     cls: 'skip',     ic: 'st_skip'  },
  defer:    { label: 'Deferred',    cls: 'defer',    ic: 'st_defer' },
};

export const PRIO = {
  must: { label: 'Must',     cls: 'must' },
  high: { label: 'High',     cls: 'high' },
  med:  { label: 'Medium',   cls: 'med'  },
  opt:  { label: 'Optional', cls: 'opt'  },
};

export const SAMPLE_STEPS = [
  { id: 's01', phase: 'pre', title: 'Contract signed',             why: 'Kicks off legal & billing setup.',                          owner: 'Duda',   prio: 'must', status: 'done',     start: -7,  due: -2  },
  { id: 's02', phase: 'pre', title: 'Provision tenant & SSO',      why: 'Your team gets a dedicated workspace.',                     owner: 'Duda',   prio: 'must', status: 'done',     start: -5,  due: 0   },
  { id: 's03', phase: 'pre', title: 'Welcome packet delivered',    why: 'Sets expectations for the 180 days ahead.',                 owner: 'Duda',   prio: 'high', status: 'done',     start: -2,  due: 1   },
  { id: 's04', phase: 'p1',  title: 'Kickoff call',                why: 'Align on goals, success metrics & timeline.',               owner: 'Both',   prio: 'must', status: 'done',     start: 2,   due: 4   },
  { id: 's05', phase: 'p1',  title: 'Stakeholder map',             why: 'Identify decision makers & champions on your side.',        owner: 'Client', prio: 'must', status: 'done',     start: 3,   due: 7   },
  { id: 's06', phase: 'p1',  title: 'ICP & build flow confirmation', why: "Locks the path we'll follow for setup.",                  owner: 'Both',   prio: 'must', status: 'done',     start: 5,   due: 9   },
  { id: 's07', phase: 'p1',  title: 'Brand assets handoff',        why: 'Logos, fonts, palette — for templates.',                    owner: 'Client', prio: 'high', status: 'progress', start: 7,   due: 14  },
  { id: 's08', phase: 'p1',  title: 'Discovery questionnaire',     why: 'Calibrates onboarding to your specific needs.',             owner: 'Client', prio: 'high', status: 'progress', start: 8,   due: 16  },
  { id: 's09', phase: 'p2',  title: 'Template library setup',      why: 'Curated starter templates for your verticals.',             owner: 'Duda',   prio: 'must', status: 'progress', start: 14,  due: 28  },
  { id: 's10', phase: 'p2',  title: 'DNS & domain configuration',  why: 'Sites live on your domains.',                               owner: 'Both',   prio: 'must', status: 'not',      start: 18,  due: 30  },
  { id: 's11', phase: 'p2',  title: 'CRM / billing integration',   why: 'Sync customers, sites and invoices.',                       owner: 'Both',   prio: 'high', status: 'blocked',  start: 21,  due: 35  },
  { id: 's12', phase: 'p2',  title: 'White-label setup',           why: 'Editor, dashboard & emails match your brand.',              owner: 'Duda',   prio: 'high', status: 'not',      start: 24,  due: 38  },
  { id: 's13', phase: 'p2',  title: 'Workspace org structure',     why: 'Permissions, teams & folders.',                             owner: 'Client', prio: 'med',  status: 'not',      start: 26,  due: 40  },
  { id: 's14', phase: 'p3',  title: 'Admin training (live)',        why: 'Train trainers — your power users get certified.',          owner: 'Duda',   prio: 'must', status: 'not',      start: 35,  due: 49  },
  { id: 's15', phase: 'p3',  title: 'GTM kit & positioning',       why: 'Pitch decks, one-pagers & demo scripts.',                   owner: 'Duda',   prio: 'high', status: 'not',      start: 42,  due: 56  },
  { id: 's16', phase: 'p3',  title: 'Sales enablement session',    why: 'Your team can sell & demo confidently.',                    owner: 'Both',   prio: 'high', status: 'not',      start: 49,  due: 63  },
  { id: 's17', phase: 'p3',  title: 'Pricing & packaging review',  why: "Lock the offer you'll go to market with.",                  owner: 'Client', prio: 'med',  status: 'not',      start: 56,  due: 70  },
  { id: 's18', phase: 'p4',  title: 'Pilot customer build',         why: 'First site live — the proof point.',                       owner: 'Both',   prio: 'must', status: 'not',      start: 70,  due: 90  },
  { id: 's19', phase: 'p4',  title: 'Public launch announcement',  why: 'You make it official to your audience.',                    owner: 'Client', prio: 'high', status: 'not',      start: 90,  due: 110 },
  { id: 's20', phase: 'p4',  title: 'QBR & scale plan',            why: 'Review the 90 — plan the next 90.',                         owner: 'Both',   prio: 'must', status: 'not',      start: 120, due: 150 },
];

export const SAMPLE_CLIENTS = [
  { id: 'c1', name: 'Northwind Marketing', icp: 'Agency',          flow: 'DIFM',        touch: 'High-Touch', country: 'United States', flag: '🇺🇸', lang: 'English',   color: '#1F3A5F', mono: 'NW', kickoff: '2026-03-12', am: 'Maya Levin',    dayIn: 62,  phase: 'p2',  status: 'active', contacts: [{name:'Adrian Park',   role:'CEO',      email:'adrian@northwind.co'},{name:'Jules Pham',role:'Web lead',email:'jules@northwind.co'}], progress: {done:8,  total:20} },
  { id: 'c2', name: 'Goldcrest Hosting',   icp: 'Hosting',         flow: 'Hybrid',      touch: 'High-Touch', country: 'Netherlands',   flag: '🇳🇱', lang: 'English',   color: '#B8854A', mono: 'GC', kickoff: '2026-02-04', am: 'Maya Levin',    dayIn: 98,  phase: 'p3',  status: 'active', contacts: [{name:'Anika de Vries', role:'COO',      email:'anika@goldcrest.nl'}],                                                                       progress: {done:13, total:20} },
  { id: 'c3', name: 'Brio POS',            icp: 'POS / eCommerce', flow: 'DIY',         touch: 'Low-Touch',  country: 'Brazil',        flag: '🇧🇷', lang: 'Português', color: '#5C6B4A', mono: 'BR', kickoff: '2026-04-22', am: 'Maya Levin',    dayIn: 21,  phase: 'p1',  status: 'active', contacts: [{name:'Camila Souza',   role:'Product',  email:'cam@briopos.br'}],                                                                              progress: {done:4,  total:20} },
  { id: 'c4', name: 'Harbor Lines',        icp: 'Listing / YP',    flow: 'Migration',   touch: 'High-Touch', country: 'United Kingdom', flag: '🇬🇧', lang: 'English',   color: '#4F5A66', mono: 'HL', kickoff: '2026-01-15', am: 'Theo Nakamura', dayIn: 118, phase: 'p3',  status: 'active', contacts: [{name:'Priya Shah',     role:'Director', email:'priya@harbor.uk'}],                                                                              progress: {done:15, total:20} },
  { id: 'c5', name: 'Verda SaaS',          icp: 'SaaS Platform',   flow: 'Marketplace', touch: 'Low-Touch',  country: 'Germany',       flag: '🇩🇪', lang: 'Deutsch',   color: '#A0392E', mono: 'VE', kickoff: '2026-05-01', am: 'Theo Nakamura', dayIn: 12,  phase: 'pre', status: 'active', contacts: [{name:'Jonas Becker',   role:'PM',       email:'jonas@verda.de'}],                                                                               progress: {done:2,  total:20} },
  { id: 'c6', name: 'Solea Studio',        icp: 'Agency',          flow: 'DIFM',        touch: 'High-Touch', country: 'Mexico',        flag: '🇲🇽', lang: 'Español',   color: '#B8543A', mono: 'SO', kickoff: '2025-12-09', am: 'Maya Levin',    dayIn: 155, phase: 'p4',  status: 'active', contacts: [{name:'Inés Reyes',     role:'Founder',  email:'ines@solea.mx'}],                                                                                progress: {done:18, total:20} },
];

export const TEAM = [
  { id: 't1', name: 'Maya Levin',    role: 'Staff',     mono: 'ML', initials: 'ML', clients: 14, open: 38, resolved: 121, color: '#1F3A5F' },
  { id: 't2', name: 'Theo Nakamura', role: 'Staff',     mono: 'TN', initials: 'TN', clients: 9,  open: 22, resolved: 88,  color: '#5C6B4A' },
  { id: 't3', name: 'Avery Okonkwo', role: 'Staff',     mono: 'AO', initials: 'AO', clients: 12, open: 30, resolved: 104, color: '#B8543A' },
  { id: 't4', name: 'Sasha Petrov',  role: 'Executive', mono: 'SP', initials: 'SP', clients: 0,  open: 0,  resolved: 0,   color: '#4F5A66' },
  { id: 't5', name: 'Lior Ben-Ari',  role: 'Admin',     mono: 'LB', initials: 'LB', clients: 0,  open: 0,  resolved: 0,   color: '#1A1714' },
];

export const PLAN = {
  d60: {
    goal: 'Foundation set — your team is enabled, tooling is connected, and one pilot is in build.',
    notes: 'You should feel confident running the platform without us in the room.',
    milestones: [
      { done: true,  text: 'Brand assets & guidelines locked',   owner: 'CL', due: 'Day 14', completed: 'Mar 26' },
      { done: true,  text: 'Tenant fully provisioned, SSO live', owner: 'DD', due: 'Day 21', completed: 'Apr 02' },
      { done: false, text: 'Three power users certified',         owner: 'DD', due: 'Day 49' },
      { done: false, text: 'First pilot in active build',         owner: 'BO', due: 'Day 60' },
    ],
  },
  d90: {
    goal: 'Go-live. Your first sites are publicly launched on your domains, your team is selling.',
    notes: 'Public launch announcement goes out by day 95.',
    milestones: [
      { done: false, text: 'Pilot customer live on your domain', owner: 'BO', due: 'Day 75' },
      { done: false, text: 'Sales enablement complete',          owner: 'BO', due: 'Day 80' },
      { done: false, text: 'GTM kit shipped to field',           owner: 'DD', due: 'Day 85' },
      { done: false, text: 'Pricing & packaging signed off',     owner: 'CL', due: 'Day 90' },
    ],
  },
  d180: {
    goal: 'Scale. 25+ customer sites live, expansion plan underway, QBR scheduled.',
    notes: 'We review wins, blockers, and plan the next 90.',
    milestones: [
      { done: false, text: '25 customer sites live', owner: 'CL', due: 'Day 140' },
      { done: false, text: 'Expansion plan signed',  owner: 'BO', due: 'Day 160' },
      { done: false, text: 'QBR completed',           owner: 'BO', due: 'Day 170' },
      { done: false, text: 'Renewal in motion',       owner: 'CL', due: 'Day 180' },
    ],
  },
};

export const ACTIVITY = [
  { who: 'Maya Levin',     what: 'moved',       target: 'Stakeholder map',         from: 'In progress', to: 'Done',        when: '2h ago'    },
  { who: 'Adrian Park',   what: 'replied to',  target: 'Discovery questionnaire', quote: 'Final answers attached — sorry for the delay, board prep this week.', when: '5h ago' },
  { who: 'Maya Levin',    what: 'moved',       target: 'Brand assets handoff',    from: 'Not started', to: 'In progress', when: 'yesterday'  },
  { who: 'Jules Pham',    what: 'uploaded',    target: 'Logo pack v2',            detail: '3 SVGs · 1 PNG',              when: 'Mon'        },
  { who: 'Theo Nakamura', what: 'commented on', target: 'CRM integration',        quote: 'HubSpot Enterprise mapping needs platform team review.', when: 'Apr 21' },
];

export const QUESTIONS = [
  { id: 'q1', from: 'Adrian Park', step: 'CRM / billing integration', text: 'We use HubSpot Enterprise — can we map deals to sites both ways?', when: 'Apr 22', status: 'Open'     },
  { id: 'q2', from: 'Jules Pham',  step: 'Brand assets handoff',       text: 'Do you accept Figma files or do we need to export SVGs?',         when: 'Apr 20', status: 'Resolved' },
];

export const ICONS = {
  search:   <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13"/></svg>,
  plus:     <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 1.5v9M1.5 6h9"/></svg>,
  arrow:    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h10M7 1l4 4-4 4"/></svg>,
  arrowL:   <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 5H1M5 1L1 5l4 4"/></svg>,
  back:     <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M11 7H3M6 3L2 7l4 4"/></svg>,
  check:    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1.5 5.5l2.5 2.5L9 2"/></svg>,
  close:    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l8 8M11 3l-8 8"/></svg>,
  dots:     <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="11" cy="7" r="1.2"/></svg>,
  chev:     <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l4 4 4-4"/></svg>,
  filter:   <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 2h10M3 6h6M5 10h2"/></svg>,
  cal:      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1.5" y="2.5" width="11" height="10" rx="1"/><path d="M1.5 5.5h11M4 1v3M10 1v3"/></svg>,
  flag:     <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 11V2M3 2h7l-1.5 2 1.5 2H3"/></svg>,
  user:     <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="6" cy="4.5" r="2.2"/><path d="M2 11c.5-2 2-3 4-3s3.5 1 4 3"/></svg>,
  link:     <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 7l2-2M3.5 8.5a2 2 0 010-3l1.5-1.5a2 2 0 013 0 2 2 0 010 3l-.5.5M8.5 3.5a2 2 0 010 3L7 8a2 2 0 01-3 0 2 2 0 010-3l.5-.5"/></svg>,
  lock:     <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2.5" y="5.5" width="7" height="5" rx="1"/><path d="M4 5.5V4a2 2 0 014 0v1.5"/></svg>,
  bell:     <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 9V6a3 3 0 016 0v3l1 1H2zM5 11h2"/></svg>,
  spark:    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1l1.2 3.3L10.5 5.5 7.2 6.7 6 10 4.8 6.7 1.5 5.5l3.3-1.2z"/></svg>,
  alert:    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M6 1l5.2 9.5H0.8L6 1z"/><path d="M6 5v2.5M6 9v.1"/></svg>,
  st_done:  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5l2.5 2.5L9.5 3.5"/></svg>,
  st_prog:  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3.5 2.5v7l5-3.5z"/></svg>,
  st_block: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h6"/></svg>,
  st_not:   <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="3.5"/></svg>,
  st_defer: <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4"/><path d="M6 4v2l1.5 1"/></svg>,
  st_skip:  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2.5 3l4 3-4 3zM6.5 3l4 3-4 3z"/></svg>,
};

export const AM_RESOURCES = [
  { name: 'AE to AM Handover GPT',         type: 'Internal GPT',   stage: 'Pre-kickoff', when: 'Summarize sales context before kickoff',                        internal: true },
  { name: 'Discovery Questions GPT',        type: 'Internal GPT',   stage: 'Kickoff',     when: 'Generate tailored discovery questions based on ICP',            internal: true },
  { name: 'Partners Onboarding Dashboard',  type: 'Domo Dashboard', stage: 'Post-launch', when: 'Track feature usage and activation metrics',                    internal: true },
  { name: 'SaaS Onboarding Process',        type: 'Notion Page',    stage: 'Discovery',   when: 'SaaS flow design, GTM options, UX examples',                    internal: true },
  { name: 'Flow Router',                    type: 'Checklist',      stage: 'Pre-kickoff', when: 'Choose DIY/DIFM/Hybrid/Migration/Marketplace path',             internal: true },
  { name: 'Segment Playbooks',              type: 'Internal Deck',  stage: 'Discovery',   when: 'Tailor the onboarding approach to ICP',                         internal: true },
  { name: 'GTM Review Deck',                type: 'Internal Deck',  stage: 'GTM',         when: 'Partner presents final flow, exec sponsor confirms',             internal: true },
  { name: 'QA Checklist (pre-pilot)',        type: 'Checklist',      stage: 'Pilot',       when: 'Permissions, data sync, domain, SEO — run before every pilot',  internal: true },
  { name: 'Migration Planning Checklist',   type: 'Checklist',      stage: 'Launch',      when: 'Legacy portfolio migrations and batch rollout',                  internal: true },
];

export const CLIENT_RESOURCES = [
  { name: 'Duda Academy',           type: 'Academy',         stage: 'Enablement',    when: 'Default training hub',                           url: 'https://academy.duda.co/' },
  { name: 'Tour the Platform',      type: 'Academy',         stage: 'Overview',      when: 'Prerequisite for platform overview session',     url: 'https://academy.duda.co/course/tour-the-platform' },
  { name: 'Build Sites with Duda',  type: 'Academy',         stage: 'Enablement',    when: 'Core builder training',                          url: 'https://app.academy.duda.co/program/e11c463b' },
  { name: 'Developer Documentation', type: 'Dev Docs',        stage: 'Technical Build', when: 'Technical reference hub',                    url: 'https://developer.duda.co/' },
  { name: 'DIY Onboarding Docs',    type: 'Dev Docs',         stage: 'Technical Build', when: 'Self-service implementation guide',           url: 'https://developer.duda.co/docs/diy-onboarding' },
  { name: 'Upsell + Publish Flows', type: 'Dev Docs',         stage: 'GTM',           when: 'Publish gating and upgrade path',               url: 'https://developer.duda.co/docs/upsell-publish-flows' },
  { name: 'Support Portal',         type: 'Support',          stage: 'Support',       when: 'Customer support and help docs',                url: 'https://support.duda.co/hc/en-us' },
  { name: 'System Health / Status', type: 'Support',          stage: 'Launch',        when: 'Service status during launch',                  url: 'https://status.duda.co/' },
  { name: 'Product Updates',        type: 'Client Resource',  stage: 'Ongoing',       when: 'New releases and feature changes',              url: 'https://resources.duda.co/product-updates' },
  { name: 'Idea Board',             type: 'Client Resource',  stage: 'Post-launch',   when: 'Product feedback submission',                   url: 'http://ideas.duda.co/' },
  { name: 'Inspiration Board',      type: 'Client Resource',  stage: 'Enablement',    when: 'Design examples for teams',                    url: 'https://www.duda.co/inspiration' },
];
