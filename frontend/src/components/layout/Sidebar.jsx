import React from 'react';
import { Terminal, Layout, Compass, Award, Briefcase, Settings, RefreshCw, BookOpen } from 'lucide-react';

const NAV_ITEMS = [
  { tab: 'overview', label: 'Overview Dashboard', icon: Layout },
  { tab: 'learn', label: 'Learning Hub', icon: BookOpen },
  { tab: 'ide', label: 'Mission Space (IDE)', icon: Terminal },
  { tab: 'practice', label: 'Logic Sandbox', icon: Compass },
  { tab: 'passport', label: 'Engineering Passport', icon: Award },
  { tab: 'career', label: 'Career readiness Vault', icon: Briefcase },
  { tab: 'settings', label: 'Account Settings', icon: Settings }
];

export default function Sidebar({ activeTab, onNavigate, user, profile, onAdmin, onResetSession }) {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon font-sans">A</div>
        <span className="logo-text">ATLAS</span>
      </div>

      <nav className="nav-links">
        {NAV_ITEMS.map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            className={`nav-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onNavigate(tab)}
            style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {['admin', 'super admin', 'mentor', 'guider'].includes(user.role?.toLowerCase()) && (
          <button
            onClick={onAdmin}
            className="ctrl-btn load font-mono w-full"
            style={{ fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Settings size={12} /> Admin Center
          </button>
        )}

        <button
          onClick={onResetSession}
          className="ctrl-btn reset font-mono w-full"
          style={{ fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <RefreshCw size={12} /> Reset Session
        </button>

        <div className="user-badge">
          <div className="avatar">
            {profile?.avatar || user.username[0]?.toUpperCase() || 'A'}
          </div>
          <div className="avatar-info">
            <span className="avatar-name">{profile?.full_name || user.username}</span>
            <span className="avatar-role font-mono">{user.role || 'Student'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}