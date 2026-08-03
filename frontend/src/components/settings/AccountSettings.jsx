import React, { useState, useEffect } from 'react';
import { Shield, User, Lock, Server, Trash2, Cpu, Check } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}`;

export default function AccountSettings({ user, profile, accessToken, onLogout, onUpdateProfile }) {
  const [activeTab, setActiveTab] = useState('profile'); // profile, security, sessions
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [timezone, setTimezone] = useState(profile?.timezone || '');
  const [language, setLanguage] = useState(profile?.language || '');
  const [experience, setExperience] = useState(profile?.experience || 'entry');
  const [techStack, setTechStack] = useState(profile?.tech_stack || '');
  const [preferredTime, setPreferredTime] = useState(profile?.preferred_time || '1 hour');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [sessions, setSessions] = useState([]);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [notifyMsg, setNotifyMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch device sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/sessions`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  const triggerNotification = (text, error = false) => {
    setNotifyMsg(text);
    setIsError(error);
    setTimeout(() => {
      setNotifyMsg('');
    }, 4000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          full_name: fullName,
          country,
          timezone,
          language,
          experience,
          tech_stack: techStack,
          preferred_time: preferredTime
        })
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdateProfile(updated);
        triggerNotification('Developer profile updated successfully.');
      } else {
        const err = await res.json();
        triggerNotification(err.error || 'Failed to update profile settings.', true);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Connection lost.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerNotification('Passwords do not match.', true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (res.ok) {
        triggerNotification('Security password updated. Please re-authenticate if required.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        triggerNotification(err.error || 'Failed to alter password.', true);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Connection lost.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        triggerNotification('Remote session terminated.');
        // If they terminated their own session, log out!
        if (sessions.find(s => s.id === sessionId && s.current)) {
          onLogout();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      triggerNotification('Please type "DELETE" exactly to confirm.', true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (res.ok) {
        alert('Account successfully deleted. Return to onboarding portal.');
        onLogout();
      } else {
        triggerNotification('Failed to execute account deletion.', true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-root fade-in">
      <header className="dashboard-header-row" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="welcome-architect">Account Blueprint & Settings</h1>
          <p className="system-status font-mono">
            Identity node: <span className="text-glow-cyan">{user.username}</span> | Access level: {user.role?.toUpperCase()}
          </p>
        </div>
      </header>

      {notifyMsg && (
        <div className={`admin-alert font-mono ${isError ? 'error' : 'success'}`} style={{ marginBottom: '20px' }}>
          {notifyMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '30px' }}>
        {/* Settings Navigation */}
        <aside className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: 'fit-content' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`category-item-btn font-sans ${activeTab === 'profile' ? 'active' : ''}`}
            style={{ fontSize: '13px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <User size={14} /> Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`category-item-btn font-sans ${activeTab === 'security' ? 'active' : ''}`}
            style={{ fontSize: '13px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Lock size={14} /> Security & Password
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`category-item-btn font-sans ${activeTab === 'sessions' ? 'active' : ''}`}
            style={{ fontSize: '13px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Server size={14} /> Active Sessions
          </button>
        </aside>

        {/* Settings Workspace */}
        <main className="glass-panel" style={{ padding: '30px' }}>
          {/* Profile Form */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              <h3 className="font-sans" style={{ fontSize: '16px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>Profile Details</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>FULL NAME</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="tech-input font-mono"
                    style={{ background: '#020204', textTransform: 'none' }}
                  />
                </div>
                <div className="form-group">
                  <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>COUNTRY</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="tech-input font-mono"
                    style={{ background: '#020204', textTransform: 'none' }}
                  />
                </div>
                <div className="form-group">
                  <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>TIMEZONE</label>
                  <input
                    type="text"
                    required
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="tech-input font-mono"
                    style={{ background: '#020204', textTransform: 'none' }}
                  />
                </div>
                <div className="form-group">
                  <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>PREFERRED STUDY TIME</label>
                  <select
                    value={preferredTime}
                    onChange={e => setPreferredTime(e.target.value)}
                    className="tech-select font-mono"
                    style={{ background: '#020204', padding: '12px' }}
                  >
                    <option value="30 mins">30 Minutes</option>
                    <option value="1 hour">1 Hour</option>
                    <option value="2 hours">2 Hours</option>
                    <option value="4 hours+">4+ Hours</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>PROGRAMMING LEVEL</label>
                <select
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className="tech-select font-mono"
                  style={{ background: '#020204', padding: '12px' }}
                >
                  <option value="entry">Entry-Level Developer (&lt; 1 yr)</option>
                  <option value="mid">Mid-Level Engineer (1-3 yrs)</option>
                  <option value="senior">Senior Software Engineer (3-5 yrs)</option>
                  <option value="lead">Lead Platform Architect (5+ yrs)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>PREFERRED STACK (COMMA SEPARATED)</label>
                <input
                  type="text"
                  value={techStack}
                  onChange={e => setTechStack(e.target.value)}
                  className="tech-input font-mono"
                  style={{ background: '#020204', textTransform: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="neon-btn accent font-sans w-full"
                style={{ padding: '12px', height: 'auto', textShadow: 'none', marginTop: '10px' }}
              >
                {isLoading ? 'SYNCING CHANGES...' : 'SAVE BLUEPRINT CHANGES'}
              </button>
            </form>
          )}

          {/* Security Form */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              <h3 className="font-sans" style={{ fontSize: '16px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>Rotate Access Password</h3>
              
              <div className="form-group">
                <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>CURRENT PASSWORD</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="tech-input font-mono"
                  style={{ background: '#020204', textTransform: 'none' }}
                />
              </div>

              <div className="form-group">
                <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>NEW COMPLEX PASSWORD</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="tech-input font-mono"
                  style={{ background: '#020204', textTransform: 'none' }}
                />
              </div>

              <div className="form-group">
                <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>CONFIRM NEW PASSWORD</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="tech-input font-mono"
                  style={{ background: '#020204', textTransform: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="neon-btn accent font-sans w-full"
                style={{ padding: '12px', height: 'auto', textShadow: 'none', marginTop: '10px' }}
              >
                {isLoading ? 'ROUTING SECURE PASSWORD...' : 'COMMENCE PASSWORD ROTATION'}
              </button>
            </form>
          )}

          {/* Sessions Panel */}
          {activeTab === 'sessions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
              <div>
                <h3 className="font-sans" style={{ fontSize: '16px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>Active System Sessions</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>Terminate access vectors remotely to protect node integrity.</p>
              </div>

              <div className="admin-status-table" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                <div className="table-row header font-mono">
                  <span>AGENT / OS</span>
                  <span>IP LOCATION</span>
                  <span>LAST ACTIVE</span>
                  <span>ACTIONS</span>
                </div>
                {sessions.map((sess) => (
                  <div key={sess.id} className="table-row align-center">
                    <span style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sess.user_agent}</span>
                    <span className="font-mono">{sess.ip_address}</span>
                    <span className="font-mono">{new Date(sess.last_active).toLocaleTimeString()}</span>
                    <div>
                      <button 
                        onClick={() => handleRevokeSession(sess.id)}
                        className="neon-btn secondary font-mono"
                        style={{ padding: '4px 8px', fontSize: '10px', height: 'auto', color: 'var(--neon-red)' }}
                      >
                        REVOKE
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Account Deletion */}
              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(239, 68, 68, 0.1)', paddingTop: '20px' }}>
                <h4 style={{ color: 'var(--neon-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trash2 size={16} /> Danger Zone: Permanent Account Destruction
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '8px 0 16px' }}>
                  Cascade deletes all profile specifications, achievements, code submissions, and logs. This operation is irreversible.
                </p>

                <div style={{ display: 'flex', gap: '10px', maxWidth: '400px' }}>
                  <input
                    type="text"
                    placeholder="Type 'DELETE' to confirm"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    className="tech-input font-mono"
                    style={{ background: '#020204', textTransform: 'none', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                  />
                  <button 
                    onClick={handleDeleteAccount}
                    className="neon-btn reset font-sans"
                    style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--neon-red)', color: 'var(--neon-red)', padding: '10px 20px', height: 'auto' }}
                  >
                    DESTROY ACCOUNT
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
