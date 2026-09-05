import React, { useState, useEffect } from 'react';
import { User, Lock, Server, Trash2 } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { Button, Field, Modal, useToast } from '../../components/shared';

export default function AccountSettings({ user, profile, accessToken, onLogout, onUpdateProfile }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile'); // profile, security, sessions
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [timezone, setTimezone] = useState(profile?.timezone || '');
  const [language] = useState(profile?.language || '');
  const [experience, setExperience] = useState(profile?.experience || 'entry');
  const [techStack, setTechStack] = useState(profile?.tech_stack || '');
  const [preferredTime, setPreferredTime] = useState(profile?.preferred_time || '1 hour');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [sessions, setSessions] = useState([]);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch device sessions
  const fetchSessions = async () => {
    try {
      const res = await apiFetch('/auth/sessions', { token: accessToken });
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        token: accessToken,
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
        toast.success('Developer profile updated successfully.');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update profile settings.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection lost.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'PUT',
        token: accessToken,
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (res.ok) {
        toast.success('Security password updated. Please re-authenticate if required.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to alter password.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection lost.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const res = await apiFetch(`/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        token: accessToken
      });

      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        toast.success('Remote session terminated.');
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
      toast.error('Please type "DELETE" exactly to confirm.');
      return;
    }

    try {
      const res = await apiFetch('/auth/account', {
        method: 'DELETE',
        token: accessToken
      });

      if (res.ok) {
        setConfirmDeleteOpen(false);
        toast.success('Account successfully deleted. Return to onboarding portal.');
        onLogout();
      } else {
        toast.error('Failed to execute account deletion.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to execute account deletion.');
    }
  };

  const tabs = [
    { key: 'profile', label: 'Profile Settings', icon: User },
    { key: 'security', label: 'Security & Password', icon: Lock },
    { key: 'sessions', label: 'Active Sessions', icon: Server }
  ];

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

      <div className="settings-layout">
        {/* Settings Navigation */}
        <aside className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: 'fit-content' }}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`category-item-btn font-sans ${activeTab === key ? 'active' : ''}`}
              aria-pressed={activeTab === key}
              style={{ fontSize: '13px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </aside>

        {/* Settings Workspace */}
        <main className="glass-panel" style={{ padding: '30px' }}>
          {/* Profile Form */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="atlas-stack" style={{ textAlign: 'left' }}>
              <h3 className="font-sans" style={{ fontSize: '16px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                Profile Details
              </h3>

              <div className="atlas-two-col">
                <Field
                  label="FULL NAME"
                  required
                  className="font-mono"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={{ background: '#020204' }}
                />

                <Field
                  label="COUNTRY"
                  required
                  className="font-mono"
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  style={{ background: '#020204' }}
                />

                <Field
                  label="TIMEZONE"
                  required
                  className="font-mono"
                  type="text"
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  style={{ background: '#020204' }}
                />

                <Field
                  label="PREFERRED STUDY TIME"
                  as="select"
                  className="font-mono"
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                  style={{ background: '#020204', padding: '12px' }}
                >
                  <option value="30 mins">30 Minutes</option>
                  <option value="1 hour">1 Hour</option>
                  <option value="2 hours">2 Hours</option>
                  <option value="4 hours+">4+ Hours</option>
                </Field>
              </div>

              <Field
                label="PROGRAMMING LEVEL"
                as="select"
                className="font-mono"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                style={{ background: '#020204', padding: '12px' }}
              >
                <option value="entry">Entry-Level Developer (&lt; 1 yr)</option>
                <option value="mid">Mid-Level Engineer (1-3 yrs)</option>
                <option value="senior">Senior Software Engineer (3-5 yrs)</option>
                <option value="lead">Lead Platform Architect (5+ yrs)</option>
              </Field>

              <Field
                label="PREFERRED STACK (COMMA SEPARATED)"
                className="font-mono"
                type="text"
                value={techStack}
                onChange={e => setTechStack(e.target.value)}
                style={{ background: '#020204' }}
              />

              <Button
                type="submit"
                variant="accent"
                block
                loading={isLoading}
                className="font-sans"
                style={{ padding: '12px', height: 'auto', textShadow: 'none', marginTop: '10px' }}
              >
                {isLoading ? 'SYNCING CHANGES...' : 'SAVE BLUEPRINT CHANGES'}
              </Button>
            </form>
          )}

          {/* Security Form */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="atlas-stack" style={{ textAlign: 'left' }}>
              <h3 className="font-sans" style={{ fontSize: '16px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                Rotate Access Password
              </h3>

              <Field
                label="CURRENT PASSWORD"
                required
                className="font-mono"
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                autoComplete="current-password"
                style={{ background: '#020204' }}
              />

              <Field
                label="NEW COMPLEX PASSWORD"
                required
                className="font-mono"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                style={{ background: '#020204' }}
              />

              <Field
                label="CONFIRM NEW PASSWORD"
                required
                className="font-mono"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                style={{ background: '#020204' }}
              />

              <Button
                type="submit"
                variant="accent"
                block
                loading={isLoading}
                className="font-sans"
                style={{ padding: '12px', height: 'auto', textShadow: 'none', marginTop: '10px' }}
              >
                {isLoading ? 'ROUTING SECURE PASSWORD...' : 'COMMENCE PASSWORD ROTATION'}
              </Button>
            </form>
          )}

          {/* Sessions Panel */}
          {activeTab === 'sessions' && (
            <div className="atlas-stack" style={{ textAlign: 'left' }}>
              <div>
                <h3 className="font-sans" style={{ fontSize: '16px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                  Active System Sessions
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
                  Terminate access vectors remotely to protect node integrity.
                </p>
              </div>

              <div className="admin-status-table" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflowX: 'auto' }}>
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
                      <Button
                        size="sm"
                        variant="secondary"
                        className="font-mono"
                        onClick={() => handleRevokeSession(sess.id)}
                        style={{ color: 'var(--neon-red)' }}
                      >
                        REVOKE
                      </Button>
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

                <Button
                  variant="danger"
                  className="font-sans"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 size={14} /> DESTROY ACCOUNT
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Confirm Account Destruction"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
              CANCEL
            </Button>
            <Button variant="danger" className="font-sans" onClick={handleDeleteAccount}>
              <Trash2 size={14} /> PERMANENTLY DELETE
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '14px' }}>
          This operation irreversibly cascades and deletes your identity node. To proceed, type{' '}
          <span className="font-mono" style={{ color: 'var(--neon-red)' }}>DELETE</span> below.
        </p>
        <Field
          label="TYPE 'DELETE' TO CONFIRM"
          className="font-mono"
          type="text"
          placeholder="DELETE"
          value={deleteConfirmText}
          onChange={e => setDeleteConfirmText(e.target.value)}
          autoComplete="off"
          style={{ background: '#020204', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        />
      </Modal>
    </div>
  );
}