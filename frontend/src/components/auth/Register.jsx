import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { Button, Field, Alert, PasswordStrength } from '../../components/shared';

export default function Register({ onNavigateToLogin }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [learningTrack, setLearningTrack] = useState('backend');

  const [usernameAvailable, setUsernameAvailable] = useState(null); // null, true, false
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });
  const [strengthScore, setStrengthScore] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Debounced Username Availability Check
  useEffect(() => {
    if (username.trim().length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const trimmed = username.trim();
    setUsernameChecking(true);
    let cancelled = false;

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiFetch(`/auth/check-username/${trimmed}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setUsernameAvailable(data.available);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setUsernameChecking(false);
      }
    }, 450); // 450ms debounce

    return () => {
      cancelled = true;
      clearTimeout(delayDebounce);
    };
  }, [username]);

  // Real-time password strength check
  useEffect(() => {
    const criteria = {
      length: password.length >= 10,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    setPasswordCriteria(criteria);

    const score = Object.values(criteria).filter(Boolean).length;
    setStrengthScore(score);
  }, [password]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg('');
    setSuccessMsg('');

    // Pre-submit validations
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (strengthScore < 5) {
      setErrorMsg('Password does not satisfy all core complexity guardrails.');
      return;
    }

    if (usernameAvailable === false) {
      setErrorMsg('Username is already claimed by another node.');
      return;
    }

    setIsLoading(true);

    const trackTitles = {
      android: 'Android Developer',
      backend: 'Backend Architect',
      web: 'Frontend Engineer',
      devops: 'DevOps Specialist',
      aiml: 'AI/ML Engineer'
    };

    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          username: username.trim(),
          password,
          full_name: fullName,
          career_goal: careerGoal,
          learning_track: trackTitles[learningTrack]
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        // Clear form
        setEmail('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setCareerGoal('');
      } else {
        setErrorMsg(data.error || 'Failed to initialize account.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(' Emitter Server offline. Verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-panel glass-panel fade-in" style={{ maxWidth: '520px' }}>
      <div className="onboarding-header">
        <Shield className="neon-purple" size={32} />
        <h2>Atlas: Candidate Signup</h2>
        <p>Register identity node inside learning mesh</p>
      </div>

      {errorMsg && (
        <Alert variant="danger" className="font-mono" style={{ fontSize: '11px', marginBottom: '16px' }}>
          {errorMsg}
        </Alert>
      )}

      {successMsg ? (
        <div className="text-center" style={{ padding: '20px 0' }}>
          <Alert variant="success" className="font-mono" style={{ fontSize: '12px', marginBottom: '24px', lineHeight: '1.6' }}>
            🎉 {successMsg}
          </Alert>
          <Button onClick={onNavigateToLogin} variant="accent" block className="font-sans">
            Proceed to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="credentials-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="atlas-two-col">
            <Field
              label="FULL NAME"
              required
              className="font-mono"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoComplete="name"
              style={{ background: '#020204' }}
            />

            <Field
              label="EMAIL ADDRESS"
              required
              className="font-mono"
              type="email"
              placeholder="dev@domain.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              style={{ background: '#020204' }}
            />

            <Field
              label={
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>USERNAME</span>
                  {usernameChecking && <span style={{ color: 'var(--neon-cyan)' }}>CHECKING REGISTRY...</span>}
                  {!usernameChecking && usernameAvailable === true && <span style={{ color: 'var(--neon-lime)' }}>✓ NODE AVAILABLE</span>}
                  {!usernameChecking && usernameAvailable === false && <span style={{ color: 'var(--neon-red)' }}>✗ NODE CLAIMED</span>}
                </span>
              }
              required
              className="font-mono span-2"
              type="text"
              placeholder="Pick alphanumeric handle"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              style={{ background: '#020204' }}
              maxLength={15}
              autoComplete="username"
            />

            <Field
              label="PASSWORD"
              required
              className="font-mono"
              type="password"
              placeholder="Min 10 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              style={{ background: '#020204' }}
            />

            <Field
              label="CONFIRM PASSWORD"
              required
              className="font-mono"
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              style={{ background: '#020204' }}
            />
          </div>

          {/* Password Strength Meter */}
          <PasswordStrength score={strengthScore} criteria={passwordCriteria} />

          <div className="atlas-two-col">
            <Field
              label="CAREER GOAL"
              className="font-mono"
              type="text"
              placeholder="e.g. Platform Engineer"
              value={careerGoal}
              onChange={e => setCareerGoal(e.target.value)}
              style={{ background: '#020204' }}
            />

            <Field
              label="LEARNING PATH"
              as="select"
              className="font-mono"
              value={learningTrack}
              onChange={e => setLearningTrack(e.target.value)}
              style={{ background: '#020204', padding: '12px' }}
            >
              <option value="backend">Backend Architect</option>
              <option value="android">Android Developer</option>
              <option value="web">Frontend Engineer</option>
              <option value="devops">DevOps Specialist</option>
              <option value="aiml">AI/ML Engineer</option>
            </Field>
          </div>

          <Button
            type="submit"
            variant="accent"
            block
            disabled={usernameAvailable === false}
            loading={isLoading}
            className="font-sans"
            style={{ padding: '12px', height: 'auto', textShadow: 'none', marginTop: '6px' }}
          >
            {isLoading ? 'ENROLLING NODE...' : 'INITIALIZE ACCOUNT bluePRINT'}
          </Button>

          <button 
            type="button" 
            onClick={onNavigateToLogin} 
            className="font-mono"
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '10px', cursor: 'pointer', marginTop: '10px' }}
          >
            ALREADY REGISTERED? RETURN TO SIGN IN
          </button>
        </form>
      )}
    </div>
  );
}