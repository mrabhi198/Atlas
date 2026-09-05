import React, { useState, useEffect, useCallback } from 'react';
import { User, Lock, Server, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { Button, Field, Modal, Alert, StatePanel, Skeleton, PasswordStrength, useToast } from '../../components/shared';

const PASSWORD_REQUIREMENTS = 'Password must be at least 10 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.';

function getPasswordCriteria(value) {
  return {
    length: value.length >= 10,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[@$!%*?&]/.test(value)
  };
}

function formatLastActive(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${dateStr}, ${timeStr}`;
}

export default function AccountSettings({ user, profile, accessToken, onLogout, onUpdateProfile }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile'); // profile | security | sessions | danger

  // Profile form
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [timezone, setTimezone] = useState(profile?.timezone || '');
  const [language, setLanguage] = useState(profile?.language || 'English');
  const [careerGoal, setCareerGoal] = useState(profile?.career_goal || '');
  const [learningTrack, setLearningTrack] = useState(profile?.learning_track || '');
  const [experience, setExperience] = useState(profile?.experience || 'entry');
  const [techStack, setTechStack] = useState(profile?.tech_stack || '');
  const [preferredTime, setPreferredTime] = useState(profile?.preferred_time || '1 hour');
  const [profileSaving, setProfileSaving] = useState(false);

  // Security form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  // Danger zone
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const passwordCriteria = getPasswordCriteria(newPassword);
  const passwordScore = Object.values(passwordCriteria).filter(Boolean).length;
  const passwordMeetsPolicy = passwordScore === 5;
  const confirmMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const showNewPasswordError = passwordSubmitted && newPassword.length > 0 && !passwordMeetsPolicy;
  const showConfirmError = (passwordSubmitted || confirmMismatch) && newPassword !== confirmPassword;

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(false);
    try {
      const res = await apiFetch('/auth/sessions', { token: accessToken });
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
      } else {
        setSessionsError(true);
      }
    } catch {
      setSessionsError(true);
    } finally {
      setSessionsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (profileSaving) return;
    setProfileSaving(true);
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        token: accessToken,
        body: JSON.stringify({
          full_name: fullName,
          country,
          timezone,
          language,
          career_goal: careerGoal,
          learning_track: learningTrack,
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
    } catch {
      toast.error('Connection lost.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSubmitted(true);

    if (!oldPassword || !newPassword) {
      toast.error('Current and new password are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!passwordMeetsPolicy) {
      toast.error(PASSWORD_REQUIREMENTS);
      return;
    }

    if (passwordSaving) return;
    setPasswordSaving(true);
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
        setPasswordSubmitted(false);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to alter password.');
      }
    } catch {
      toast.error('Connection lost.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (revokingId) return;
    setRevokingId(sessionId);
    try {
      const res = await apiFetch(`/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        token: accessToken
      });

      if (res.ok) {
        setSessions(prev => (prev || []).filter(s => s.id !== sessionId));
        toast.success('Remote session terminated.');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to terminate device session.');
      }
    } catch {
      toast.error('Connection lost.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type "DELETE" exactly to confirm.');
      return;
    }

    if (deletingAccount) return;
    setDeletingAccount(true);
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
        setDeletingAccount(false);
      }
    } catch {
      toast.error('Failed to execute account deletion.');
      setDeletingAccount(false);
    }
  };

  const tabs = [
    { key: 'profile', label: 'Profile Settings', icon: User },
    { key: 'security', label: 'Security & Password', icon: Lock },
    { key: 'sessions', label: 'Active Sessions', icon: Server },
    { key: 'danger', label: 'Danger Zone', icon: Trash2, danger: true }
  ];

  const passwordToggle = (shown, onToggle, label) => (
    <button
      type="button"
      className="password-toggle-btn"
      onClick={onToggle}
      aria-label={shown ? `Hide ${label}` : `Show ${label}`}
      aria-pressed={shown}
    >
      {shown ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="settings-root fade-in">
      <header className="dashboard-header-row settings-header">
        <div>
          <h1 className="welcome-architect">Account Blueprint & Settings</h1>
          <p className="system-status font-mono">
            Identity node: <span className="text-glow-cyan">{user.username}</span> | Access level: {user.role?.toUpperCase()}
          </p>
        </div>
      </header>

      <div className="settings-layout">
        {/* Settings Navigation */}
        <aside className="glass-panel account-nav" aria-label="Account settings">
          {tabs.map(({ key, label, icon: Icon, danger }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`account-nav-btn font-sans ${danger ? 'account-nav-btn--danger' : ''} ${activeTab === key ? 'is-active' : ''}`}
              aria-current={activeTab === key ? 'true' : undefined}
            >
              <Icon size={14} aria-hidden="true" /> {label}
            </button>
          ))}
        </aside>

        {/* Settings Workspace */}
        <main className="glass-panel settings-panel">
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="atlas-stack settings-form">
              <div>
                <h3 className="settings-section-title">Profile Details</h3>
                <p className="settings-section-desc">How Atlas introduces you across the learning platform.</p>
              </div>

              <div className="atlas-two-col">
                <Field
                  label="FULL NAME"
                  required
                  className="font-mono"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  disabled={profileSaving}
                />

                <Field
                  label="COUNTRY"
                  required
                  className="font-mono"
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  disabled={profileSaving}
                />

                <Field
                  label="TIMEZONE"
                  required
                  className="font-mono"
                  hint="e.g. Asia/Kolkata or UTC+05:30"
                  type="text"
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  disabled={profileSaving}
                />

                <Field
                  label="LANGUAGE"
                  className="font-mono"
                  hint="Interface & content language preference"
                  type="text"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  disabled={profileSaving}
                />

                <Field
                  label="CAREER GOAL"
                  className="font-mono"
                  hint="Shown on your Career Readiness profile"
                  type="text"
                  value={careerGoal}
                  onChange={e => setCareerGoal(e.target.value)}
                  disabled={profileSaving}
                />

                <Field
                  label="LEARNING TRACK"
                  className="font-mono"
                  hint="Primary track your roadmap is built on"
                  type="text"
                  value={learningTrack}
                  onChange={e => setLearningTrack(e.target.value)}
                  disabled={profileSaving}
                />

                <Field
                  label="PREFERRED STUDY TIME"
                  as="select"
                  className="font-mono"
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                  disabled={profileSaving}
                >
                  <option value="30 mins">30 Minutes</option>
                  <option value="1 hour">1 Hour</option>
                  <option value="2 hours">2 Hours</option>
                  <option value="4 hours+">4+ Hours</option>
                </Field>

                <Field
                  label="PROGRAMMING LEVEL"
                  as="select"
                  className="font-mono"
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  disabled={profileSaving}
                >
                  <option value="entry">Entry-Level Developer (&lt; 1 yr)</option>
                  <option value="mid">Mid-Level Engineer (1-3 yrs)</option>
                  <option value="senior">Senior Software Engineer (3-5 yrs)</option>
                  <option value="lead">Lead Platform Architect (5+ yrs)</option>
                </Field>

                <Field
                  label="PREFERRED STACK (COMMA SEPARATED)"
                  className="font-mono span-2"
                  hint="e.g. React, Node.js, PostgreSQL"
                  type="text"
                  value={techStack}
                  onChange={e => setTechStack(e.target.value)}
                  disabled={profileSaving}
                />
              </div>

              <Button
                type="submit"
                variant="accent"
                block
                loading={profileSaving}
                className="font-sans settings-save-btn"
              >
                {profileSaving ? 'SYNCING CHANGES...' : 'SAVE BLUEPRINT CHANGES'}
              </Button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="atlas-stack settings-form" noValidate>
              <div>
                <h3 className="settings-section-title">Rotate Access Password</h3>
                <p className="settings-section-desc">
                  Your current password is required to rotate. The password policy is enforced on the server.
                </p>
              </div>

              <Field
                label="CURRENT PASSWORD"
                required
                className="font-mono password-field"
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                autoComplete="current-password"
                disabled={passwordSaving}
                icon={passwordToggle(showOld, () => setShowOld(v => !v), 'current password')}
              />

              <Field
                label="NEW COMPLEX PASSWORD"
                required
                className="font-mono password-field"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={passwordSaving}
                error={showNewPasswordError ? PASSWORD_REQUIREMENTS : undefined}
                icon={passwordToggle(showNew, () => setShowNew(v => !v), 'new password')}
              />

              {newPassword.length > 0 && (
                <PasswordStrength score={passwordScore} criteria={passwordCriteria} />
              )}

              <Field
                label="CONFIRM NEW PASSWORD"
                required
                className="font-mono password-field"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={passwordSaving}
                error={showConfirmError ? 'Passwords do not match.' : undefined}
                icon={passwordToggle(showConfirm, () => setShowConfirm(v => !v), 'password confirmation')}
              />

              <Alert variant="info">
                After a successful change, you may be asked to re-authenticate. Sessions on other devices are not
                automatically revoked by a password rotation.
              </Alert>

              <Button
                type="submit"
                variant="accent"
                block
                loading={passwordSaving}
                className="font-sans settings-save-btn"
              >
                {passwordSaving ? 'ROUTING SECURE PASSWORD...' : 'COMMENCE PASSWORD ROTATION'}
              </Button>
            </form>
          )}

          {activeTab === 'sessions' && (
            <div className="atlas-stack settings-sessions">
              <div>
                <h3 className="settings-section-title">Active System Sessions</h3>
                <p className="settings-section-desc">
                  Terminate access vectors remotely to protect node integrity.
                </p>
              </div>

              {sessionsLoading ? (
                <div className="settings-sessions-state" aria-hidden="true">
                  <Skeleton height="44px" />
                  <Skeleton height="44px" />
                  <Skeleton height="44px" />
                </div>
              ) : sessionsError ? (
                <StatePanel
                  variant="error"
                  title="Could not load sessions"
                  message="The session registry could not be reached. Try again in a moment."
                  action={
                    <Button size="sm" variant="secondary" className="font-mono" onClick={fetchSessions}>
                      <RefreshCw size={14} /> RETRY
                    </Button>
                  }
                />
              ) : !sessions || sessions.length === 0 ? (
                <StatePanel
                  variant="empty"
                  title="No active sessions"
                  message="No recorded device sessions are registered for this account."
                />
              ) : (
                <div className="admin-status-table settings-sessions-table">
                  <div className="table-row header font-mono">
                    <span>AGENT / OS</span>
                    <span>IP LOCATION</span>
                    <span>LAST ACTIVE</span>
                    <span>ACTIONS</span>
                  </div>
                  {sessions.map((sess) => (
                    <div key={sess.id} className="table-row align-center">
                      <span className="settings-session-agent" title={sess.user_agent || 'Unknown agent'}>{sess.user_agent || 'Unknown agent'}</span>
                      <span className="font-mono">{sess.ip_address || '—'}</span>
                      <span className="font-mono">{formatLastActive(sess.last_active)}</span>
                      <div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="font-mono"
                          loading={revokingId === sess.id}
                          disabled={revokingId !== null}
                          onClick={() => handleRevokeSession(sess.id)}
                          aria-label={`Revoke session from ${sess.user_agent}`}
                        >
                          REVOKE
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="settings-note font-mono">
                Revoked sessions leave this registry. To fully end access, rotate your password and log out from each
                device.
              </p>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="atlas-stack settings-form">
              <div>
                <h3 className="settings-section-title">Danger Zone</h3>
                <p className="settings-section-desc">
                  Irreversible account-level actions. These are protected by an extra confirmation step.
                </p>
              </div>

              <Alert variant="danger" title="Permanent Account Destruction">
                Cascade deletes your profile specifications, achievements, code submissions, and logs. This operation
                is irreversible and cannot be undone.
              </Alert>

              <div className="danger-zone-box">
                <div>
                  <h4 className="danger-zone-title">Delete this account</h4>
                  <p className="danger-zone-desc">
                    Once destroyed there is no way to recover your progress, XP, or submissions. Please be certain
                    before continuing.
                  </p>
                </div>
                <Button variant="danger" className="font-sans" onClick={() => setConfirmDeleteOpen(true)}>
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
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)} disabled={deletingAccount}>
              CANCEL
            </Button>
            <Button variant="danger" className="font-sans" loading={deletingAccount} onClick={handleDeleteAccount}>
              <Trash2 size={14} /> PERMANENTLY DELETE
            </Button>
          </>
        }
      >
        <p className="settings-modal-text">
          This operation irreversibly cascades and deletes your identity node. To proceed, type{' '}
          <span className="font-mono settings-modal-code">DELETE</span> below.
        </p>
        <Field
          label="TYPE 'DELETE' TO CONFIRM"
          className="font-mono"
          type="text"
          placeholder="DELETE"
          value={deleteConfirmText}
          onChange={e => setDeleteConfirmText(e.target.value)}
          autoComplete="off"
          disabled={deletingAccount}
        />
      </Modal>
    </div>
  );
}