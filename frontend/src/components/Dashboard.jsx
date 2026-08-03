import React, { useState, useEffect, useRef } from 'react';
import { Play, FileText, Cpu, Award, Zap, CheckCircle2, MessageSquare, Send, Share2, Compass, Database, GitMerge } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

export default function Dashboard({ user, accessToken, missionCompleted, onNavigateToIDE }) {
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'mentor',
      text: "Welcome back, Developer. I've analyzed your latest code repository."
    },
    {
      sender: 'mentor',
      text: missionCompleted 
        ? "Excellent job on resolving the O(N) performance bottleneck in the Instagram search engine! Your Trie prefix matching implementation is highly scalable."
        : "I noticed in your recent PR for follower search that you're iterating over the full dataset. Consider using a prefix tree (Trie) to reduce the lookup latency under the 5ms threshold."
    }
  ]);
  const [timeString, setTimeString] = useState('02:14:38');

  // Running mission timer
  useEffect(() => {
    const start = Date.now() - (2 * 3600 + 14 * 60 + 38) * 1000;
    const timer = setInterval(() => {
      const diff = Date.now() - start;
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimeString(`${hours}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch AI Mentor Chat History on boot
  useEffect(() => {
    if (user && user.id) {
      fetch(`${API_BASE}/mentor/history/${user.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('History fetch failed');
        })
        .then(data => {
          if (data && data.length > 0) {
            setChatMessages(data);
          }
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  // Scroll to bottom of chat area when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/mentor/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userId: user.id,
          message: userMsg
        })
      });

      if (res.ok) {
        const reply = await res.json();
        setChatMessages(prev => [...prev, reply]);
      } else {
        throw new Error('Chat API returned error');
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { 
        sender: 'mentor', 
        text: 'Cognitive Guide is currently offline. Please verify that your Node server is running on port 5001.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="dashboard-root">
      <header className="dashboard-header-row">
        <div>
          <h1 className="welcome-architect">Welcome back, {user.callsign || 'Architect'}.</h1>
          <p className="system-status font-mono">
            System status: <span className="text-glow-green">NOMINAL</span> | Track: {user.path || 'Backend Architect'} | {missionCompleted ? '0' : '1'} active mission pending review.
          </p>
        </div>
        <div className="header-meta">
          <div className="xp-badge font-mono">
            <Zap size={14} className="neon-lime" />
            <span>{user.xp.toLocaleString()} XP</span>
          </div>
          <div className="rank-badge font-mono">
            <Award size={14} className="neon-purple" />
            <span>LVL {user.level}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Active focus card */}
        <section className="active-focus-card glass-panel">
          <div className="card-header">
            <span className="pill-active font-mono">TODAY'S FOCUS</span>
            <div className="timer font-mono">
              Time Elapsed: <span className="time">{timeString}</span>
            </div>
          </div>
          <h2 className="mission-title">Scale Instagram Followers Search</h2>
          <p className="mission-desc">
            Optimize the follower search index to handle prefix match queries under 5ms. 
            Focus on index algorithms (Trie structures) and memory overhead efficiency.
          </p>
          <div className="mission-actions">
            <button onClick={onNavigateToIDE} className="neon-btn font-sans">
              <Play size={16} /> {missionCompleted ? 'Review Code Space' : 'Resume Mission'}
            </button>
            <div className="spec-indicator font-mono">
              <FileText size={16} />
              <span>Specs Loaded</span>
            </div>
          </div>
        </section>

        {/* Dynamic Nodes Visualizer */}
        <section className="nodes-visualizer glass-panel">
          <div className="visualizer-header">
            <h3>Secure Mesh Execution Map</h3>
            <span className="live-status font-mono">REAL-TIME</span>
          </div>
          <div className="canvas-wrapper">
            <svg viewBox="0 0 400 200" className="network-svg">
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Lines */}
              <line x1="50" y1="100" x2="150" y2="50" className={`net-line ${missionCompleted ? 'active' : ''}`} />
              <line x1="50" y1="100" x2="150" y2="150" className={`net-line ${!missionCompleted ? 'active' : ''}`} />
              <line x1="150" y1="50" x2="280" y2="80" className={`net-line ${missionCompleted ? 'active' : ''}`} />
              <line x1="150" y1="150" x2="280" y2="80" className={`net-line ${!missionCompleted ? 'active' : ''}`} />
              <line x1="280" y1="80" x2="350" y2="100" className="net-line active" />

              {/* Glowing pulses */}
              <circle cx="150" cy="50" r="15" fill="url(#glow)" className="net-pulse" />
              <circle cx="280" cy="80" r="15" fill="url(#glow)" className="net-pulse" />

              {/* Nodes */}
              <circle cx="50" cy="100" r="8" className="net-node verified" />
              <circle cx="150" cy="50" r="8" className={`net-node ${missionCompleted ? 'active' : ''}`} />
              <circle cx="150" cy="150" r="8" className={`net-node ${!missionCompleted ? 'active' : ''}`} />
              <circle cx="280" cy="80" r="8" className="net-node active" />
              <circle cx="350" cy="100" r="6" className="net-node end" />

              {/* Text labels */}
              <text x="50" y="85" className="net-label font-mono">INIT_NODE</text>
              <text x="130" y="32" className="net-label font-mono">TRIE_INDEX</text>
              <text x="130" y="180" className="net-label font-mono">LINEAR_SCAN</text>
              <text x="270" y="65" className="net-label font-mono">BENCHMARK</text>
            </svg>
          </div>
          <div className="visualizer-stats font-mono">
            <div>NODE COUNT: 50,000</div>
            <div>COGNITIVE LOAD: {missionCompleted ? 'OPTIMAL' : 'HIGH'}</div>
            <div>COMPILER: JVM 21</div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-container">
          {/* Engineering Maturity */}
          <div className="stat-card glass-panel">
            <h3 className="stat-label">ENGINEERING MATURITY</h3>
            <div className="maturity-circle-wrapper">
              <svg width="100" height="100" viewBox="0 0 100 100" className="maturity-ring">
                <circle cx="50" cy="50" r="40" className="ring-bg" />
                <circle cx="50" cy="50" r="40" className="ring-fill" style={{ strokeDashoffset: missionCompleted ? 120 : 260 }} />
              </svg>
              <div className="maturity-val">
                <span className="level font-mono">{user.role === 'super admin' ? 'Super' : user.role === 'mentor' ? 'Senior' : missionCompleted ? 'Mid' : 'Jr'}</span>
                <span className="desc">{user.role === 'super admin' ? 'Admin' : user.role === 'mentor' ? 'Mentor' : 'Architect'}</span>
              </div>
            </div>
            <div className="card-footer font-mono">
              ROLE: {user.role?.toUpperCase()}
            </div>
          </div>

          {/* Learning Velocity */}
          <div className="stat-card glass-panel">
            <h3 className="stat-label">LEARNING VELOCITY</h3>
            <div className="velocity-val font-mono">
              {missionCompleted ? '4.2x' : '2.8x'} <span className="delta">+14%</span>
            </div>
            <div className="velocity-chart">
              <div className="bar" style={{ height: '30%' }}></div>
              <div className="bar" style={{ height: '45%' }}></div>
              <div className="bar" style={{ height: '60%' }}></div>
              <div className="bar" style={{ height: '55%' }}></div>
              <div className="bar" style={{ height: '70%' }}></div>
              <div className="bar" style={{ height: missionCompleted ? '95%' : '65%' }}></div>
            </div>
            <div className="card-footer font-mono">PR MERGE INDEX: {missionCompleted ? '0.98' : '0.74'}</div>
          </div>

          {/* Code Quality */}
          <div className="stat-card glass-panel">
            <h3 className="stat-label">CODE QUALITY INDEX</h3>
            <div className="quality-val font-mono">
              {user.code_quality}%
            </div>
            <div className="quality-meta">
              {user.code_quality >= 90 ? (
                <div className="quality-status green font-mono">
                  <CheckCircle2 size={12} /> COMPLIANT
                </div>
              ) : (
                <div className="quality-status yellow font-mono">
                  ⚠ BOTTLENECK DETECTED
                </div>
              )}
            </div>
            <p className="quality-tip">
              {user.code_quality >= 90 
                ? 'Your code has passed all checks. Code complexity is minimized, memory overhead is O(L).'
                : 'Linear loop checks inside database query operations are triggering latency warnings.'}
            </p>
          </div>
        </section>

        {/* AI Mentor Insights */}
        <section className="ai-mentor-panel glass-panel">
          <div className="mentor-header">
            <Cpu className="neon-lime" size={20} />
            <h3>AI Mentor Insights</h3>
            <span className="status font-mono">ONLINE</span>
          </div>

          <div className="mentor-chat-area">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-bubble ${msg.sender}`}>
                {msg.sender === 'mentor' && <div className="mentor-label font-mono">COGNITIVE_GUIDE</div>}
                <p className="chat-text">{msg.text}</p>
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble mentor">
                <div className="mentor-label font-mono">COGNITIVE_GUIDE</div>
                <p className="chat-text typing-animation">Analyzing query parameters...</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="mentor-chat-form">
            <input
              type="text"
              placeholder="Ask AI Mentor for a hint or architecture advice..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="tech-input font-mono"
            />
            <button type="submit" className="send-btn neon-btn" disabled={isTyping}>
              <Send size={14} />
            </button>
          </form>
        </section>

        {/* Active Path & Pipeline */}
        <section className="active-path-panel glass-panel">
          <div className="panel-header">
            <Compass size={18} className="neon-purple" />
            <h3>Active Track Pipeline</h3>
          </div>

          <div className="pipeline-item current">
            <div className="pipeline-label font-mono">ACTIVE MODULE (Stage 4/8)</div>
            <h4 className="pipeline-title">Prefix Index & Trie Structures</h4>
            <div className="pipeline-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: missionCompleted ? '100%' : '50%' }}></div>
              </div>
              <span className="progress-percent font-mono">{missionCompleted ? '100%' : '50%'}</span>
            </div>
            <p className="pipeline-meta">Kotlin Fundamentals / Indexing Benchmarks</p>
          </div>

          <div className="pipeline-divider">
            <GitMerge size={14} />
          </div>

          <div className="pipeline-item next">
            <div className="pipeline-label font-mono">NEXT UP PIPELINE</div>
            <h4 className="pipeline-title">Implement GraphQL Federation</h4>
            <p className="pipeline-desc">Architect dynamic microservices federation using gateway routers.</p>
          </div>

          <div className="pipeline-item next">
            <h4 className="pipeline-title">Kafka Event Sourcing</h4>
            <p className="pipeline-desc">Configure message broker partitions and offsets for event logs.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
