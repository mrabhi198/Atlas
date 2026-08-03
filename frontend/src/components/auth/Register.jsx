import React, { useState, useEffect } from 'react';
import { Shield, Key, Mail, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';

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
    setUsernameChecking(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/auth/check-username/${username.trim()}`);
        if (res.ok) {
          const data = await res.json();
          setUsernameAvailable(data.available);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUsernameChecking(false);
      }
    }, 4500); // 450ms debounce
    return () => clearTimeout(delayDebounce);
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
      const res = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const getStrengthLabel = () => {
    if (strengthScore === 0) return { text: 'EMPTY', color: 'var(--text-dim)' };
    if (strengthScore <= 2) return { text: 'WEAK / COMPROMISED', color: 'var(--neon-red)' };
    if (strengthScore <= 4) return { text: 'MEDIUM COMPLEXITY', color: 'var(--neon-yellow)' };
    return { text: 'SECURE / STRONG', color: 'var(--neon-lime)' };
  };

  const labelMeta = getStrengthLabel();

  return (
    <div className="onboarding-panel glass-panel fade-in" style={{ maxWidth: '520px' }}>
      <div className="onboarding-header">
        <Shield className="neon-purple" size={32} />
        <h2>Atlas: Candidate Signup</h2>
        <p>Register identity node inside learning mesh</p>
      </div>

      {errorMsg && (
        <div className="admin-alert error font-mono" style={{ fontSize: '11px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {successMsg ? (
        <div className="text-center" style={{ padding: '20px 0' }}>
          <div className="admin-alert success font-mono" style={{ fontSize: '12px', marginBottom: '24px', lineHeight: '1.6' }}>
            🎉 {successMsg}
          </div>
          <button onClick={onNavigateToLogin} className="neon-btn accent font-sans w-full">
            Proceed to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="credentials-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>FULL NAME</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="tech-input font-mono"
                style={{ background: '#020204', textTransform: 'none' }}
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>EMAIL ADDRESS</label>
              <input
                type="email"
                required
                placeholder="dev@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="tech-input font-mono"
                style={{ background: '#020204', textTransform: 'none' }}
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left', gridColumn: 'span 2' }}>
              <label className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <span>USERNAME</span>
                {usernameChecking && <span style={{ color: 'var(--neon-cyan)' }}>CHECKING REGISTRY...</span>}
                {!usernameChecking && usernameAvailable === true && <span style={{ color: 'var(--neon-lime)' }}>✓ NODE AVAILABLE</span>}
                {!usernameChecking && usernameAvailable === false && <span style={{ color: 'var(--neon-red)' }}>✗ NODE CLAIMED</span>}
              </label>
              <input
                type="text"
                required
                placeholder="Pick alphanumeric handle"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="tech-input font-mono"
                style={{ background: '#020204', textTransform: 'none' }}
                maxLength={15}
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>PASSWORD</label>
              <input
                type="password"
                required
                placeholder="Min 10 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="tech-input font-mono"
                style={{ background: '#020204', textTransform: 'none' }}
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>CONFIRM PASSWORD</label>
              <input
                type="password"
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="tech-input font-mono"
                style={{ background: '#020204', textTransform: 'none' }}
              />
            </div>
          </div>

          {/* Password Strength Meter */}
          <div style={{ textAlign: 'left', background: '#080a12', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '6px' }} className="font-mono">
              <span>SECURITY RATING:</span>
              <span style={{ color: labelMeta.color }}>{labelMeta.text}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '10px' }}>
              {[1, 2, 3, 4, 5].map(stepIndex => (
                <div 
                  key={stepIndex} 
                  style={{ 
                    flex: 1, 
                    borderRadius: '2px',
                    background: stepIndex <= strengthScore ? labelMeta.color : 'rgba(255,255,255,0.05)',
                    transition: 'background 0.3s'
                  }} 
                />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '9px', color: 'var(--text-dim)' }} className="font-mono">
              <span style={{ color: passwordCriteria.length ? 'var(--neon-lime)' : '' }}>• 10+ Characters</span>
              <span style={{ color: passwordCriteria.upper ? 'var(--neon-lime)' : '' }}>• Uppercase Letter</span>
              <span style={{ color: passwordCriteria.lower ? 'var(--neon-lime)' : '' }}>• Lowercase Letter</span>
              <span style={{ color: passwordCriteria.number ? 'var(--neon-lime)' : '' }}>• Numeric Digit</span>
              <span style={{ color: passwordCriteria.special ? 'var(--neon-lime)' : '' }}>• Special Symbol (@$!%*?&)</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>CAREER GOAL</label>
              <input
                type="text"
                placeholder="e.g. Platform Engineer"
                value={careerGoal}
                onChange={e => setCareerGoal(e.target.value)}
                className="tech-input font-mono"
                style={{ background: '#020204', textTransform: 'none' }}
              />
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>LEARNING PATH</label>
              <select
                value={learningTrack}
                onChange={e => setLearningTrack(e.target.value)}
                className="tech-select font-mono"
                style={{ background: '#020204', padding: '12px' }}
              >
                <option value="backend">Backend Architect</option>
                <option value="android">Android Developer</option>
                <option value="web">Frontend Engineer</option>
                <option value="devops">DevOps Specialist</option>
                <option value="aiml">AI/ML Engineer</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || usernameAvailable === false}
            className="neon-btn accent font-sans w-full"
            style={{ padding: '12px', height: 'auto', textShadow: 'none', marginTop: '6px' }}
          >
            {isLoading ? 'ENROLLING NODE...' : 'INITIALIZE ACCOUNT bluePRINT'}
          </button>

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
