import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Cpu, 
  Award, 
  Zap, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Compass, 
  Database, 
  Clock, 
  Bell, 
  Calendar, 
  ChevronRight, 
  RefreshCw, 
  Trash2, 
  Terminal, 
  Briefcase, 
  Settings,
  X,
  Plus,
  TrendingUp,
  Info
} from 'lucide-react';
import { apiFetch } from '../../api/client';

export default function Dashboard({ user, accessToken, missionCompleted, onNavigateToIDE }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [plan, setPlan] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [recs, setRecs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // States for interactive components
  const [analyticsTab, setAnalyticsTab] = useState('hours'); // hours, xp
  const [analyticsFilter, setAnalyticsFilter] = useState('weekly'); // weekly, monthly, yearly
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all'); // all, system, achievement, mentor
  const [notifSearch, setNotifSearch] = useState('');
  const [showPinEditor, setShowPinEditor] = useState(false);
  
  const chatEndRef = useRef(null);

  // Fetch Dashboard Summary Data
  const loadDashboardData = async () => {
    try {
      const res = await apiFetch('/dashboard/summary', { token: accessToken });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setPlan(json.todayPlan || []);
        setGoals(json.dailyGoals.concat(json.weeklyGoals) || []);
        setNotifs(json.notifications || []);
        setRecs(json.recommendations || []);
        setActivity(json.recentActivity || []);
        setCalendar(json.calendarEvents || []);
        setPinned(json.pinnedActions || []);
        setAnalytics(json.analytics || null);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
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
        // Quietly update goals in memory
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
    try {
      const res = await apiFetch('/dashboard/plan/toggle', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({ itemId, completed: !currentCompleted })
      });
      if (res.ok) {
        const json = await res.json();
        setPlan(json.todayPlan);
        loadDashboardData(); // reload stats and level/XP changes
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Regenerate Today's Learning Plan
  const handleRegeneratePlan = async () => {
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

  if (loading || !data) {
    return (
      <div className="onboarding-root">
        <div className="onboarding-panel glass-panel text-center">
          <RefreshCw className="spin neon-cyan" size={32} style={{ margin: '0 auto 16px' }} />
          <p className="font-mono text-sm">Synchronizing dashboard workspace configs...</p>
        </div>
      </div>
    );
  }

  const { user: userStats, profile, todayProgress, streak } = data;

  const totalUnreadNotifs = notifs.filter(n => n.is_read === 0).length;

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
    return names[type] || type;
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

  // Shortcuts config metadata
  const actionMetadata = {
    ide: { label: 'Continue Mission', icon: <Terminal size={14} />, action: onNavigateToIDE },
    practice: { label: 'Logic Practice', icon: <Compass size={14} />, action: () => {} },
    passport: { label: 'Engineering Passport', icon: <Award size={14} />, action: () => {} },
    career: { label: 'Career Prep Vault', icon: <Briefcase size={14} />, action: () => {} },
    settings: { label: 'Account Settings', icon: <Settings size={14} />, action: () => {} }
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

  // Custom Interactive Analytics Chart Renderer (drawn using SVG)
  const getAnalyticsPoints = () => {
    if (!analytics) return { paths: '', points: [] };
    const values = analyticsTab === 'hours' ? analytics.weeklyHours : analytics.monthlyXp;
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

  // Filtered Notifications list
  const filteredNotifs = notifs.filter(n => {
    if (notifFilter !== 'all' && n.category !== notifFilter) return false;
    if (notifSearch.trim() && !n.title.toLowerCase().includes(notifSearch.toLowerCase()) && !n.message.toLowerCase().includes(notifSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="dashboard-root fade-in">
      
      {/* 1. Header Toolbar */}
      <header className="dashboard-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="welcome-architect">Welcome back, {profile?.full_name || userStats.username}</h1>
          <p className="system-status font-mono">
            Identity registry: <span className="text-glow-cyan">ACTIVE</span> | Streak: <span className="text-glow-purple">{streak} Days</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="ctrl-btn load font-mono" 
            style={{ position: 'relative', display: 'flex', gap: '6px', alignItems: 'center', padding: '10px 14px' }}
          >
            <Bell size={15} />
            <span>Alerts</span>
            {totalUnreadNotifs > 0 && (
              <span className="notif-badge-pill">{totalUnreadNotifs}</span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Notification Overlay Tray */}
      {notifOpen && (
        <div className="glass-panel fade-in" style={{ position: 'fixed', top: '80px', right: '30px', width: '380px', zIndex: 1000, padding: '20px', border: '1px solid var(--neon-cyan)', boxShadow: 'var(--glow-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '14px' }}>
            <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff' }}>Security Alerts & Log</h3>
            <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            {['all', 'system', 'achievement', 'mentor'].map(cat => (
              <button
                key={cat}
                onClick={() => setNotifFilter(cat)}
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
            style={{ fontSize: '11px', padding: '8px', marginBottom: '12px', background: '#020204' }}
          />

          <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredNotifs.length === 0 ? (
              <p className="font-mono text-center" style={{ fontSize: '11px', color: 'var(--text-dim)', padding: '20px' }}>No matching alerts found.</p>
            ) : (
              filteredNotifs.map(n => (
                <div key={n.id} style={{ background: n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(0, 229, 255, 0.05)', border: n.is_read ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--border-dim)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="font-sans" style={{ fontSize: '12px', fontWeight: 'bold', color: n.is_read ? 'var(--text-secondary)' : '#fff' }}>{n.title}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {n.is_read === 0 && (
                        <button onClick={() => handleMarkNotifRead(n.id)} className="font-mono" style={{ background: 'none', border: 'none', color: 'var(--neon-lime)', fontSize: '9px', cursor: 'pointer' }}>READ</button>
                      )}
                      <button onClick={() => handleDeleteNotif(n.id)} className="font-mono" style={{ background: 'none', border: 'none', color: 'var(--neon-red)', fontSize: '9px', cursor: 'pointer' }}>DEL</button>
                    </div>
                  </div>
                  <p className="font-sans" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. Main Dashboard Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN: Cockpit Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Stats Bar */}
          <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', padding: '20px', textAlign: 'center' }}>
            <div>
              <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>ENGINEERING LEVEL</span>
              <h2 className="text-glow-purple font-sans" style={{ fontSize: '24px', margin: '4px 0 0' }}>Lv. {userStats.level}</h2>
            </div>
            <div>
              <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>EXPERIENCE POINTS</span>
              <h2 className="text-glow-blue font-sans" style={{ fontSize: '24px', margin: '4px 0 0' }}>{userStats.xp} XP</h2>
            </div>
            <div>
              <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>COMPLIANCE RANK</span>
              <h2 className="text-glow-green font-sans" style={{ fontSize: '18px', margin: '8px 0 0', textTransform: 'uppercase' }}>{userStats.role || 'Jr Architect'}</h2>
            </div>
            <div>
              <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>MATURITY SCORE</span>
              <h2 className="text-glow-cyan font-sans" style={{ fontSize: '24px', margin: '4px 0 0' }}>{userStats.code_quality}%</h2>
            </div>
          </div>

          {/* Today's Learning Plan */}
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff' }}>Today's Engineering Plan</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Personalized roadmap tasks matching 1 hour available study time.</p>
              </div>
              <button 
                onClick={handleRegeneratePlan}
                className="ctrl-btn font-mono" 
                style={{ fontSize: '10px', display: 'flex', gap: '4px', alignItems: 'center', padding: '6px 10px', height: 'auto' }}
              >
                <RefreshCw size={10} /> Regenerate
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plan.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleTogglePlanItem(item.id, item.completed)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: item.completed ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255,255,255,0.01)',
                    border: item.completed ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                    padding: '12px 16px', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <CheckCircle2 size={16} style={{ color: item.completed ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)' }} />
                    <div>
                      <span className="font-mono" style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', marginRight: '8px' }}>
                        {item.type}
                      </span>
                      <span className="font-sans" style={{ fontSize: '13px', color: item.completed ? 'var(--text-dim)' : '#fff', textDecoration: item.completed ? 'line-through' : 'none' }}>
                        {item.title}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{item.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Analytics Interactive SVG */}
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff' }}>Ecosystem Progress Analytics</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Interactive charts mapping learning metrics.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  value={analyticsFilter} 
                  onChange={e => setAnalyticsFilter(e.target.value)}
                  className="tech-select font-mono" 
                  style={{ fontSize: '10px', padding: '4px 8px', height: 'auto', background: '#020204' }}
                >
                  <option value="weekly">Weekly View</option>
                  <option value="monthly">Monthly View</option>
                </select>
                <div style={{ display: 'flex', background: '#020204', borderRadius: '4px', padding: '2px' }}>
                  <button 
                    onClick={() => setAnalyticsTab('hours')}
                    className={`font-mono ${analyticsTab === 'hours' ? 'text-glow-cyan' : ''}`}
                    style={{ background: 'none', border: 'none', fontSize: '9px', padding: '4px 8px', color: analyticsTab === 'hours' ? '#fff' : 'var(--text-dim)', cursor: 'pointer' }}
                  >
                    HOURS
                  </button>
                  <button 
                    onClick={() => setAnalyticsTab('xp')}
                    className={`font-mono ${analyticsTab === 'xp' ? 'text-glow-cyan' : ''}`}
                    style={{ background: 'none', border: 'none', fontSize: '9px', padding: '4px 8px', color: analyticsTab === 'xp' ? '#fff' : 'var(--text-dim)', cursor: 'pointer' }}
                  >
                    XP
                  </button>
                </div>
              </div>
            </div>

            {/* Custom SVG Drawing */}
            <div style={{ background: '#020204', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '16px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100%" height="100%" viewBox="0 0 380 120">
                {/* Grid Lines */}
                <line x1="10" y1="20" x2="370" y2="20" stroke="rgba(255,255,255,0.02)" strokeDasharray="3" />
                <line x1="10" y1="60" x2="370" y2="60" stroke="rgba(255,255,255,0.02)" strokeDasharray="3" />
                <line x1="10" y1="100" x2="370" y2="100" stroke="rgba(255,255,255,0.03)" />
                
                {analyticsTab === 'hours' ? (
                  // Bar Chart
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
                  // Line Chart
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
          </div>

          {/* Learning Calendar Heatmap */}
          <div className="glass-panel">
            <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff', marginBottom: '12px' }}>Adaptive Learning Heatmap</h3>
            
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', background: '#020204', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', justifyContent: 'center' }}>
              {calendarCells.map((cell, idx) => (
                <div
                  key={idx}
                  title={`${cell.date.toLocaleDateString()}: ${cell.details}`}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '3px',
                    background: cell.active ? 'rgba(139, 92, 246, 0.45)' : 'rgba(255,255,255,0.03)',
                    border: cell.active ? '1px solid var(--neon-purple)' : '1px solid rgba(255,255,255,0.01)',
                    boxShadow: cell.active ? '0 0 5px rgba(139, 92, 246, 0.2)' : 'none',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-dim)', marginTop: '8px' }} className="font-mono">
              <span>28 DAYS HISTORICAL RUN</span>
              <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                LESS ACTIVE <span style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '1px' }} />
                <span style={{ width: '8px', height: '8px', background: 'rgba(139, 92, 246, 0.45)', borderRadius: '1px' }} /> COMPLETED BLOCK
              </span>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="glass-panel">
            <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff', marginBottom: '16px' }}>Identity Registry Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              {activity.map((act, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '14px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-4.5px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-purple)', border: '2px solid var(--bg-core)' }} />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="font-mono" style={{ fontSize: '9px', background: 'rgba(255,255,255,0.03)', padding: '1px 5px', borderRadius: '3px', color: 'var(--neon-cyan)' }}>
                        {act.activity_type.toUpperCase()}
                      </span>
                      <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{act.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Goals & AI Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Daily Goals */}
          <div className="glass-panel">
            <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff', marginBottom: '14px' }}>Daily Objectives</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {goals.filter(g => g.goal_type.startsWith('daily_')).map((g) => {
                const pct = getGoalPercent(g);
                return (
                  <div key={g.goal_type} style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }} className="font-mono">
                      <span>{formatGoalName(g.goal_type)}</span>
                      <span>{formatGoalValue(g)}</span>
                    </div>
                    <div style={{ background: '#020204', height: '6px', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--neon-cyan)', boxShadow: 'var(--glow-cyan)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Goals */}
          <div className="glass-panel">
            <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff', marginBottom: '14px' }}>Weekly Objectives</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {goals.filter(g => g.goal_type.startsWith('weekly_')).map((g) => {
                const pct = getGoalPercent(g);
                return (
                  <div key={g.goal_type} style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }} className="font-mono">
                      <span>{formatGoalName(g.goal_type)}</span>
                      <span>{formatGoalValue(g)}</span>
                    </div>
                    <div style={{ background: '#020204', height: '6px', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--neon-purple)', boxShadow: 'var(--glow-purple)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* recommended next steps */}
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff', marginBottom: '12px' }}>Recommended Steps</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recs.map((r) => (
                <div key={r.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 className="font-sans" style={{ fontSize: '12px', color: '#fff' }}>{r.title}</h4>
                    <span className="font-mono" style={{ fontSize: '9px', color: 'var(--neon-cyan)', marginRight: '6px' }}>{r.type.toUpperCase()}</span>
                    <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{r.estimated_time} | {r.difficulty}</span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Pins Toggler */}
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff' }}>Quick Shortcuts</h3>
              <button 
                onClick={() => setShowPinEditor(!showPinEditor)} 
                className="font-mono"
                style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', fontSize: '10px', cursor: 'pointer' }}
              >
                {showPinEditor ? 'CLOSE' : 'PIN/EDIT'}
              </button>
            </div>

            {showPinEditor ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#020204', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                {Object.keys(actionMetadata).map(key => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#fff', cursor: 'pointer' }} className="font-mono">
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pinned.map(key => {
                  const meta = actionMetadata[key];
                  if (!meta) return null;
                  return (
                    <button 
                      key={key} 
                      onClick={meta.action}
                      className="neon-btn secondary font-sans w-full"
                      style={{ fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', height: 'auto', textShadow: 'none', background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      {meta.icon}
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Learning Insights */}
          <div className="glass-panel" style={{ textAlign: 'left', border: '1px solid rgba(0, 229, 255, 0.15)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <Info className="neon-cyan" size={14} />
              <h3 className="font-sans" style={{ fontSize: '14px', color: '#fff' }}>Engineering Insights</h3>
            </div>
            <p className="font-sans" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              💡 Your Kotlin search complexity loops are operating 35% faster than linear iterations. 
              Review memory layout overheads in recursive nodes next.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
