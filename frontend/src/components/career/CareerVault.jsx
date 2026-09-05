import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Circle,
  TriangleAlert,
  GraduationCap,
  Code2,
  Printer,
  ArrowRight,
  Award,
  Activity,
  ShieldCheck,
  BookOpen,
  Terminal,
  UserRound,
  Compass,
  ScrollText,
  MessageSquare,
  UserCheck,
  ListChecks,
  Target
} from 'lucide-react';
import { apiFetch } from '../../api/client';
import { StatePanel, Skeleton, ProgressBar } from '../shared';

const ACTIVITY_META = {
  onboard: { icon: UserCheck, tone: 'tone-purple', label: 'Onboarding' },
  chat: { icon: MessageSquare, tone: 'tone-cyan', label: 'Mentor consult' },
  ide_pass: { icon: CheckCircle2, tone: 'tone-green', label: 'Code verified' },
  ide_fail: { icon: TriangleAlert, tone: 'tone-yellow', label: 'Benchmark failed' },
  plan_item: { icon: ListChecks, tone: 'tone-blue', label: 'Plan item' }
};

const PRIORITY_ORDER = ['mission', 'learning', 'profile', 'direction', 'stack', 'evidence'];

function timeAgo(iso) {
  if (!iso) return '—';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '—';
  const diff = Date.now() - ts;
  const mins = Math.floor(Math.max(0, diff) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function prettyExperience(value) {
  if (!value) return null;
  const map = { entry: 'Entry-level', mid: 'Mid-level', senior: 'Senior-level' };
  return map[value] || value;
}

export default function CareerVault({
  user,
  profile,
  missionCompleted,
  accessToken,
  onNavigateToLearn,
  onNavigateToIDE,
  onNavigateToPassport,
  onNavigateToSettings
}) {
  const [summary, setSummary] = useState(null);
  const [summaryStatus, setSummaryStatus] = useState('loading'); // loading | ready | error | skipped
  const [tracks, setTracks] = useState(null);
  const [tracksStatus, setTracksStatus] = useState('loading'); // loading | ready | error | skipped

  useEffect(() => {
    if (!accessToken) {
      setSummaryStatus('skipped');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/dashboard/summary', { token: accessToken });
        if (!res.ok) throw new Error('Failed to load career data.');
        const data = await res.json();
        if (!cancelled) {
          setSummary(data);
          setSummaryStatus('ready');
        }
      } catch {
        if (!cancelled) setSummaryStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      setTracksStatus('skipped');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const listRes = await apiFetch('/tracks', { token: accessToken });
        if (!listRes.ok) throw new Error('Failed to load tracks.');
        const listData = await listRes.json();
        const trackList = Array.isArray(listData) ? listData : listData.tracks || [];
        const roadmaps = await Promise.all(
          trackList.map(async (track) => {
            const res = await apiFetch(`/tracks/${track.id}`, { token: accessToken });
            if (!res.ok) throw new Error('Failed to load track detail.');
            return res.json();
          })
        );
        if (!cancelled) {
          setTracks(roadmaps);
          setTracksStatus('ready');
        }
      } catch {
        if (!cancelled) setTracksStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const summaryUser = summary?.user;
  const summaryProfile = summary?.profile;

  const profileFullName = profile?.full_name || summaryProfile?.full_name || null;
  const careerGoal = profile?.career_goal || summaryProfile?.career_goal || null;
  const learningTrack = profile?.learning_track || summaryProfile?.learning_track || null;
  const country = profile?.country || summaryProfile?.country || null;
  const experience = profile?.experience || null;
  const stackRaw = profile?.tech_stack || null;
  const stackItems = stackRaw
    ? stackRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const xp = user.xp ?? summaryUser?.xp ?? null;
  const level = user.level ?? summaryUser?.level ?? null;
  const codeQuality = user.code_quality ?? summaryUser?.code_quality ?? null;

  const recentActivity = summary?.recentActivity || [];
  const activityCount = recentActivity.length;

  let completedLessons = 0;
  let totalLessons = 0;
  if (tracks) {
    for (const roadmap of tracks) {
      for (const mod of roadmap.modules || []) {
        for (const topic of mod.topics || []) {
          for (const lesson of topic.lessons || []) {
            totalLessons += 1;
            if (lesson.status === 'completed') completedLessons += 1;
          }
        }
      }
    }
  }

  const checklist = [
    {
      key: 'mission',
      label: 'Verified engineering mission',
      caption: 'An executed and verified mission is the platform\'s flagship engineering achievement.',
      detail: missionCompleted ? 'Verified' : null,
      established: missionCompleted,
      actionLabel: 'Open Mission IDE',
      onClick: onNavigateToIDE
    },
    {
      key: 'learning',
      label: 'Learning groundwork',
      caption: 'Completed lessons are the recorded foundation of your learning track.',
      detail: completedLessons > 0 ? `${completedLessons} lesson${completedLessons === 1 ? '' : 's'} completed` : null,
      established: completedLessons > 0,
      actionLabel: 'Continue Learning',
      onClick: onNavigateToLearn
    },
    {
      key: 'profile',
      label: 'Developer profile',
      caption: 'A named profile is the base of your developer record.',
      established: !!profileFullName,
      actionLabel: 'Manage Profile',
      onClick: onNavigateToSettings
    },
    {
      key: 'direction',
      label: 'Career direction',
      caption: 'Your learning track and career goal shape the work you take on.',
      established: !!(careerGoal && learningTrack),
      actionLabel: 'Manage Profile',
      onClick: onNavigateToSettings
    },
    {
      key: 'stack',
      label: 'Declared engineering stack',
      caption: 'Your declared tech stack appears in your passport and evidence sheet.',
      detail: stackItems.length > 0 ? `${stackItems.length} technologies declared` : null,
      established: stackItems.length > 0,
      actionLabel: 'Manage Profile',
      onClick: onNavigateToSettings
    },
    {
      key: 'evidence',
      label: 'Evidence trail',
      caption: 'Your recorded actions form the evidence trail behind your record.',
      detail: activityCount > 0 ? `${activityCount} recorded action${activityCount === 1 ? '' : 's'}` : null,
      established: activityCount > 0,
      actionLabel: 'View Passport',
      onClick: onNavigateToPassport
    }
  ];

  const establishedCount = checklist.filter((item) => item.established).length;
  const ongoingCount = checklist.length;
  const readinessPercent = ongoingCount > 0 ? Math.round((establishedCount / ongoingCount) * 100) : 0;

  const missing = checklist.filter((item) => !item.established);
  const primaryFocus = missing.length > 0
    ? missing.find((item) => PRIORITY_ORDER.indexOf(item.key) !== -1 && !item.established) || missing[0]
    : null;

  const xpMetric = Number.isFinite(xp) ? xp.toLocaleString('en-US') : '—';
  const codeQualityMetric = Number.isFinite(codeQuality) ? `${codeQuality}/100` : '—';
  const lessonsMetric = completedLessons > 0 ? String(completedLessons) : (tracksStatus === 'loading' ? '—' : '0');

  const metrics = [
    { label: 'Rank Level', value: level ?? '—', tone: 'text-glow-purple' },
    { label: 'Total XP', value: xpMetric, tone: 'text-glow-cyan' },
    { label: 'Code Quality', value: codeQualityMetric, tone: 'text-glow-green' },
    { label: 'Lessons Completed', value: lessonsMetric, tone: '' }
  ];

  const strengths = [];
  if (missionCompleted) {
    strengths.push({
      icon: ShieldCheck,
      title: 'Verified engineering mission',
      detail: 'Executed an optimization mission that passed platform compiler benchmarks.'
    });
  }
  if (completedLessons > 0) {
    strengths.push({
      icon: GraduationCap,
      title: `Learning completed (${completedLessons} lesson${completedLessons === 1 ? '' : 's'})`,
      detail: `${completedLessons} of ${totalLessons} platform lessons marked complete.`
    });
  }
  if (stackItems.length >= 2) {
    strengths.push({
      icon: Code2,
      title: 'Declared engineering stack',
      detail: `${stackItems.length} technologies on record: ${stackItems.join(', ')}.`
    });
  }
  if (activityCount >= 2 && recentActivity.some((event) => event.activity_type === 'ide_pass')) {
    strengths.push({
      icon: Activity,
      title: 'Benchmark trace recorded',
      detail: 'Your activity trail includes a passed code benchmark run.'
    });
  }

  const assets = [
    {
      icon: Award,
      title: 'Engineering Passport',
      status: missionCompleted ? 'Verified record' : 'Active record',
      statusTone: missionCompleted ? 'tone-green' : 'tone-cyan',
      detail: `Identity, metrics and evidence trail — ${establishedCount} of ${ongoingCount} readiness components reflected.`,
      actionLabel: 'View Passport',
      onClick: onNavigateToPassport
    },
    {
      icon: Terminal,
      title: 'Engineering mission',
      status: missionCompleted ? 'Verified' : 'Not verified',
      statusTone: missionCompleted ? 'tone-green' : 'tone-yellow',
      detail: missionCompleted
        ? 'The platform mission passed verification and is recorded.'
        : 'Run the mission in the IDE to generate verified project evidence.',
      actionLabel: 'Open Mission IDE',
      onClick: onNavigateToIDE
    },
    {
      icon: BookOpen,
      title: 'Learning record',
      status: completedLessons > 0 ? `${completedLessons} completed` : 'No completions',
      statusTone: completedLessons > 0 ? 'tone-green' : 'tone-dim',
      detail: totalLessons > 0
        ? `${completedLessons} of ${totalLessons} platform lessons completed.`
        : 'Track lesson progression to build your learning record.',
      actionLabel: 'Continue Learning',
      onClick: onNavigateToLearn
    },
    {
      icon: UserRound,
      title: 'Developer profile',
      status: profileFullName ? 'Complete' : 'Incomplete',
      statusTone: profileFullName ? 'tone-green' : 'tone-yellow',
      detail: profileFullName
        ? `${profileFullName}${country ? ` · ${country}` : ''} · ${learningTrack || 'no track'}.`
        : 'Add your name and details to complete your developer profile.',
      actionLabel: 'Manage Profile',
      onClick: onNavigateToSettings
    }
  ];

  const primaryAction = primaryFocus
    ? primaryFocus
    : {
        label: 'Continue Learning',
        caption: 'All core readiness components are established — deepening your track keeps the record strong.',
        detail: null,
        established: true,
        actionLabel: 'Continue Learning',
        onClick: onNavigateToLearn
      };

  const secondaryActions = [
    { label: 'Continue Learning', icon: BookOpen, onClick: onNavigateToLearn },
    { label: 'Open Mission IDE', icon: Terminal, onClick: onNavigateToIDE },
    { label: 'View Passport', icon: Award, onClick: onNavigateToPassport },
    { label: 'Manage Profile', icon: UserRound, onClick: onNavigateToSettings }
  ];

  return (
    <div className="career-vault-root">
      <header className="career-header glass-panel">
        <Briefcase size={24} className="neon-purple" aria-hidden="true" />
        <div className="career-header__title">
          <h2 className="career-header__h2">Career Readiness Vault</h2>
          <p>
            A structured view of the engineering preparation recorded on this platform — what you have,
            what proves it, what is missing, and what to do next.
          </p>
        </div>
        <div className="career-header__chips">
          <div className="career-chip font-mono" title="Readiness records established from verified platform data">
            <CheckCircle2 size={14} className="neon-green" aria-hidden="true" />
            {establishedCount} / {ongoingCount} components established
          </div>
          {primaryFocus && (
            <div className="career-chip career-chip--focus font-mono" title="Suggested next focus">
              <Compass size={14} className="neon-cyan" aria-hidden="true" />
              Next: {primaryFocus.label}
            </div>
          )}
        </div>
      </header>

      <section className="career-metrics" aria-label="Career metrics">
        {metrics.map((metric) => (
          <div className="career-metric glass-panel" key={metric.label}>
            <div className="career-metric__value font-mono">
              <span className={metric.tone || undefined}>{metric.value}</span>
            </div>
            <div className="career-metric__label">{metric.label}</div>
          </div>
        ))}
      </section>

      <section className="career-section glass-panel">
        <h3 className="section-title">Career Readiness Checklist</h3>
        <p className="career-section__intro">
          Six core preparation components tracked from platform data. Each is either established or still
          missing — no automatic readiness score is applied.
        </p>
        <div className="career-checklist-progress">
          <ProgressBar value={readinessPercent} label={`${establishedCount} of ${ongoingCount} components established`} />
          <span className="career-checklist-progress__label font-mono">
            {establishedCount} of {ongoingCount} established
          </span>
        </div>
        <ul className="career-checklist">
          {checklist.map((item) => (
            <li className={`career-checklist-row ${item.established ? 'established' : 'missing'}`} key={item.key}>
              <span className="career-checklist-row__status" aria-hidden="true">
                {item.established ? (
                  <CheckCircle2 size={18} className="neon-green" />
                ) : (
                  <Circle size={18} className="tone-dim" />
                )}
              </span>
              <div className="career-checklist-row__body">
                <div className="career-checklist-row__head">
                  <span className="career-checklist-row__label">{item.label}</span>
                  <span className={`career-checklist-row__state font-mono ${item.established ? 'state-established' : 'state-missing'}`}>
                    {item.established ? 'ESTABLISHED' : 'MISSING'}
                  </span>
                </div>
                <p className="career-checklist-row__caption">{item.caption}</p>
                {item.detail && <p className="career-checklist-row__detail font-mono">{item.detail}</p>}
              </div>
              {!item.established && item.onClick && (
                <button type="button" className="career-link-btn font-mono" onClick={item.onClick}>
                  {item.actionLabel} <ArrowRight size={14} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="career-section glass-panel">
        <h3 className="section-title">Recommended Next Action</h3>
        <div className="career-focus-banner">
          <div className="career-focus-banner__icon" aria-hidden="true">
            <Target size={22} />
          </div>
          <div className="career-focus-banner__body">
            <div className="career-focus-banner__heading">
              {primaryFocus.established ? 'All core components established' : primaryFocus.label}
            </div>
            <p className="career-focus-banner__caption">
              {primaryFocus.caption ||
                'Everything foundational is in place. Continue working to keep your record current.'}
            </p>
          </div>
          <button type="button" className="neon-btn font-sans" onClick={primaryAction.onClick}>
            {primaryAction.actionLabel || primaryAction.label} <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
        <div className="career-secondary-actions">
          {secondaryActions.map((action) => (
            <button
              type="button"
              className="career-secondary-btn font-mono"
              key={action.label}
              onClick={action.onClick}
            >
              <action.icon size={15} aria-hidden="true" /> {action.label}
            </button>
          ))}
        </div>
      </section>

      <div className="career-layout">
        <div className="career-main">
          <section className="career-section glass-panel">
            <h3 className="section-title">Key Career Assets</h3>
            <div className="career-assets">
              {assets.map((asset) => (
                <div className="career-asset" key={asset.title}>
                  <div className="career-asset__icon" aria-hidden="true">
                    <asset.icon size={18} />
                  </div>
                  <div className="career-asset__body">
                    <div className="career-asset__head">
                      <span className="career-asset__title">{asset.title}</span>
                      <span className={`career-asset__status ${asset.statusTone} font-mono`}>{asset.status}</span>
                    </div>
                    <p className="career-asset__detail">{asset.detail}</p>
                  </div>
                  {asset.onClick && (
                    <button type="button" className="career-link-btn font-mono" onClick={asset.onClick}>
                      {asset.actionLabel} <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="career-section glass-panel">
            <h3 className="section-title">Evidence & Engineering Journey</h3>
            {summaryStatus === 'loading' ? (
              <div className="career-skeletons" aria-hidden="true">
                <Skeleton height="48px" />
                <Skeleton height="48px" />
              </div>
            ) : summaryStatus === 'error' || summaryStatus === 'skipped' ? (
              <StatePanel
                variant={summaryStatus === 'error' ? 'error' : 'empty'}
                title="Activity trail unavailable"
                message="Your identity and readiness components are still displayed above."
              />
            ) : recentActivity.length === 0 ? (
              <StatePanel
                variant="empty"
                title="No recorded activity yet"
                message="Actions you complete across Learning, Mission IDE and Logic Sandbox will appear here as evidence."
              />
            ) : (
              <ol className="career-timeline" aria-label="Recent engineering activity">
                {recentActivity.slice(0, 6).map((event, i) => {
                  const meta = ACTIVITY_META[event.activity_type] || {
                    icon: ScrollText,
                    tone: 'tone-dim',
                    label: event.activity_type
                  };
                  const Icon = meta.icon;
                  return (
                    <li className="career-timeline__item" key={`${event.activity_type}-${i}`}>
                      <span className={`career-timeline__dot ${meta.tone}`} aria-hidden="true">
                        <Icon size={14} />
                      </span>
                      <div className="career-timeline__body">
                        <div className="career-timeline__head">
                          <span className="career-timeline__label font-mono">{meta.label}</span>
                          <time className="career-timeline__time font-mono">{timeAgo(event.timestamp)}</time>
                        </div>
                        <p className="career-timeline__desc">{event.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <div className="career-sidebar">
          <section className="career-section glass-panel">
            <h3 className="section-title">Current Strengths</h3>
            {strengths.length === 0 ? (
              <StatePanel
                variant="empty"
                title="No notable strengths yet"
                message="Completed lessons and verified missions will appear here as evidence-backed strengths."
              />
            ) : (
              <ul className="career-strengths">
                {strengths.map((strength) => (
                  <li className="career-strength" key={strength.title}>
                    <span className="career-strength__icon" aria-hidden="true">
                      <strength.icon size={16} />
                    </span>
                    <div>
                      <div className="career-strength__title">{strength.title}</div>
                      <p className="career-strength__detail">{strength.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="career-section glass-panel">
            <h3 className="section-title">Interview & Portfolio Preparation</h3>
            <p className="career-section__intro">
              The platform does not yet record interview practice, resumes, or portfolios. Preparation in
              these areas is currently not measured.
            </p>
            <div className="career-unsupported-list">
              <div className="career-unsupported-item font-mono">
                <span className="tone-dim">INTERVIEW PREP</span>
                <span className="state-missing">NOT SUPPORTED</span>
              </div>
              <div className="career-unsupported-item font-mono">
                <span className="tone-dim">RESUME EXPORT</span>
                <span className="state-missing">NOT SUPPORTED</span>
              </div>
              <div className="career-unsupported-item font-mono">
                <span className="tone-dim">PORTFOLIO</span>
                <span className="state-missing">NOT SUPPORTED</span>
              </div>
            </div>
            <p className="career-section__note">
              Build portable evidence today by completing lessons and verified missions — those records feed
              your passport and evidence sheet.
            </p>
          </section>

          <section className="career-section glass-panel">
            <h3 className="section-title">Career Evidence Sheet</h3>
            <p className="career-section__intro">
              A print-ready summary compiled only from your verified platform record.
            </p>
            <div className="career-sheet career-sheet-print" aria-label="Career evidence sheet">
              <div className="career-sheet__header">
                <div className="career-sheet__name">{profileFullName || user.username || 'Atlas Developer'}</div>
                <div className="career-sheet__meta font-mono">
                  {[user.role, learningTrack].filter(Boolean).join(' · ')}
                </div>
                {careerGoal && <div className="career-sheet__goal">{careerGoal}</div>}
              </div>
              <div className="career-sheet__metrics font-mono">
                {(Number.isFinite(level) || Number.isFinite(xp)) && (
                  <span>LV.{level ?? '—'} · {xpMetric} XP</span>
                )}
                {Number.isFinite(codeQuality) && <span>Code quality {codeQuality}/100</span>}
                {totalLessons > 0 && <span>{completedLessons}/{totalLessons} lessons</span>}
              </div>
              <div className="career-sheet__section">
                <div className="career-sheet__section-title font-mono">RECORDED COMPONENTS</div>
                <ul className="career-sheet__list">
                  {checklist.map((item) => (
                    <li className="font-mono" key={item.key}>
                      {item.established ? '✔' : '✖'} {item.label}
                    </li>
                  ))}
                </ul>
              </div>
              {stackItems.length > 0 && (
                <div className="career-sheet__section">
                  <div className="career-sheet__section-title font-mono">DECLARED STACK</div>
                  <p className="font-mono">{stackItems.join(', ')}{experience ? ` · ${prettyExperience(experience)}` : ''}</p>
                </div>
              )}
              <div className="career-sheet__footer font-mono">
                Compiled from your recorded Atlas platform record · {new Date().toLocaleDateString()}
              </div>
            </div>
            <button type="button" className="neon-btn font-sans career-sheet__print-btn" onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" /> Export to Print / PDF
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}