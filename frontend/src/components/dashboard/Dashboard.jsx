import React, { useState, useEffect } from 'react';
import {
  Play,
  Terminal,
  Compass,
  Award,
  Briefcase,
  Settings,
  Flame,
  Bell,
  X,
  RefreshCw,
  CheckCircle2,
  Clock,
  Target
} from 'lucide-react';
import { apiFetch } from '../../api/client';
import { Button, StatePanel, Skeleton } from '../../components/shared';

const TRACK_LABELS = {
  android: 'Android Development',
  backend: 'Backend Development',
  web: 'Frontend Development',
  devops: 'DevOps & SRE',
  aiml: 'Artificial Intelligence',
  dsa: 'Data Structures & Algorithms'
};

const ACTIVITY_TYPE_META = {
  onboard: { label: 'Onboard', color: 'var(--neon-blue)' },
  chat: { label: 'Mentor Chat', color: 'var(--neon-purple)' },
  ide_pass: { label: 'Mission Pass', color: 'var(--neon-green)' },
  ide_fail: { label: 'Mission Retry', color: 'var(--neon-red)' },
  plan_item: { label: 'Plan Task', color: 'var(--neon-lime)' },
  lesson: { label: 'Lesson', color: 'var(--neon-cyan)' },
  logic: { label: 'Logic', color: 'var(--neon-cyan)' },
  mission: { label: 'Mission', color: 'var(--neon-purple)' }
};

const PLAN_TYPE_LABELS = {
  lesson: 'Lesson',
  logic: 'Logic',
  mission: 'Mission',
  reflection: 'Reflection'
};

function ProgressBar({ value, label, color = 'var(--neon-cyan)', thickness = '8px' }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div
      className="atlas-progress"
      style={{ height: thickness }}
      role="progressbar"
      aria-label={label || 'Progress'}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${clamped}% ${label || 'complete'}`}
    >
      <div
        className="atlas-progress__fill"
        style={{ width: `${clamped}%`, background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  );
}

function formatSeconds(seconds) {
  const mins = Math.round((seconds || 0) / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatActivityTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startOfToday - startOfDay) / 86400000);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (dayDiff === 0) return `Today · ${time}`;
  if (dayDiff === 1) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`;
}

function prettyKey(key) {
  if (!key) return '';
  return key
    .split('_')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function Dashboard({
  accessToken,
  missionCompleted,
  onNavigateToIDE,
  onNavigateToPractice,
  onNavigateToPassport,
  onNavigateToCareer,
  onNavigateToSettings
}) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [data, setData] = useState(null);
  const [plan, setPlan] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [recs, setRecs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [analyticsTab, setAnalyticsTab] = useState('hours');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [notifSearch, setNotifSearch] = useState('');
  const [showPinEditor, setShowPinEditor] = useState(false);
  const [planBusyId, setPlanBusyId] = useState(null);
  const [regenBusy, setRegenBusy] = useState(false);

  // Fetch Dashboard Summary Data
  const loadDashboardData = async () => {
    try {
      const res = await apiFetch('/dashboard/summary', { token: accessToken });
      if (res.ok) {
        const json = await res.json();
        setLoadError(null);
        setData(json);
        setPlan(json.todayPlan || []);
        setGoals((json.dailyGoals || []).concat(json.weeklyGoals || []));
        setNotifs(json.notifications || []);
        setRecs(json.recommendations || []);
        setActivity(json.recentActivity || []);
        setCalendar(json.calendarEvents || []);
        setPinned(json.pinnedActions || []);
        setAnalytics(json.analytics || null);
      } else {
        setLoadError('Failed to synchronize dashboard workspace.');
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setLoadError('Failed to synchronize dashboard workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadDashboardData();
    }
  }, [accessToken]);

  // Heartbeat loop (runs every 30s to update study duration)
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(async () => {
      try {
        await apiFetch('/dashboard/heartbeat', {
          method: 'POST',
          token: accessToken
        });
        setGoals(prev => prev.map(g => {
          if (g.goal_type === 'daily_time') {
            return { ...g, current_value: g.current_value + 30 };
          }
          return g;
        }));
      } catch (err) {
        console.error('Heartbeat sync failed:', err);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [accessToken]);

  // Toggle Learning Plan item complete status
  const handleTogglePlanItem = async (itemId, currentCompleted) => {
    if (planBusyId) return;
    setPlanBusyId(itemId);
    try {
      const res = await apiFetch('/dashboard/plan/toggle', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({ itemId, completed: !currentCompleted })
      });
      if (res.ok) {
        const json = await res.json();
        setPlan(json.todayPlan);
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPlanBusyId(null);
    }
  };

  // Regenerate Today's Learning Plan
  const handleRegeneratePlan = async () => {
    setRegenBusy(true);
    try {
      const res = await apiFetch('/dashboard/regenerate-plan', {
        method: 'POST',
        token: accessToken
      });
      if (res.ok) {
        const json = await res.json();
        setPlan(json.todayPlan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegenBusy(false);
    }
  };

  // Notification Operations
  const handleMarkNotifRead = async (id) => {
    try {
      const res = await apiFetch(`/dashboard/notifications/${id}/read`, {
        method: 'POST',
        token: accessToken
      });
      if (res.ok) {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      const res = await apiFetch(`/dashboard/notifications/${id}`, {
        method: 'DELETE',
        token: accessToken
      });
      if (res.ok) {
        setNotifs(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Shortcut Pin Configuration Toggler
  const handleTogglePin = async (actionKey) => {
    const nextPinned = pinned.includes(actionKey)
      ? pinned.filter(p => p !== actionKey)
      : [...pinned, actionKey];
    try {
      const res = await apiFetch('/dashboard/preferences', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({ pinnedActions: nextPinned })
      });
      if (res.ok) {
        setPinned(nextPinned);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Loading state preserves page structure with skeletons ----
  if (loading || !data) {
    return (
      <div className="dashboard-root" aria-busy="true" aria-label="Loading dashboard">
        <div className="glass-panel" style={{ padding: '24px' }}>
          <Skeleton width="40%" height="28px" />
          <div style={{ marginTop: '12px' }}><Skeleton width="55%" height="14px" /></div>
        </div>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px' }}><Skeleton width="70%" height="20px" /><Skeleton width="90%" height="14px" style={{ marginTop: '12px' }} /></div>
          <div style={{ flex: '1 1 260px' }}><Skeleton width="60%" height="20px" /><Skeleton width="100%" height="10px" style={{ marginTop: '12px' }} /></div>
        </div>
        <div className="dashboard-grid">
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Skeleton width="100%" height="64px" />
            <Skeleton width="100%" height="52px" />
            <Skeleton width="100%" height="52px" />
            <Skeleton width="100%" height="52px" />
          </div>
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Skeleton width="100%" height="34px" />
            <Skeleton width="100%" height="34px" />
            <Skeleton width="100%" height="34px" />
            <Skeleton width="100%" height="34px" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="dashboard-root">
        <div className="glass-panel">
          <StatePanel
            variant="error"
            title="Dashboard Sync Failure"
            message={`${loadError} Try again to reload your overview.`}
            action={
              <Button
                variant="secondary"
                icon={<RefreshCw size={14} />}
                onClick={() => {
                  setLoadError(null);
                  setLoading(true);
                  loadDashboardData();
                }}
              >
                RETRY SYNC
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const { user: userStats, profile, todayProgress, streak } = data;
  const totalUnreadNotifs = notifs.filter(n => n.is_read === 0).length;

  const todayPlanCount = plan.filter(item => item.completed === 1).length;
  const nextPlanItem = plan.find(item => item.completed !== 1);
  const continueCoding = data.continueCoding;

  const actionMetadata = {
    ide: { label: 'Continue Mission', hint: 'Mission IDE', icon: <Terminal size={14} />, action: onNavigateToIDE },
    practice: { label: 'Logic Practice', hint: 'Sandbox challenges', icon: <Compass size={14} />, action: onNavigateToPractice },
    passport: { label: 'Engineering Passport', hint: 'Credentials & rank', icon: <Award size={14} />, action: onNavigateToPassport },
    career: { label: 'Career Prep Vault', hint: 'Interviews & resume', icon: <Briefcase size={14} />, action: onNavigateToCareer },
    settings: { label: 'Account Settings', hint: 'Profile & security', icon: <Settings size={14} />, action: onNavigateToSettings }
  };

  // Generate learning calendar items (28 grid blocks)
  const getCalendarCells = () => {
    const cells = [];
    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const match = calendar.find(e => e.event_date === dStr);
      cells.push({
        date: d,
        dateStr: dStr,
        active: !!match,
        details: match ? match.details : 'No study log recorded for this day.'
      });
    }
    return cells;
  };

  const calendarCells = getCalendarCells();
  const activeCalendarDays = calendarCells.filter(c => c.active).length;

  // Custom Interactive Analytics Chart Renderer (drawn using SVG)
  const getAnalyticsPoints = () => {
    if (!analytics) return { paths: '', points: [] };
    const values = analyticsTab === 'hours' ? analytics.weeklyHours : analytics.monthlyXp;
    if (!Array.isArray(values) || values.length < 2) return { paths: '', points: [] };
    const maxVal = Math.max(...values, 10);
    const height = 120;
    const width = 380;
    const points = values.map((val, idx) => {
      const x = (idx * (width / (values.length - 1))) + 10;
      const y = height - (val / maxVal * 90) - 10;
      return { x, y, value: val };
    });
    const paths = points.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    return { paths, points };
  };

  const chartMeta = getAnalyticsPoints();
  const chartValues = (analyticsTab === 'hours' ? analytics?.weeklyHours : analytics?.monthlyXp) || [];
  const chartPeak = chartValues.length ? Math.max(...chartValues) : null;

  const getTopicMastery = () => analytics?.topicMastery || [];

  // Filtered Notifications list
  const filteredNotifs = notifs.filter(n => {
    if (notifFilter !== 'all' && n.category !== notifFilter) return false;
    if (notifSearch.trim() && !n.title.toLowerCase().includes(notifSearch.toLowerCase()) && !n.message.toLowerCase().includes(notifSearch.toLowerCase())) return false;
    return true;
  });

  const trackLabel = profile?.learning_track ? (TRACK_LABELS[profile.learning_track] || prettyKey(profile.learning_track)) : null;

  const formatGoalName = (type) => {
    const names = {
      daily_lessons: 'Lessons Completed',
      daily_missions: 'Missions Finished',
      daily_logic: 'Logic Challenges Solved',
      daily_time: 'Active Focus Hours',
      weekly_lessons: 'Study 5 Lessons',
      weekly_missions: 'Solve 3 Missions',
      weekly_logic: 'Solve 20 Sandbox Issues',
      weekly_xp: 'Earn 2,000 Total XP'
    };
    return names[type] || prettyKey(type);
  };

  const getGoalPercent = (g) => {
    const percent = Math.round((g.current_value / g.target_value) * 100);
    return Math.min(percent, 100);
  };

  const formatGoalValue = (g) => {
    if (g.goal_type === 'daily_time') {
      const curMins = Math.round(g.current_value / 60);
      const tarMins = Math.round(g.target_value / 60);
      return `${curMins}m / ${tarMins}m`;
    }
    return `${g.current_value} / ${g.target_value}`;
  };

  const renderGoalList = (goalPrefix, color) => {
    const list = goals.filter(g => g.goal_type.startsWith(goalPrefix));
    if (list.length === 0) {
      return (
        <StatePanel
          variant="empty"
          title={`No ${goalPrefix === 'daily_' ? 'Daily' : 'Weekly'} Objectives`}
          message="Your objectives will appear here once they are created."
        />
      );
    }
    return list.map((g) => {
      const pct = getGoalPercent(g);
      return (
        <div key={g.goal_type}>
          <div className="goal-row">
            <span className="goal-row__label">{formatGoalName(g.goal_type)}</span>
            <span className="goal-row__value">{formatGoalValue(g)}</span>
          </div>
          <ProgressBar
            value={pct}
            label={formatGoalName(g.goal_type)}
            color={color}
            thickness="6px"
          />
        </div>
      );
    });
  };

  const renderContinueMetas = () => {
    if (continueCoding) {
      let selectedFile = null;
      try {
        const state = JSON.parse(continueCoding.editor_state || '{}');
        selectedFile = state.selectedFile || null;
      } catch {
        selectedFile = null;
      }
      return {
        title: selectedFile || `Resume ${prettyKey(continueCoding.activity_id || 'mission')}`,
        meta: [
          { label: 'Session time', value: formatSeconds(continueCoding.time_spent) },
          { label: 'Last active', value: timeAgo(continueCoding.last_active) }
        ]
      };
    }
    return {
      title: 'Start your first mission',
      meta: null
    };
  };

  const continueMeta = renderContinueMetas();
  const primaryCtaLabel = missionCompleted ? 'Review Mission' : 'Continue Mission';

  return (
    <div className="dashboard-root">
      {/* 1. Header / Welcome Area */}
      <header className="dashboard-header-row">
        <div>
          <h1 className="welcome-architect">
            {profile?.full_name || userStats.username}
          </h1>
          <p className="system-status">
            <span className="text-glow-cyan font-mono">{userStats.role || 'Engineer'}</span>
            {profile?.career_goal && <span> · {profile.career_goal}</span>}
            {trackLabel && <span> · {trackLabel}</span>}
          </p>
        </div>

        <div className="header-meta">
          {typeof streak === 'number' && (
            <span className="stat-chip">
              <Flame size={13} style={{ color: 'var(--neon-yellow)' }} aria-hidden="true" />
              <span className="font-mono">{streak} day streak</span>
            </span>
          )}
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="ctrl-btn load font-mono"
            aria-expanded={notifOpen}
            aria-controls="dashboard-notif-tray"
            aria-label={totalUnreadNotifs > 0 ? `Alerts, ${totalUnreadNotifs} unread` : 'Alerts'}
            style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '10px 14px' }}
          >
            <Bell size={15} />
            <span>Alerts</span>
            {totalUnreadNotifs > 0 && (
              <span className="notif-badge-pill" aria-label={`${totalUnreadNotifs} unread alerts`}>{totalUnreadNotifs}</span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Notification Overlay Tray */}
      {notifOpen && (
        <div
          id="dashboard-notif-tray"
          className="glass-panel fade-in notif-tray"
          role="dialog"
          aria-label="Security alerts and log"
        >
          <div className="notif-tray__head">
            <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff' }}>Security Alerts & Log</h3>
            <button onClick={() => setNotifOpen(false)} className="notif-tray__close" aria-label="Close alerts">
              <X size={16} />
            </button>
          </div>

          <div className="notif-tray__filters" role="group" aria-label="Filter alerts by category">
            {['all', 'system', 'achievement', 'mentor'].map(cat => (
              <button
                key={cat}
                onClick={() => setNotifFilter(cat)}
                aria-pressed={notifFilter === cat}
                className={`category-item-btn font-mono ${notifFilter === cat ? 'active' : ''}`}
                style={{ fontSize: '9px', padding: '4px 8px', textTransform: 'uppercase' }}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search alerts log..."
            value={notifSearch}
            onChange={e => setNotifSearch(e.target.value)}
            className="tech-input font-mono"
            aria-label="Search alerts"
            style={{ fontSize: '11px', padding: '8px', marginBottom: '12px', background: '#020204' }}
          />

          <div className="notif-tray__list">
            {filteredNotifs.length === 0 ? (
              <p className="font-mono text-center" style={{ fontSize: '11px', color: 'var(--text-dim)', padding: '20px' }}>No matching alerts found.</p>
            ) : (
              filteredNotifs.map(n => (
                <div key={n.id} className={`notif-item ${n.is_read ? '' : 'notif-item--unread'}`}>
                  <div className="notif-item__row">
                    <span className="font-sans notif-item__title">{n.title}</span>
                    <div className="notif-item__actions">
                      {n.is_read === 0 && (
                        <button onClick={() => handleMarkNotifRead(n.id)} className="font-mono" style={{ background: 'none', border: 'none', color: 'var(--neon-lime)', fontSize: '9px', cursor: 'pointer' }}>READ</button>
                      )}
                      <button onClick={() => handleDeleteNotif(n.id)} className="font-mono" style={{ background: 'none', border: 'none', color: 'var(--neon-red)', fontSize: '9px', cursor: 'pointer' }}>DEL</button>
                    </div>
                  </div>
                  <p className="font-sans notif-item__message">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. Continue Band — Primary action + today's plan progress */}
      <section className="glass-panel dash-continue" aria-label="Continue learning">
        <div className="dash-continue__action">
          <div className="dash-eyebrow">NEXT ACTION</div>
          <h2 className="dash-continue__title">{continueMeta.title}</h2>
          {continueCoding ? (
            <div className="dash-continue__badge-row">
              <span className="dash-badge">MISSION SESSION</span>
              <span className="dash-continue__meta">
                <Clock size={12} aria-hidden="true" /> {continueMeta.meta[0].value}
              </span>
              <span className="dash-continue__meta">{continueMeta.meta[1].value}</span>
            </div>
          ) : (
            <p className="dash-continue__sub">Launch the Mission IDE to begin your engineering mission.</p>
          )}
          <Button
            variant="accent"
            block
            className="dash-continue__cta"
            icon={<Play size={16} />}
            onClick={onNavigateToIDE}
          >
            {primaryCtaLabel}
          </Button>
        </div>

        <div className="dash-continue__plan">
          <div className="dash-eyebrow">TODAY'S PLAN</div>
          <div className="dash-continue__plan-count font-mono">
            {todayPlanCount} / {plan.length} tasks complete
          </div>
          <ProgressBar
            value={todayProgress}
            label="Today's plan"
            color="var(--neon-purple)"
            thickness="10px"
          />
          <div className="dash-continue__plan-note">
            {nextPlanItem ? (
              <>
                <span className="dash-continue__plan-next">Next up: </span>
                {nextPlanItem.title}
              </>
            ) : plan.length > 0 ? (
              'All plan tasks complete for today.'
            ) : (
              'No plan tasks for today yet.'
            )}
          </div>
        </div>
      </section>

      {/* 4. Main Dashboard Layout Grid */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="dashboard-col">
          {/* Statistics Bar */}
          <section className="glass-panel stats-grid" aria-label="Key statistics" style={{ padding: '20px' }}>
            <div className="stat-tile">
              <span className="stat-tile__label">LEVEL</span>
              <div className="stat-tile__value text-glow-purple">Lv. {userStats.level}</div>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__label">TOTAL XP</span>
              <div className="stat-tile__value text-glow-blue">{Number(userStats.xp || 0).toLocaleString()} XP</div>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__label">ENGINEERING ROLE</span>
              <div className="stat-tile__value stat-tile__value--text text-glow-green">{userStats.role || 'Jr Architect'}</div>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__label">CODE QUALITY</span>
              <div className="stat-tile__value text-glow-cyan">{userStats.code_quality}%</div>
            </div>
          </section>

          {/* Today's Engineering Plan */}
          <section className="glass-panel" aria-labelledby="plan-panel-title">
            <div className="panel-caption">
              <div>
                <h3 id="plan-panel-title" className="panel-caption__title">Today's Engineering Plan</h3>
                <p className="panel-caption__sub">Personalized roadmap tasks matching 1 hour available study time.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                loading={regenBusy}
                onClick={handleRegeneratePlan}
                icon={<RefreshCw size={12} />}
              >
                Regenerate
              </Button>
            </div>

            {plan.length === 0 ? (
              <StatePanel
                variant="empty"
                title="No Plan Tasks"
                message="Your personalized plan has not been generated for today yet."
                action={
                  <Button variant="secondary" size="sm" loading={regenBusy} onClick={handleRegeneratePlan} icon={<RefreshCw size={12} />}>
                    Generate Plan
                  </Button>
                }
              />
            ) : (
              <div className="plan-list">
                {plan.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className={`plan-item ${item.completed === 1 ? 'plan-item--done' : ''}`}
                    onClick={() => handleTogglePlanItem(item.id, item.completed === 1)}
                    disabled={planBusyId === item.id}
                    aria-pressed={item.completed === 1}
                    aria-label={`${item.completed === 1 ? 'Mark as not complete' : 'Mark as complete'}: ${item.title}`}
                  >
                    <span className="plan-item__check">
                      <CheckCircle2 size={16} aria-hidden="true" />
                    </span>
                    <span className="plan-item__body">
                      <span className="plan-item__type">{PLAN_TYPE_LABELS[item.type] || item.type}</span>
                      <span className="plan-item__title">{item.title}</span>
                    </span>
                    <span className="plan-item__duration font-mono">{item.duration}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Progress Analytics Interactive SVG */}
          {analytics && (
            <section className="glass-panel" aria-labelledby="analytics-panel-title">
              <div className="panel-caption">
                <div>
                  <h3 id="analytics-panel-title" className="panel-caption__title">Ecosystem Progress Analytics</h3>
                  <p className="panel-caption__sub">Learning metrics over time.</p>
                </div>
                <div className="analytics-tabs" role="group" aria-label="Chart metric">
                  <button
                    onClick={() => setAnalyticsTab('hours')}
                    aria-pressed={analyticsTab === 'hours'}
                    className={`font-mono ${analyticsTab === 'hours' ? 'text-glow-cyan' : ''}`}
                    style={{ background: 'none', border: 'none', fontSize: '9px', padding: '4px 8px', color: analyticsTab === 'hours' ? '#fff' : 'var(--text-dim)', cursor: 'pointer' }}
                  >
                    HOURS
                  </button>
                  <button
                    onClick={() => setAnalyticsTab('xp')}
                    aria-pressed={analyticsTab === 'xp'}
                    className={`font-mono ${analyticsTab === 'xp' ? 'text-glow-cyan' : ''}`}
                    style={{ background: 'none', border: 'none', fontSize: '9px', padding: '4px 8px', color: analyticsTab === 'xp' ? '#fff' : 'var(--text-dim)', cursor: 'pointer' }}
                  >
                    XP
                  </button>
                </div>
              </div>

              <div className="chart-canvas" aria-hidden="true">
                <svg width="100%" height="100%" viewBox="0 0 380 120" focusable="false">
                  <line x1="10" y1="20" x2="370" y2="20" stroke="rgba(255,255,255,0.02)" strokeDasharray="3" />
                  <line x1="10" y1="60" x2="370" y2="60" stroke="rgba(255,255,255,0.02)" strokeDasharray="3" />
                  <line x1="10" y1="100" x2="370" y2="100" stroke="rgba(255,255,255,0.03)" />

                  {analyticsTab === 'hours' ? (
                    chartMeta.points.map((pt, idx) => (
                      <g key={idx}>
                        <rect
                          x={pt.x - 6}
                          y={pt.y}
                          width="12"
                          height={110 - pt.y}
                          fill="rgba(0, 229, 255, 0.2)"
                          stroke="var(--neon-cyan)"
                          strokeWidth="1"
                          rx="2"
                        />
                        <text x={pt.x} y={pt.y - 4} fill="#fff" fontSize="8" textAnchor="middle" className="font-mono">{pt.value}h</text>
                      </g>
                    ))
                  ) : (
                    <>
                      <path d={chartMeta.paths} fill="none" stroke="var(--neon-purple)" strokeWidth="2" style={{ filter: 'var(--glow-purple)' }} />
                      {chartMeta.points.map((pt, idx) => (
                        <g key={idx}>
                          <circle cx={pt.x} cy={pt.y} r="3.5" fill="#fff" stroke="var(--neon-purple)" strokeWidth="1.5" />
                          <text x={pt.x} y={pt.y - 6} fill="#fff" fontSize="7" textAnchor="middle" className="font-mono">{pt.value}</text>
                        </g>
                      ))}
                    </>
                  )}
                </svg>
              </div>
              <p className="sr-only">
                {analyticsTab === 'hours'
                  ? `Bar chart of weekly focus hours${chartPeak != null ? `. Peak: ${chartPeak} hours` : ''}.`
                  : `Line chart of monthly XP${chartPeak != null ? `. Peak: ${chartPeak} XP` : ''}.`}
              </p>
            </section>
          )}

          {/* Recent Activity Timeline */}
          <section className="glass-panel" aria-labelledby="activity-panel-title">
            <h3 id="activity-panel-title" className="panel-caption__title">Recent Activity</h3>
            {activity.length === 0 ? (
              <StatePanel
                variant="empty"
                title="No Activity Yet"
                message="Complete a plan task or run your first mission to start building your learning log."
                action={
                  <Button variant="secondary" size="sm" icon={<Play size={12} />} onClick={onNavigateToIDE}>
                    Start a Mission
                  </Button>
                }
              />
            ) : (
              <ul className="timeline" style={{ textAlign: 'left' }}>
                {activity.map((act, idx) => {
                  const meta = ACTIVITY_TYPE_META[act.activity_type] || { label: act.activity_type, color: 'var(--text-dim)' };
                  return (
                    <li key={idx} className="timeline-item">
                      <span className="timeline-item__dot" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} aria-hidden="true" />
                      <div className="timeline-item__body">
                        <div className="timeline-item__head">
                          <span className="timeline-item__type" style={{ color: meta.color }}>{meta.label}</span>
                          <time className="timeline-item__time font-mono" dateTime={act.timestamp}>
                            {formatActivityTime(act.timestamp)}
                          </time>
                        </div>
                        <p className="timeline-item__desc">{act.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-col">
          {/* Daily Goals */}
          <section className="glass-panel" aria-labelledby="daily-goals-title">
            <h3 id="daily-goals-title" className="panel-caption__title">Daily Objectives</h3>
            <div className="goal-list">{renderGoalList('daily_', 'var(--neon-cyan)')}</div>
          </section>

          {/* Weekly Goals */}
          <section className="glass-panel" aria-labelledby="weekly-goals-title">
            <h3 id="weekly-goals-title" className="panel-caption__title">Weekly Objectives</h3>
            <div className="goal-list">{renderGoalList('weekly_', 'var(--neon-purple)')}</div>
          </section>

          {/* Recommended next steps */}
          <section className="glass-panel" aria-labelledby="recs-panel-title">
            <h3 id="recs-panel-title" className="panel-caption__title">Recommended Steps</h3>
            {recs.length === 0 ? (
              <StatePanel
                variant="empty"
                title="No Recommendations"
                message="Personalized steps will appear as your platform learns from your work."
              />
            ) : (
              <div className="rec-list">
                {recs.map(r => (
                  <div key={r.id} className="rec-item">
                    <div className="rec-item__body">
                      <h4 className="rec-item__title">{r.title}</h4>
                      <span className="rec-item__type font-mono">{r.type.toUpperCase()}</span>
                      <span className="rec-item__meta font-mono">{r.estimated_time} | {r.difficulty}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions & Pins Toggler */}
          <section className="glass-panel" aria-labelledby="shortcuts-panel-title">
            <div className="panel-caption">
              <h3 id="shortcuts-panel-title" className="panel-caption__title">Quick Shortcuts</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPinEditor(!showPinEditor)}
              >
                {showPinEditor ? 'CLOSE' : 'PIN/EDIT'}
              </Button>
            </div>

            {showPinEditor ? (
              <div className="pin-editor">
                {Object.keys(actionMetadata).map(key => (
                  <label key={key} className="pin-editor__row font-mono">
                    <input
                      type="checkbox"
                      checked={pinned.includes(key)}
                      onChange={() => handleTogglePin(key)}
                    />
                    <span>{key.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="shortcut-list">
                {pinned.length === 0 && (
                  <p className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', padding: '8px' }}>
                    No shortcuts pinned. Open PIN/EDIT to choose.
                  </p>
                )}
                {pinned.map(key => {
                  const meta = actionMetadata[key];
                  if (!meta || !meta.action) return null;
                  return (
                    <Button
                      key={key}
                      variant="secondary"
                      block
                      className="shortcut-btn"
                      icon={meta.icon}
                      onClick={meta.action}
                    >
                      <span className="shortcut-btn__inner">
                        <span className="shortcut-btn__label">{meta.label}</span>
                        <span className="shortcut-btn__hint font-mono">{meta.hint}</span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Topic Mastery (server-provided analytics) */}
          {getTopicMastery().length > 0 && (
            <section className="glass-panel" aria-labelledby="mastery-panel-title">
              <div className="mastery-head">
                <Target size={14} className="neon-cyan" aria-hidden="true" />
                <h3 id="mastery-panel-title" className="panel-caption__title">Topic Mastery</h3>
              </div>
              <div className="goal-list">
                {getTopicMastery().map(m => (
                  <div key={m.topic}>
                    <div className="goal-row">
                      <span className="goal-row__label">{m.topic}</span>
                      <span className="goal-row__value font-mono">{m.score}%</span>
                    </div>
                    <ProgressBar
                      value={m.score}
                      label={`Mastery: ${m.topic}`}
                      color="var(--neon-cyan)"
                      thickness="6px"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* 5. Learning Calendar Heatmap (full width) */}
      {calendarCells.length > 0 && (
        <section className="glass-panel" aria-labelledby="heatmap-panel-title">
          <div className="panel-caption">
            <div>
              <h3 id="heatmap-panel-title" className="panel-caption__title">Adaptive Learning Heatmap</h3>
              <p className="panel-caption__sub">Study activity over the last 28 days.</p>
            </div>
            <span className="stat-chip">
              <span className="font-mono">Active on {activeCalendarDays} of 28 days</span>
            </span>
          </div>

          <div className="heatmap" aria-hidden="true">
            {calendarCells.map((cell, idx) => (
              <div
                key={idx}
                title={`${cell.date.toLocaleDateString()}: ${cell.details}`}
                className={`heatmap-cell ${cell.active ? 'heatmap-cell--active' : ''}`}
              />
            ))}
          </div>
          <p className="sr-only">
            {activeCalendarDays > 0
              ? `Study sessions were logged on ${activeCalendarDays} of the last 28 days.`
              : 'No study sessions logged in the last 28 days.'}
          </p>
          <div className="heatmap-legend font-mono">
            <span>28 DAYS HISTORICAL RUN</span>
            <span className="heatmap-legend__scale">
              LESS ACTIVE <span className="heatmap-legend__swatch heatmap-legend__swatch--off" />
              <span className="heatmap-legend__swatch heatmap-legend__swatch--on" /> COMPLETED BLOCK
            </span>
          </div>
        </section>
      )}
    </div>
  );
}