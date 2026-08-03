import React, { useState, useEffect } from 'react';
import { Shield, Key, Cpu, UserCheck, Terminal, Award, ChevronRight } from 'lucide-react';

export default function Onboarding({ onComplete, onLogin }) {
  const [step, setStep] = useState(1);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [callsign, setCallsign] = useState('');
  const [selectedPath, setSelectedPath] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState([]);
  
  // Custom states for Admin login
  const [loginMode, setLoginMode] = useState('student'); // 'student' or 'admin'
  const [adminCallsign, setAdminCallsign] = useState('');

  // Paths list matching requirements
  const paths = [
    { id: 'android', title: 'Android Developer', tech: 'Kotlin, Jetpack Compose, Gradle, Git', desc: 'Build reactive mobile products.' },
    { id: 'backend', title: 'Backend Architect', tech: 'Kotlin, PostgreSQL, REST, Kafka, Spring', desc: 'Design scalable distributed pipelines.' },
    { id: 'web', title: 'Frontend Engineer', tech: 'React, TypeScript, CSS Layouts, Vite', desc: 'Craft high-fidelity web experiences.' },
    { id: 'devops', title: 'DevOps Specialist', tech: 'Docker, AWS, Kubernetes, CI/CD pipelines', desc: 'Automate system and deployment lifecycle.' },
    { id: 'aiml', title: 'AI/ML Engineer', tech: 'Python, PyTorch, Prompt API, Transformers', desc: 'Integrate cognitive on-device AI.' }
  ];

  // Simulator console logs for onboarding progression
  useEffect(() => {
    if (step === 2) {
      const logs = [
        'INITIALIZING DECRYPT SYSTEM...',
        'CONNECTING SECURE SOCKET TO ATLAS_CORE_NODE...',
        'BYPASSING PERMISSION BARRIERS [ OK ]',
        'DOWNLOADING CREDENTIAL MATRIX...',
        'SYSTEM INTEGRITY VERIFICATION IN PROGRESS...',
        'DECRYPTING SECURITY TOKEN 0x8F92E...'
      ];
      let delay = 0;
      setConsoleLogs([]);
      logs.forEach((log, index) => {
        setTimeout(() => {
          setConsoleLogs(prev => [...prev, log]);
          if (index === logs.length - 1) {
            setTimeout(() => setStep(3), 1000);
          }
        }, delay);
        delay += 500;
      });
    }
  }, [step]);

  // Scan simulation for step 5
  useEffect(() => {
    if (step === 5) {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep(6), 800);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleKeyPress = (num) => {
    if (passcode.length < 4) {
      setPasscode(prev => prev + num);
      setPasscodeError(false);
    }
  };

  const handleClear = () => {
    setPasscode('');
  };

  const handleLoginSubmit = async () => {
    if (loginMode === 'student') {
      if (passcode === '1337' || passcode.length === 4) {
        setStep(2);
      } else {
        setPasscodeError(true);
        setPasscode('');
      }
    } else {
      // Admin Mode authentication
      if (!adminCallsign.trim()) {
        alert('Please enter your Admin Callsign first.');
        return;
      }
      try {
        const res = await fetch('http://localhost:5001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callsign: adminCallsign.trim(),
            passcode
          })
        });

        if (res.ok) {
          const authUser = await res.json();
          onLogin(authUser);
        } else {
          setPasscodeError(true);
          setPasscode('');
          alert('ACCESS REJECTED: Invalid Callsign or security PIN.');
        }
      } catch (err) {
        console.error(err);
        alert('Ecosystem Compiler offline. Verify backend server is running on port 5001.');
      }
    }
  };

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    if (callsign.trim().length > 2) {
      setStep(4);
    }
  };

  const handlePathSelect = (pathId) => {
    setSelectedPath(pathId);
  };

  const handleFinish = () => {
    const selected = paths.find(p => p.id === selectedPath);
    onComplete({
      callsign: callsign || 'Architect',
      path: selected ? selected.title : 'Backend Architect',
      pathId: selectedPath || 'backend'
    });
  };

  return (
    <div className="onboarding-root">
      <div className="subtle-grid"></div>

      {step === 1 && (
        <div className="onboarding-panel glass-panel">
          <div className="onboarding-header">
            <Shield className="neon-purple" size={32} />
            <h2>Atlas: System Login</h2>
            <p>Access Level: {loginMode === 'admin' ? 'Administrative Operator' : 'Candidate Developer'}</p>
          </div>

          {/* Mode Switcher */}
          <div className="login-mode-toggle font-sans" style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#090b12', padding: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              type="button" 
              onClick={() => { setLoginMode('student'); setPasscode(''); setPasscodeError(false); }}
              className={`neon-btn ${loginMode === 'student' ? 'accent' : 'secondary'}`}
              style={{ flex: 1, padding: '8px', fontSize: '11px', textShadow: 'none', height: 'auto' }}
            >
              Student Node
            </button>
            <button 
              type="button" 
              onClick={() => { setLoginMode('admin'); setPasscode(''); setPasscodeError(false); }}
              className={`neon-btn ${loginMode === 'admin' ? 'accent' : 'secondary'}`}
              style={{ flex: 1, padding: '8px', fontSize: '11px', textShadow: 'none', height: 'auto' }}
            >
              Admin Console
            </button>
          </div>

          {/* Admin Callsign Field */}
          {loginMode === 'admin' && (
            <div className="form-group" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', width: '100%' }}>
              <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>ADMIN CALLSIGN</label>
              <input
                type="text"
                placeholder="e.g. Alex, Elena, Sarah"
                value={adminCallsign}
                onChange={e => setAdminCallsign(e.target.value)}
                className="tech-input font-mono"
                style={{ textTransform: 'none', background: '#020204' }}
              />
            </div>
          )}

          <div className="passcode-input-display" style={{ marginBottom: '16px' }}>
            <input 
              type="password" 
              value={passcode} 
              onChange={e => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="ENTER SECURE ACCESS CODE"
              className={passcodeError ? 'error font-mono' : 'font-mono'}
              style={{ letterSpacing: passcode ? '6px' : 'normal', textAlign: 'center', background: '#020204' }}
              maxLength={4}
            />
            {passcodeError && (
              <span className="error-text font-mono" style={{ fontSize: '10px' }}>
                {loginMode === 'admin' 
                  ? 'INVALID KEY SIGNATURE. DECRYPTION REJECTED.' 
                  : 'INVALID SIGNATURE. TRY AGAIN. (Hint: 1337 or any 4 digits)'}
              </span>
            )}
          </div>

          <div className="keypad" style={{ marginBottom: '16px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button key={num} onClick={() => handleKeyPress(num)} className="keypad-btn font-mono">
                {num}
              </button>
            ))}
            <button onClick={handleClear} className="keypad-btn action font-mono">CLR</button>
            <button onClick={() => handleKeyPress(0)} className="keypad-btn font-mono">0</button>
            <button 
              onClick={handleLoginSubmit} 
              disabled={passcode.length < 4}
              className="keypad-btn action submit font-mono"
            >
              ENT
            </button>
          </div>

          <div className="keypad-tip font-mono" style={{ fontSize: '9px' }}>
            {loginMode === 'admin' 
              ? 'ENTER ADMIN SEED ACCESS PASSCODE (e.g. Alex is 8200)' 
              : 'ENTER ANY 4-DIGIT SYSTEM PIN (Hint: 1337)'}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="onboarding-panel glass-panel terminal-recovery">
          <div className="onboarding-header">
            <Terminal className="neon-cyan" size={32} />
            <h2>Protocol Recovery</h2>
            <p>Decompressing secure signature files...</p>
          </div>

          <div className="terminal-screen font-mono">
            {consoleLogs.map((log, index) => (
              <div key={index} className="log-line">
                <span className="prompt">&gt;</span> {log}
              </div>
            ))}
            <div className="cursor-blink"></div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="onboarding-panel glass-panel">
          <div className="onboarding-header">
            <Key className="neon-purple" size={32} />
            <h2>Credential System</h2>
            <p>Register new identity on the security mesh.</p>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="credentials-form">
            <div className="form-group">
              <label>DEFINE YOUR CALLSIGN (NAME)</label>
              <input
                type="text"
                required
                placeholder="e.g. Architect, Cypher, Neo"
                value={callsign}
                onChange={e => setCallsign(e.target.value)}
                className="tech-input"
                maxLength={15}
              />
            </div>

            <div className="form-tip">
              Identity will be bound to your personal Engineering Passport.
            </div>

            <button type="submit" className="neon-btn font-sans" disabled={callsign.trim().length < 3}>
              INITIALIZE IDENTITY <ChevronRight size={16} />
            </button>
          </form>
        </div>
      )}

      {step === 4 && (
        <div className="onboarding-panel path-selection glass-panel">
          <div className="onboarding-header">
            <Cpu className="neon-cyan" size={32} />
            <h2>Node Registration</h2>
            <p>Select your career focus node in the ecosystem.</p>
          </div>

          <div className="paths-grid">
            {paths.map(p => (
              <div
                key={p.id}
                className={`path-card ${selectedPath === p.id ? 'active' : ''}`}
                onClick={() => handlePathSelect(p.id)}
              >
                <div className="path-header">
                  <h3>{p.title}</h3>
                  {selectedPath === p.id && <span className="checked-badge">SELECTED</span>}
                </div>
                <p className="path-desc">{p.desc}</p>
                <div className="path-tech">
                  <strong>STACK:</strong> {p.tech}
                </div>
              </div>
            ))}
          </div>

          <div className="action-row">
            <button onClick={() => setStep(3)} className="neon-btn secondary">
              BACK
            </button>
            <button 
              onClick={() => setStep(5)} 
              disabled={!selectedPath}
              className="neon-btn"
            >
              REGISTER NODE <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="onboarding-panel glass-panel validation-scanning">
          <div className="onboarding-header">
            <UserCheck className="neon-purple" size={32} />
            <h2>Identity Validation</h2>
            <p>Scanning signature for compliance constraints...</p>
          </div>

          <div className="scanner-container">
            <div className="scanner-lens">
              <div className="scan-line"></div>
            </div>
            <div className="scanner-progress-bar">
              <div className="progress-fill" style={{ width: `${scanProgress}%` }}></div>
            </div>
            <div className="scanner-percentage font-mono">{scanProgress}%</div>
          </div>

          <div className="scanner-details font-mono">
            <div>STATUS: {scanProgress < 100 ? 'VALIDATING CONTRACTS...' : 'COMPLETED'}</div>
            <div>STAGES: {scanProgress >= 30 ? '✔ DECRYPT' : '⏳ DECRYPT'} | {scanProgress >= 60 ? '✔ CERT' : '⏳ CERT'} | {scanProgress >= 90 ? '✔ BOUND' : '⏳ BOUND'}</div>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="onboarding-panel glass-panel welcome-core">
          <div className="onboarding-header">
            <Award className="neon-lime" size={48} style={{ filter: 'var(--glow-lime)' }} />
            <h2 className="welcome-title">Welcome to the Core</h2>
            <p>Node registered successfully in Atlas Mesh.</p>
          </div>

          <div className="summary-card">
            <div className="summary-field">
              <span className="label">CALLSIGN:</span>
              <span className="value text-glow-purple">{callsign}</span>
            </div>
            <div className="summary-field">
              <span className="label">ASSIGNED TRACK:</span>
              <span className="value text-glow-blue">
                {paths.find(p => p.id === selectedPath)?.title}
              </span>
            </div>
            <div className="summary-field">
              <span className="label">NODE ID:</span>
              <span className="value font-mono">NODE_DEVENTRY_09X</span>
            </div>
            <div className="summary-field">
              <span className="label">INITIAL RANK:</span>
              <span className="value text-glow-green">Junior Architect</span>
            </div>
          </div>

          <button onClick={handleFinish} className="neon-btn accent font-sans">
            ENTER DEV ENVIRONMENT
          </button>
        </div>
      )}
    </div>
  );
}
