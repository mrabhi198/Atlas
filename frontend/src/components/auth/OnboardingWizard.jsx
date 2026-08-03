import React, { useState } from 'react';
import { Shield, User, Globe, Cpu, Clock, ChevronRight } from 'lucide-react';

const AVATAR_PRESETS = [
  '👾', '🤖', '🚀', '🔮', '👽', '💀', '🦊', '⚡'
];

export default function OnboardingWizard({ user, accessToken, onComplete }) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(user.username);
  const [avatar, setAvatar] = useState('🤖');
  const [country, setCountry] = useState('United States');
  const [timezone, setTimezone] = useState('GMT-5');
  const [language, setLanguage] = useState('English');

  const [experience, setExperience] = useState('entry'); // entry, mid, senior, lead
  const [techStack, setTechStack] = useState('Kotlin, Java');

  const [preferredTime, setPreferredTime] = useState('1 hour'); // 30m, 1h, 2h, 4h
  const [careerGoal, setCareerGoal] = useState('Platform Architect');

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          full_name: fullName,
          avatar,
          country,
          timezone,
          language,
          experience,
          career_goal: careerGoal,
          learning_track: user.path || 'Backend Architect',
          preferred_time: preferredTime,
          tech_stack: techStack
        })
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        onComplete(updatedProfile);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to initialize profile blueprints.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to profile synchronizer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-panel glass-panel fade-in" style={{ maxWidth: '480px' }}>
      <div className="onboarding-header">
        <Shield className="neon-purple" size={32} />
        <h2>Developer Blueprint Wizard</h2>
        <p>Configuring stage {step} of 3</p>
      </div>

      {errorMsg && (
        <div className="admin-alert error font-mono" style={{ fontSize: '11px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {/* Step 1: Avatar & Identity */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div className="form-group">
            <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>SELECT AVATAR NODE</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
              {AVATAR_PRESETS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  style={{
                    fontSize: '24px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: avatar === av ? 'rgba(0, 229, 255, 0.1)' : '#020204',
                    border: avatar === av ? '1px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    width: '46px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
          </div>

          <button 
            type="button" 
            onClick={() => setStep(2)}
            className="neon-btn accent font-sans w-full"
            style={{ padding: '12px', height: 'auto', textShadow: 'none', marginTop: '10px' }}
          >
            NEXT: CODE EXPERIENCE <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Step 2: Experience & Stacks */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
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
            <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>PREFERRED TECH STACK (TAGS)</label>
            <input
              type="text"
              placeholder="e.g. Kotlin, React, Docker, Postgres"
              value={techStack}
              onChange={e => setTechStack(e.target.value)}
              className="tech-input font-mono"
              style={{ background: '#020204', textTransform: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="neon-btn secondary font-sans"
              style={{ flex: 1, padding: '12px', height: 'auto', textShadow: 'none' }}
            >
              Back
            </button>
            <button 
              type="button" 
              onClick={() => setStep(3)} 
              className="neon-btn accent font-sans"
              style={{ flex: 2, padding: '12px', height: 'auto', textShadow: 'none' }}
            >
              Next: Commit Study Time
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Commitment & Goals */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div className="form-group">
            <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>DAILY STUDY COMMITMENT</label>
            <select
              value={preferredTime}
              onChange={e => setPreferredTime(e.target.value)}
              className="tech-select font-mono"
              style={{ background: '#020204', padding: '12px' }}
            >
              <option value="30 mins">30 Minutes / day (Casual Learner)</option>
              <option value="1 hour">1 Hour / day (Steady Architect)</option>
              <option value="2 hours">2 Hours / day (Hyper Speed Mode)</option>
              <option value="4 hours+">4+ Hours / day (Full Sandbox Deep Dive)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>CAREER OBJECTIVE</label>
            <input
              type="text"
              placeholder="e.g. Lead Devops Architect"
              value={careerGoal}
              onChange={e => setCareerGoal(e.target.value)}
              className="tech-input font-mono"
              style={{ background: '#020204', textTransform: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={() => setStep(2)} 
              className="neon-btn secondary font-sans"
              style={{ flex: 1, padding: '12px', height: 'auto', textShadow: 'none' }}
            >
              Back
            </button>
            <button 
              type="button" 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="neon-btn accent font-sans"
              style={{ flex: 2, padding: '12px', height: 'auto', textShadow: 'none' }}
            >
              {isLoading ? 'SYNCING BLUEPRINT...' : 'INITIALIZE PROFILE'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
