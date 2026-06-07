-- Migration 009: Reseed steps for clients that have 0 step rows.
-- Uses the same SAMPLE_STEPS template and flow/segment filtering as the frontend onSave handler.
-- Safe to re-run: only inserts for clients where count(steps) = 0.

begin;

do $$
declare
  r record;
begin
  -- Walk every client that currently has zero step rows
  for r in
    select c.id as client_id, c.flow, c.icp, c.user_id
    from public.clients c
    where not exists (select 1 from public.steps s where s.client_id = c.id)
  loop
    -- Insert all SAMPLE_STEPS that match the client's flow and icp.
    -- Template data (phase, title, why, owner, prio, start_day, due_day, flows[], segments[])
    -- is embedded as a VALUES list; the WHERE clause mirrors the JS filter in App.jsx lines 542-546.
    insert into public.steps (client_id, user_id, phase, title, why, owner, prio, status, start, due)
    select
      r.client_id,
      r.user_id,
      t.phase,
      t.title,
      t.why,
      t.owner,
      t.prio,
      'not'::text,
      t.start_day,
      t.due_day
    from (values
      -- ── Pre-Onboarding ──────────────────────────────────────────────────────────
      ('T02','pre','Kickoff call & stakeholder alignment','Aligns all parties on timeline, expectations, meeting cadence, and success criteria before Day 1','Duda','must', 0,  5,  ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T03','pre','AE → AM handover brief','Account context, deal history, and customer expectations fully transferred to the onboarding AM','Duda','must',-7, -2, ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T04','pre','Technical kickoff','Technical scope, integration owners, access prerequisites, and dependencies confirmed upfront','Duda','must', 3,  7,  ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T05','pre','Contract & NDA confirmed','Legal sign-off and procurement cleared before onboarding resources are committed','Duda','must',-7,  0,  ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T06','pre','Kick-off deck & welcome pack sent','Sets roles, responsibilities, and the full 180-day roadmap before the first meeting','Duda','high',-2, 1,  ARRAY['All']::text[],                         ARRAY['All']::text[]),
      -- ── Kickoff & Discovery ──────────────────────────────────────────────────────
      ('T07','p1','ICP & flow confirmed (Flow Router)','Locks the DIY / DIFM / Hybrid / Migration / Marketplace path — all downstream steps depend on this','Both','must',10, 14, ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T08','p1','Goals, KPIs & success metrics defined','Shared definition of success at 60, 90, and 180 days — prevents scope creep and misalignment','Both','must',10, 16, ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T09','p1','Discovery call (segment playbook)','Tailored discovery using segment playbook surfaces technical, GTM, and operational needs early','Both','must',12, 18, ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T10','p1','Stakeholder map complete','Decision-makers, champions, and technical owners identified so nothing gets stuck in approval chains','Client','high',14,21, ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T11','p1','Brand assets handed over','Logos, fonts, and color palette needed to build templates and white-label the editor correctly','Client','must',14, 21, ARRAY['DIFM','Hybrid']::text[],                ARRAY['All']::text[]),
      ('T12','p1','Platform structure defined','Workspace hierarchy, team permissions, and folder structure agreed before build begins','Both','must',14, 28, ARRAY['All']::text[],                         ARRAY['All']::text[]),
      -- ── Platform Setup & Build ───────────────────────────────────────────────────
      ('T13','p2','API / embed / SSO scope locked','Integration scope, ownership, and support model agreed before engineering work starts','Both','must',21, 35, ARRAY['All']::text[],                         ARRAY['SaaS','Hosting']::text[]),
      ('T14','p2','White-label setup complete','Editor, dashboard, and transactional emails match the partner''s brand before any client sees them','Duda','high',28,42, ARRAY['DIFM','Hybrid']::text[],                ARRAY['All']::text[]),
      ('T15','p2','DNS & domain configuration','Custom domains configured so customer sites go live on the partner''s URLs, not Duda defaults','Both','must',28, 42, ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T16','p2','CRM / billing integration','Customer and billing data synced between Duda and the partner''s existing systems before pilot','Both','high',28,42, ARRAY['All']::text[],                         ARRAY['SaaS','Hosting']::text[]),
      ('T17','p2','Workspace org structure','Permissions, teams, and folders configured so the right people access the right accounts','Client','med',28, 42, ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T18','p2','First template built','One representative template completed as proof-of-concept before broader template library build-out','Duda','must',28,42, ARRAY['DIFM','Hybrid']::text[],                ARRAY['All']::text[]),
      ('T19','p2','DIY platform walkthrough','Partner''s team can build and publish sites independently without ongoing Duda assistance','Duda','must',28,35, ARRAY['DIY']::text[],                         ARRAY['All']::text[]),
      ('T20','p2','Migration plan & data mapping','Legacy site inventory catalogued, migration approach, batch order, and timeline confirmed','Both','must',28,42, ARRAY['Migration']::text[],                   ARRAY['All']::text[]),
      ('T21','p2','Marketplace app configured','App installed, permissions set, and integration tested end-to-end in a staging environment','Both','must',28,42, ARRAY['Marketplace / Add-on']::text[],        ARRAY['All']::text[]),
      ('T22','p2','Custom widget requirements reviewed','Widget scope, ownership, and long-term support model agreed before any development begins','Both','must',21,35, ARRAY['All']::text[],                         ARRAY['SaaS']::text[]),
      -- ── Enablement & GTM ─────────────────────────────────────────────────────────
      ('T23','p3','Admin / team training delivered','All platform admins can build, manage, and troubleshoot customer sites without Duda in the room','Duda','must',42,56, ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T24','p3','Power users certified (Duda Academy)','Key team members certified via Duda Academy — internal champions created to sustain the platform','Client','must',49,63,ARRAY['All']::text[],                        ARRAY['All']::text[]),
      ('T25','p3','Sales enablement session','Partner''s sales team can pitch, demo, and close website product deals without Duda on the call','Both','high',49,63, ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T26','p3','GTM kit & positioning deck','Pitch decks, one-pagers, and demo scripts ready for the partner''s sales team before launch','Duda','high',42,56, ARRAY['DIFM','Hybrid']::text[],                ARRAY['All']::text[]),
      ('T27','p3','Pricing & packaging review','Final offer confirmed — pricing tiers, add-ons, and publish-gating rules locked before going live','Client','med',56,70,ARRAY['All']::text[],                        ARRAY['All']::text[]),
      ('T28','p3','GTM review deck sign-off','Partner presents the complete go-to-market plan to exec sponsor — green light to launch obtained','Both','must',63,77,ARRAY['All']::text[],                         ARRAY['All']::text[]),
      -- ── Pilot, Launch & Scale ────────────────────────────────────────────────────
      ('T29','p4','QA checklist (pre-pilot)','Permissions, data sync, domain routing, SEO settings, and publish gating verified before any site goes live','Both','must',77,90,ARRAY['All']::text[],              ARRAY['All']::text[]),
      ('T30','p4','Pilot customer build','First customer site built on the live platform — the concrete proof point for the partner''s team','Both','must',80,100,ARRAY['All']::text[],                       ARRAY['All']::text[]),
      ('T31','p4','Pilot go-live','First customer site publicly live on custom domain — onboarding benchmark achieved','Both','must',90,110,ARRAY['All']::text[],                                              ARRAY['All']::text[]),
      ('T32','p4','Public launch announcement','Partner makes the website product official to their audience — market entry complete','Client','high',105,120,ARRAY['All']::text[],                             ARRAY['All']::text[]),
      ('T33','p4','Batch rollout / migration launch','Legacy portfolio migrated in planned batches — all existing customers transitioned to Duda','Both','must',90,120,ARRAY['Migration']::text[],             ARRAY['All']::text[]),
      ('T34','p4','Post-launch check-in (30 days)','Issues resolved, adoption metrics reviewed, and any blockers to scale surfaced and addressed early','Both','must',110,130,ARRAY['All']::text[],          ARRAY['All']::text[]),
      ('T35','p4','Feature usage review','Usage data reviewed to identify underutilized features and surface expansion opportunities','Duda','high',120,140,ARRAY['All']::text[],                             ARRAY['All']::text[]),
      ('T36','p4','Expansion plan scoped','Next 90-day priorities defined — new segments, product tiers, or customer acquisition targets agreed','Both','med',130,150,ARRAY['All']::text[],                  ARRAY['All']::text[]),
      ('T37','p4','QBR & scale plan','Formal review of the full 180-day journey — wins, blockers, and the next 90 days planned together','Both','must',150,165,ARRAY['All']::text[],                         ARRAY['All']::text[]),
      ('T38','p4','Renewal motion initiated','Commercial renewal conversation started before contract expiry — no surprises at end of term','Both','must',160,180,ARRAY['All']::text[],                       ARRAY['All']::text[])
    ) as t(template_id, phase, title, why, owner, prio, start_day, due_day, flows, segments)
    where
      -- flow filter: 'All' in flows OR client.flow matches one of the flows
      ('All' = any(t.flows) or r.flow = any(t.flows))
      -- segment/icp filter: 'All' in segments OR client.icp matches one of the segments
      and ('All' = any(t.segments) or r.icp = any(t.segments));

    raise notice 'Seeded steps for client %', r.client_id;
  end loop;
end;
$$;

commit;
