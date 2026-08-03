import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Users, 
  BookOpen, 
  Terminal, 
  Cpu, 
  Activity, 
  AlertTriangle, 
  GitMerge, 
  Flag, 
  Server, 
  TrendingUp, 
  DollarSign, 
  ExternalLink,
  RefreshCw,
  Search,
  Check,
  Briefcase
} from 'lucide-react';

export default function AdminCenter({ 
  user, 
  usersList, 
  onUpdateUserRole, 
  onResetSession, 
  onBackToPortal 
}) {
  const [activeMenu, setActiveMenu] = useState('dashboard-overview');
  const [logStream, setLogStream] = useState([
    '[18:43:01] INF :: Starting Atlas Control Center...',
    '[18:43:02] INF :: Handshake with worker-node-091 SUCCESS',
    '[18:43:03] INF :: Loading AI prompt evaluations...',
    '[18:43:04] INF :: Database clusters reporting NOMINAL'
  ]);
  const [featureFlags, setFeatureFlags] = useState({
    simplifyModeV2: true,
    trieABTest: false,
    aiMentorSpeech: false
  });
  const [adminNotification, setAdminNotification] = useState('');

  // Sidebar menus tree
  const menuConfig = [
    {
      title: 'Dashboard',
      icon: <Activity size={16} />,
      items: [
        { id: 'dashboard-overview', label: 'Overview' },
        { id: 'dashboard-status', label: 'System Status' }
      ]
    },
    {
      title: 'Users',
      icon: <Users size={16} />,
      items: [
        { id: 'users-students', label: 'Students' },
        { id: 'users-mentors', label: 'Mentors' },
        { id: 'users-companies', label: 'Companies' },
        { id: 'users-universities', label: 'Universities' },
        { id: 'users-admins', label: 'Admins' }
      ]
    },
    {
      title: 'Learning',
      icon: <BookOpen size={16} />,
      items: [
        { id: 'learning-paths', label: 'Learning Paths' },
        { id: 'learning-courses', label: 'Courses' },
        { id: 'learning-lessons', label: 'Lessons' },
        { id: 'learning-roadmaps', label: 'Roadmaps' }
      ]
    },
    {
      title: 'Mission Studio',
      icon: <Terminal size={16} />,
      items: [
        { id: 'studio-missions', label: 'Missions' },
        { id: 'studio-templates', label: 'Mission Templates' },
        { id: 'studio-stories', label: 'Story Templates' },
        { id: 'studio-guide', label: 'Guide Mode' },
        { id: 'studio-simplify', label: 'Simplify Mode' },
        { id: 'studio-prompts', label: 'AI Prompts' },
        { id: 'studio-tests', label: 'Hidden Tests' }
      ]
    },
    {
      title: 'AI Management',
      icon: <Cpu size={16} />,
      items: [
        { id: 'ai-library', label: 'Prompt Library' },
        { id: 'ai-models', label: 'Models' },
        { id: 'ai-memory', label: 'Memory' },
        { id: 'ai-evaluation', label: 'Evaluation' },
        { id: 'ai-safety', label: 'Safety' }
      ]
    },
    {
      title: 'Compiler',
      icon: <RefreshCw size={16} />,
      items: [
        { id: 'compiler-queues', label: 'Queues' },
        { id: 'compiler-workers', label: 'Workers' },
        { id: 'compiler-images', label: 'Runtime Images' },
        { id: 'compiler-performance', label: 'Performance' },
        { id: 'compiler-errors', label: 'Errors' }
      ]
    },
    {
      title: 'Analytics',
      icon: <TrendingUp size={16} />,
      items: [
        { id: 'analytics-learning', label: 'Learning' },
        { id: 'analytics-business', label: 'Business' },
        { id: 'analytics-ai', label: 'AI Insights' },
        { id: 'analytics-hiring', label: 'Hiring' },
        { id: 'analytics-infra', label: 'Infrastructure' }
      ]
    },
    {
      title: 'Community',
      icon: <Users size={16} />,
      items: [
        { id: 'community-posts', label: 'Posts' },
        { id: 'community-comments', label: 'Comments' },
        { id: 'community-reports', label: 'Reports' },
        { id: 'community-moderation', label: 'Moderation' }
      ]
    },
    {
      title: 'Hiring Portal',
      icon: <Briefcase size={16} />,
      items: [
        { id: 'hiring-companies', label: 'Companies' },
        { id: 'hiring-jobs', label: 'Jobs' },
        { id: 'hiring-assessments', label: 'Assessments' },
        { id: 'hiring-recruiters', label: 'Recruiters' }
      ]
    },
    {
      title: 'Finance',
      icon: <DollarSign size={16} />,
      items: [
        { id: 'finance-revenue', label: 'Revenue' },
        { id: 'finance-payments', label: 'Payments' },
        { id: 'finance-refunds', label: 'Refunds' },
        { id: 'finance-subscriptions', label: 'Subscriptions' }
      ]
    },
    {
      title: 'Feature Flags',
      icon: <Flag size={16} />,
      items: [
        { id: 'flags-experiments', label: 'Experiments' },
        { id: 'flags-abtesting', label: 'A/B Testing' },
        { id: 'flags-rollouts', label: 'Rollouts' }
      ]
    },
    {
      title: 'System',
      icon: <Server size={16} />,
      items: [
        { id: 'system-logs', label: 'Logs' },
        { id: 'system-monitoring', label: 'Monitoring' },
        { id: 'system-deployments', label: 'Deployments' },
        { id: 'system-health', label: 'Health' },
        { id: 'system-backups', label: 'Backups' }
      ]
    }
  ];

  // Streaming log generator for system log view
  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString();
      const logs = [
        `[${time}] INF :: Heartbeat worker-node-091 - CPU 12%, MEM 34%`,
        `[${time}] INF :: Sandbox compiler queue processed 0 jobs`,
        `[${time}] INF :: AI prompt validation metrics updated`,
        `[${time}] WRN :: Shard replication factor lower than target threshold`,
        `[${time}] INF :: Port 5173 receiving telemetry headers`
      ];
      const randomLog = logs[Math.floor(Math.random() * logs.length)];
      setLogStream(prev => {
        const next = [...prev, randomLog];
        return next.slice(-40); // cap size
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isSuperAdmin = user.role?.toLowerCase() === 'super admin';

  const handleRoleChange = (userId, newRole) => {
    if (!isSuperAdmin) {
      setAdminNotification('ERROR: Only Super Admins can alter user tags.');
      setTimeout(() => setAdminNotification(''), 4000);
      return;
    }
    onUpdateUserRole(userId, newRole);
    setAdminNotification(`SUCCESS: User node role updated to "${newRole}"`);
    setTimeout(() => setAdminNotification(''), 3000);
  };

  const handleToggleFlag = (flagName) => {
    setFeatureFlags(prev => ({
      ...prev,
      [flagName]: !prev[flagName]
    }));
  };

  return (
    <div className="admin-root-container">
      <div className="subtle-grid"></div>

      {/* Admin Sidebar */}
      <aside className="admin-sidebar glass-panel">
        <div className="admin-brand-header">
          <Shield className="neon-purple" size={20} />
          <span className="brand-text">ATLAS CONTROL</span>
        </div>

        <div className="admin-menu-list">
          {menuConfig.map((category, idx) => (
            <div key={idx} className="admin-menu-category">
              <div className="category-title font-sans">
                {category.icon}
                <span>{category.title}</span>
              </div>
              <div className="category-items">
                {category.items.map(item => (
                  <button
                    key={item.id}
                    className={`category-item-btn font-mono ${activeMenu === item.id ? 'active' : ''}`}
                    onClick={() => setActiveMenu(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="admin-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={onBackToPortal} className="neon-btn secondary font-sans w-full">
            Back to Portal
          </button>
          <button 
            onClick={onResetSession} 
            className="neon-btn reset font-sans w-full" 
            style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--neon-red)' }}
          >
            Logout Session
          </button>
          <div className="admin-badge">
            <span className="name">{user.callsign}</span>
            <span className="role font-mono">{user.role || 'jr architect'}</span>
          </div>
        </div>
      </aside>

      {/* Admin Main Workspace */}
      <main className="admin-workspace-content">
        {adminNotification && (
          <div className={`admin-alert font-mono ${adminNotification.startsWith('ERROR') ? 'error' : 'success'}`}>
            {adminNotification}
          </div>
        )}

        {/* Dashboard Overview */}
        {activeMenu === 'dashboard-overview' && (
          <div className="admin-panel-container fade-in">
            <h2>System Overview</h2>
            <p>Ecosystem statistics and live execution indexes.</p>

            <div className="admin-grid-3">
              <div className="admin-stat-card glass-panel">
                <span className="label font-mono">ACTIVE LEARNERS</span>
                <div className="value font-mono text-glow-cyan">1,248</div>
                <div className="footer font-mono">ROADMAP SYNCS: 12/s</div>
              </div>
              <div className="admin-stat-card glass-panel">
                <span className="label font-mono">COMPILER INSTANCES</span>
                <div className="value font-mono text-glow-purple">128</div>
                <div className="footer font-mono">QUEUES WAITING: 0</div>
              </div>
              <div className="admin-stat-card glass-panel">
                <span className="label font-mono">AI EVALUATION LATENCY</span>
                <div className="value font-mono text-glow-green">140ms</div>
                <div className="footer font-mono">COMPLIANCE INDEX: 99.8%</div>
              </div>
            </div>

            <div className="admin-chart-mock glass-panel">
              <h3 className="font-sans">Compute CPU & Network Throughput</h3>
              <div className="mock-chart-bars">
                {[45, 60, 52, 70, 85, 90, 62, 58, 48, 65, 78, 88, 95, 70, 62, 72].map((val, idx) => (
                  <div key={idx} className="chart-col-wrapper">
                    <div className="chart-col" style={{ height: `${val}%` }}></div>
                    <span className="col-label font-mono">N{idx}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Status */}
        {activeMenu === 'dashboard-status' && (
          <div className="admin-panel-container fade-in">
            <h2>Node Cluster Health</h2>
            <p>Live health verification of execution sandbox runtimes.</p>

            <div className="admin-status-table glass-panel">
              <div className="table-row header font-mono">
                <span>NODE NAME</span>
                <span>TYPE</span>
                <span>LATENCY</span>
                <span>STATUS</span>
              </div>
              <div className="table-row">
                <span className="font-mono">sandbox-jvm-01</span>
                <span>Compiler Worker</span>
                <span className="font-mono">1.2ms</span>
                <span className="status-pill online font-mono">ONLINE</span>
              </div>
              <div className="table-row">
                <span className="font-mono">sandbox-python-01</span>
                <span>AI Sandbox</span>
                <span className="font-mono">4.5ms</span>
                <span className="status-pill online font-mono">ONLINE</span>
              </div>
              <div className="table-row">
                <span className="font-mono">database-replica-01</span>
                <span>PostgreSQL DB</span>
                <span className="font-mono">0.8ms</span>
                <span className="status-pill online font-mono">ONLINE</span>
              </div>
              <div className="table-row">
                <span className="font-mono">broker-kafka-01</span>
                <span>Event Streamer</span>
                <span className="font-mono">8.4ms</span>
                <span className="status-pill warning font-mono">STRESSED</span>
              </div>
            </div>
          </div>
        )}

        {/* Users Section (Students, Mentors, Admins Table) */}
        {activeMenu.startsWith('users-') && (
          <div className="admin-panel-container fade-in">
            <h2>User Nodes Directory ({activeMenu.replace('users-', '').toUpperCase()})</h2>
            <p>Manage Callsign details, assigned roadmaps, and security tags.</p>

            {!isSuperAdmin && (
              <div className="admin-alert error font-mono" style={{ marginBottom: '20px' }}>
                🛡 SUPER ADMIN PRIVILEGES REQUIRED: Currently logged in as "{user.role}". 
                To test tag manipulation, select "super admin" in dropdown on your row below.
              </div>
            )}

            <div className="admin-table-wrapper glass-panel">
              <div className="table-row header font-mono">
                <span>CALLSIGN (NAME)</span>
                <span>ACTIVE ROADMAP</span>
                <span>SECURITY TAG / ROLE</span>
                <span>STATUS</span>
              </div>
              
              {usersList
                .filter(usr => {
                  const role = (usr.role || '').toLowerCase();
                  if (activeMenu === 'users-students') return role === 'student' || role === 'jr architect';
                  if (activeMenu === 'users-mentors') return role === 'mentor' || role === 'guider';
                  if (activeMenu === 'users-admins') return role === 'admin' || role === 'super admin';
                  return true;
                })
                .map((usr) => (
                <div key={usr.id} className="table-row align-center">
                  <span className="font-mono font-bold text-glow-cyan">{usr.username}</span>
                  <span>{usr.learning_track || 'Not Assigned'}</span>
                  <div>
                    {/* Super Admin can modify user tags */}
                    <select
                      value={usr.role}
                      onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                      className="tech-select font-mono text-xs"
                      style={{ padding: '6px 12px', width: '150px' }}
                    >
                      <option value="jr architect">jr architect</option>
                      <option value="admin">admin</option>
                      <option value="super admin">super admin</option>
                      <option value="mentor">mentor</option>
                      <option value="guider">guider</option>
                    </select>
                  </div>
                  <span className="status-pill online font-mono">{usr.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Paths */}
        {activeMenu.startsWith('learning-') && (
          <div className="admin-panel-container fade-in">
            <h2>Learning Mesh & Content Maps</h2>
            <p>Active path config maps for student roadmap generation.</p>
            <div className="glass-panel text-center" style={{ padding: '40px' }}>
              <BookOpen size={36} className="neon-cyan" style={{ marginBottom: '16px' }} />
              <h3>Course Structure Graph</h3>
              <p style={{ marginTop: '10px' }}>
                Course mapping templates configured: Kotlin Basics, Jetpack Compose v2, Kafka streams. 
                Syllabus nodes are bounded in Directed Acyclic Graphs (DAGs).
              </p>
            </div>
          </div>
        )}

        {/* Mission Studio */}
        {activeMenu.startsWith('studio-') && (
          <div className="admin-panel-container fade-in">
            <h2>Mission Studio Configuration</h2>
            <p>Edit compiler verification tests and Guide Mode prompts.</p>
            <div className="admin-grid-2">
              <div className="glass-panel">
                <h3>Guide Mode prompts</h3>
                <p style={{ margin: '10px 0 20px' }}>Adjust cognitive difficulty parameters for Simplify mode.</p>
                <div className="slider-group font-mono">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SIMPLIFY_STAGES</span>
                    <span>4 levels</span>
                  </div>
                  <input type="range" min="1" max="8" defaultValue="4" style={{ width: '100%', accentColor: 'var(--neon-purple)' }} />
                </div>
              </div>
              <div className="glass-panel">
                <h3>Hidden compiler assertions</h3>
                <p style={{ margin: '10px 0' }}>Configure latency budget thresholds:</p>
                <div className="font-mono" style={{ background: '#020204', padding: '12px', borderRadius: '4px', fontSize: '12px', color: 'var(--neon-cyan)' }}>
                  assertTimeout(Duration.ofMillis(5)) &#123; searchEngine.search() &#125;
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI management */}
        {activeMenu.startsWith('ai-') && (
          <div className="admin-panel-container fade-in">
            <h2>AI Prompt Engine & Safety Evaluation</h2>
            <p>Monitor token usage budgets and guardrail filters.</p>
            <div className="glass-panel">
              <h3>Safety Classification filters</h3>
              <p style={{ margin: '10px 0 20px' }}>Tuning prompt responses for code reviews:</p>
              <div className="flag-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span>Enable PII Leak Check filters</span>
                <span className="text-glow-green font-mono">ACTIVE</span>
              </div>
              <div className="flag-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span>Enable Plagiarism verification parser</span>
                <span className="text-glow-green font-mono">ACTIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* Compiler Runtimes */}
        {activeMenu.startsWith('compiler-') && (
          <div className="admin-panel-container fade-in">
            <h2>Sandbox Compiler Queues</h2>
            <p>Telemetry index for running docker instances.</p>
            <div className="admin-grid-2">
              <div className="glass-panel">
                <h3>Build queues (Live)</h3>
                <p className="font-mono" style={{ color: 'var(--neon-lime)' }}>[IDLE] worker-jvm-pool-01 awaiting tasks...</p>
              </div>
              <div className="glass-panel">
                <h3>Docker Images</h3>
                <p className="font-mono">Image: atlas/kotlin-gradle-jvm21:latest [240MB]</p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Flags */}
        {activeMenu.startsWith('flags-') && (
          <div className="admin-panel-container fade-in">
            <h2>Feature Flag Toggle Board</h2>
            <p>Control user rollouts and A/B experiments instantly.</p>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: '#fff' }}>Enable Simplify Mode v2 Layout</h4>
                  <p style={{ fontSize: '12px' }}>Staged layout for mobile clients.</p>
                </div>
                <button 
                  onClick={() => handleToggleFlag('simplifyModeV2')} 
                  className={`neon-btn ${featureFlags.simplifyModeV2 ? 'accent' : 'secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  {featureFlags.simplifyModeV2 ? 'ON / ACTIVE' : 'OFF'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: '#fff' }}>A/B Test Trie optimization popup</h4>
                  <p style={{ fontSize: '12px' }}>Rollout 50% audience prompt highlights.</p>
                </div>
                <button 
                  onClick={() => handleToggleFlag('trieABTest')} 
                  className={`neon-btn ${featureFlags.trieABTest ? 'accent' : 'secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  {featureFlags.trieABTest ? 'ON / ACTIVE' : 'OFF'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: '#fff' }}>Enable AI Mentor voice feedback</h4>
                  <p style={{ fontSize: '12px' }}>TTS audio review transcripts generation.</p>
                </div>
                <button 
                  onClick={() => handleToggleFlag('aiMentorSpeech')} 
                  className={`neon-btn ${featureFlags.aiMentorSpeech ? 'accent' : 'secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  {featureFlags.aiMentorSpeech ? 'ON / ACTIVE' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Logs */}
        {activeMenu === 'system-logs' && (
          <div className="admin-panel-container fade-in">
            <h2>Ecosystem Logs (Live Stream)</h2>
            <p>Streaming log messages from API routers, compilers, and databases.</p>
            <div className="admin-terminal-log font-mono">
              {logStream.map((log, idx) => (
                <div key={idx} className="log-line">
                  <span className="log-prompt">&gt;&gt;</span> {log}
                </div>
              ))}
              <div className="cursor-blink"></div>
            </div>
          </div>
        )}

        {/* Fallback for other panels */}
        {!['dashboard-overview', 'dashboard-status', 'system-logs'].includes(activeMenu) && 
         !activeMenu.startsWith('users-') && 
         !activeMenu.startsWith('learning-') && 
         !activeMenu.startsWith('studio-') && 
         !activeMenu.startsWith('ai-') && 
         !activeMenu.startsWith('compiler-') && 
         !activeMenu.startsWith('flags-') && (
          <div className="admin-panel-container fade-in">
            <h2>{activeMenu.replace('-', ' // ').toUpperCase()}</h2>
            <p>Database table resources for managing this subsystem.</p>
            <div className="glass-panel font-mono" style={{ padding: '30px', fontSize: '13px' }}>
              <div>[TELEMETRY] Querying data nodes... SUCCESS</div>
              <div style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
                This is a simulated administrative grid displaying status indexes for resource: "{activeMenu}".
                All checks passed. Node is nominal.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
