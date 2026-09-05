import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  TriangleAlert,
  ShieldCheck,
  Code2,
  Activity,
  FolderOpen,
  Timer,
  MessageSquare,
  UserCheck,
  ListChecks
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

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

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

function prettyGoalType(type) {
  const map = {
    daily_lessons: 'Lessons',
    daily_missions: 'Missions',
    daily_logic: 'Logic tasks',
    daily_time: 'Study time',
    weekly_lessons: 'Lessons (weekly)',
    weekly_missions: 'Missions (weekly)',
    weekly_logic: 'Logic (weekly)',
    weekly_xp: 'XP (weekly)'
  };
  return map[type] || type.replace(/_/g, ' ');
}

function goalValue(type, value) {
  if (type === 'daily_time') return formatDuration(value);
  return String(value);
}

export default function Passport({ user, profile, missionCompleted, accessToken }) {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | skipped

  useEffect(() => {
    if (!accessToken) {
      setStatus('skipped');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/dashboard/summary', { token: accessToken });
        if (!res.ok) throw new Error('Failed to load passport summary.');
        const data = await res.json();
        if (!cancelled) {
          setSummary(data);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const summaryUser = summary?.user;
  const summaryProfile = summary?.profile;

  const name = profile?.full_name || summaryProfile?.full_name || user.username || 'Architect';
  const avatarFallback = (name || 'A')[0]?.toUpperCase() || 'A';
  const avatar = profile?.avatar || summaryProfile?.avatar || null;
  const username = user.username || summaryUser?.username || null;
  const role = user.role || summaryUser?.role || null;
  const learningTrack = profile?.learning_track || summaryProfile?.learning_track || null;
  const careerGoal = profile?.career_goal || summaryProfile?.career_goal || null;
  const experience = profile?.experience || null;
  const country = profile?.country || null;
  const timezone = profile?.timezone || null;

  const xp = user.xp ?? summaryUser?.xp ?? 0;
  const level = user.level ?? summaryUser?.level ?? null;
  const codeQuality = user.code_quality ?? summaryUser?.code_quality ?? null;

  const techStack = profile?.tech_stack || null;
  const stackItems = techStack
    ? techStack.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const todayPlan = summary?.todayPlan || [];
  const missionItem = todayPlan.find((item) => item.type === 'mission');
  const missionTitle = missionItem?.title || 'Scale Instagram Followers Search';
  const planCompleted = todayPlan.filter((item) => item.completed === 1).length;
  const planTotal = todayPlan.length;
  const todayProgress = summary?.todayProgress ?? (planTotal > 0 ? Math.round((planCompleted / planTotal) * 100) : 0);

  const recentActivity = summary?.recentActivity || [];
  const dailyGoals = summary?.dailyGoals || [];
  const weeklyGoals = summary?.weeklyGoals || [];
  const continueCoding = summary?.continueCoding || null;

  let sessionFile = null;
  if (continueCoding?.editor_state) {
    const raw = continueCoding.editor_state;
    const parsed = typeof raw === 'string' ? (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })() : raw;
    sessionFile = parsed?.selectedFile || null;
  }

  const xpMetric = Number.isFinite(xp) ? xp.toLocaleString('en-US') : '—';
  const codeQualityMetric = Number.isFinite(codeQuality) ? `${codeQuality}/100` : '—';

  const metrics = [
    { label: 'Rank Level', value: level ?? '—', tone: 'text-glow-purple' },
    { label: 'Total XP', value: xpMetric, tone: 'text-glow-cyan' },
    { label: 'Code Quality', value: codeQualityMetric, tone: 'text-glow-green' },
    { label: 'Missions Verified', value: missionCompleted ? 1 : 0, tone: '' }
  ];

  const summaryUnavailable = status === 'error' || status === 'skipped';

  return (
    <div className="passport-root">
      <header className="passport-header glass-panel">
        <div className="profile-badge">
          <div className="passport-avatar" aria-hidden="true">
            {avatar || avatarFallback}
          </div>
          <div className="profile-info">
            <div className="passport-name-row">
              <h1 className="passport-name">{name}</h1>
              {username && (
                <span className="passport-verified-chip" title="Profile registered and verified on the platform">
                  <ShieldCheck size={13} aria-hidden="true" /> @{username}
                </span>
              )}
            </div>
            <p className="passport-title font-mono">
              {role ? `${role}${careerGoal ? ` · ${careerGoal}` : ''}` : (learningTrack || 'Atlas Developer')}
            </p>
            <p className="passport-meta font-mono">
              {learningTrack && <span>Track: {learningTrack}</span>}
              {experience && <span>Experience: {experience}</span>}
              {country && <span>{country}{timezone ? ` (${timezone})` : ''}</span>}
            </p>
          </div>
        </div>
      </header>

      <section className="passport-metrics" aria-label="Key metrics">
        {metrics.map((m) => (
          <div className="passport-metric glass-panel" key={m.label}>
            <div className="passport-metric__value font-mono">
              <span className={m.tone || undefined}>{m.value}</span>
            </div>
            <div className="passport-metric__label">{m.label}</div>
          </div>
        ))}
      </section>

      <div className="passport-layout">
        <div className="passport-main">
          <section className="passport-section glass-panel">
            <h3 className="section-title">Verified Engineering Record</h3>
            <div className="accomplishment-list">
              {missionCompleted ? (
                <div className="accomplishment-item verified">
                  <div className="item-header">
                    <div className="title-row">
                      <CheckCircle2 size={16} className="neon-green" aria-hidden="true" />
                      <h4>{missionTitle}</h4>
                    </div>
                    <span className="status-pill status-verified font-mono">VERIFIED</span>
                  </div>
                  <p className="item-desc">
                    Mission completed — execution passed the compiler benchmark assertions and the run was
                    recorded to the platform registry.
                  </p>
                  <div className="proof-footer font-mono">
                    {codeQuality !== null
                      ? `EVIDENCE: mission execution record · code quality ${codeQuality}/100`
                      : 'EVIDENCE: mission execution record'}
                  </div>
                </div>
              ) : (
                <div className="accomplishment-item pending">
                  <div className="item-header">
                    <div className="title-row">
                      <TriangleAlert size={16} className="neon-yellow" aria-hidden="true" />
                      <h4>{missionTitle}</h4>
                    </div>
                    <span className="status-pill status-pending font-mono">IN PROGRESS</span>
                  </div>
                  <p className="item-desc">
                    This optimization mission is currently in progress. Implement the index patterns in the
                    mission editor and execute the compiler benchmark to verify performance compliance.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="passport-section glass-panel">
            <h3 className="section-title">Engineering Journey</h3>
            {summaryUnavailable ? (
              <StatePanel
                variant={status === 'error' ? 'error' : 'empty'}
                title={status === 'error' ? 'Could not load activity' : 'Activity summary unavailable'}
                message={
                  status === 'error'
                    ? 'The activity feed could not be retrieved. Your identity and metrics are still displayed.'
                    : 'Sign in to load your recent engineering activity.'
                }
              />
            ) : status === 'loading' ? (
              <div className="passport-skeletons" aria-hidden="true">
                <Skeleton height="52px" />
                <Skeleton height="52px" />
                <Skeleton height="52px" />
              </div>
            ) : recentActivity.length === 0 ? (
              <StatePanel
                variant="empty"
                title="No activity yet"
                message="Your engineering actions will appear here once you start working."
              />
            ) : (
              <ol className="passport-timeline" aria-label="Recent engineering activity">
                {recentActivity.map((event, i) => {
                  const meta = ACTIVITY_META[event.activity_type] || {
                    icon: Code2,
                    tone: 'tone-dim',
                    label: event.activity_type
                  };
                  const Icon = meta.icon;
                  return (
                    <li className="passport-timeline__item" key={`${event.activity_type}-${i}`}>
                      <span className={`passport-timeline__dot ${meta.tone}`} aria-hidden="true">
                        <Icon size={14} />
                      </span>
                      <div className="passport-timeline__body">
                        <div className="passport-timeline__head">
                          <span className="passport-timeline__label font-mono">{meta.label}</span>
                          <time className="passport-timeline__time font-mono">{timeAgo(event.timestamp)}</time>
                        </div>
                        <p className="passport-timeline__desc">{event.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <div className="passport-sidebar">
          <section className="passport-section glass-panel stats-list">
            <h3 className="section-title">Ecosystem Metrics</h3>
            <div className="mini-stat font-mono">
              <span className="label">RANK LEVEL:</span>
              <span className="value text-glow-purple">{level ?? '—'}</span>
            </div>
            <div className="mini-stat font-mono">
              <span className="label">TOTAL XP:</span>
              <span className="value text-glow-cyan">{xpMetric}</span>
            </div>
            <div className="mini-stat font-mono">
              <span className="label">CODE QUALITY:</span>
              <span className="value text-glow-green">{codeQualityMetric}</span>
            </div>
            <div className="mini-stat font-mono">
              <span className="label">MISSIONS VERIFIED:</span>
              <span className="value">{missionCompleted ? 1 : 0}</span>
            </div>
            {planTotal > 0 && (
              <div className="mini-stat-vertical">
                <div className="mini-stat font-mono">
                  <span className="label">TODAY&apos;S PLAN:</span>
                  <span className="value">{planCompleted} / {planTotal}</span>
                </div>
                <ProgressBar value={todayProgress} aria-label={`Today's plan ${todayProgress}% complete`} />
              </div>
            )}
          </section>

          <section className="passport-section glass-panel">
            <h3 className="section-title">Declared Engineering Stack</h3>
            {stackItems.length > 0 ? (
              <>
                <div className="skills-grid font-mono">
                  {stackItems.map((skill) => (
                    <span className="skill-badge" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
                {experience && (
                  <p className="stack-note font-mono">Reported experience level: {experience}</p>
                )}
              </>
            ) : (
              <StatePanel
                variant="empty"
                title="No stack declared"
                message="Add your tech stack in Profile Settings to build out this section."
              />
            )}
          </section>

          <section className="passport-section glass-panel">
            <h3 className="section-title">Active Engineering Session</h3>
            {summaryUnavailable ? (
              <StatePanel
                variant={status === 'error' ? 'error' : 'empty'}
                title="Session unavailable"
                message="Sign in to view your active engineering session."
              />
            ) : status === 'loading' ? (
              <div className="passport-skeletons" aria-hidden="true">
                <Skeleton height="40px" />
                <Skeleton height="40px" />
              </div>
            ) : continueCoding ? (
              <div className="session-box">
                <div className="session-row font-mono">
                  <FolderOpen size={14} className="neon-cyan" aria-hidden="true" />
                  <span className="label">TASK:</span>
                  <span className="value">{missionTitle}</span>
                </div>
                <div className="session-row font-mono">
                  <Code2 size={14} className="neon-cyan" aria-hidden="true" />
                  <span className="label">FILE:</span>
                  <span className="value">{sessionFile || '—'}</span>
                </div>
                <div className="session-row font-mono">
                  <Timer size={14} className="neon-cyan" aria-hidden="true" />
                  <span className="label">TIME SPENT:</span>
                  <span className="value">{formatDuration(continueCoding.time_spent)}</span>
                </div>
                <div className="session-row font-mono">
                  <Activity size={14} className="neon-cyan" aria-hidden="true" />
                  <span className="label">LAST ACTIVE:</span>
                  <span className="value">{timeAgo(continueCoding.last_active)}</span>
                </div>
              </div>
            ) : (
              <StatePanel
                variant="empty"
                title="No active session"
                message="Your latest mission session will appear here."
              />
            )}
          </section>

          {(status === 'ready' && (dailyGoals.length > 0 || weeklyGoals.length > 0)) && (
            <section className="passport-section glass-panel">
              <h3 className="section-title">Current Goals</h3>
              <div className="goal-list">
                {dailyGoals.map((goal) => (
                  <div className="goal-row font-mono" key={goal.goal_type}>
                    <span className="goal-row__name">{prettyGoalType(goal.goal_type)}</span>
                    <span className="goal-row__value">
                      {goalValue(goal.goal_type, goal.current_value)} / {goalValue(goal.goal_type, goal.target_value)}
                    </span>
                  </div>
                ))}
                {dailyGoals.length > 0 && weeklyGoals.length > 0 && (
                  <div className="goal-divider" role="separator" aria-hidden="true" />
                )}
                {weeklyGoals.map((goal) => (
                  <div className="goal-row font-mono" key={goal.goal_type}>
                    <span className="goal-row__name">{prettyGoalType(goal.goal_type)}</span>
                    <span className="goal-row__value">
                      {goalValue(goal.goal_type, goal.current_value)} / {goalValue(goal.goal_type, goal.target_value)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}