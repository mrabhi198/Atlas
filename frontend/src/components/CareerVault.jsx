import React, { useState } from 'react';
import { Briefcase, ArrowRight, User, Terminal, Code, Award, CheckCircle, Database, HelpCircle } from 'lucide-react';

export default function CareerVault({ user, missionCompleted }) {
  const [activePrepTab, setActivePrepTab] = useState('system-design'); // system-design, debugging, resume
  const [selectedPrompt, setSelectedPrompt] = useState('autocomplete');
  const [dsaAnswer, setDsaAnswer] = useState('');
  const [dsaScore, setDsaScore] = useState(null);

  const dsaQuestion = {
    title: 'Spot the Memory Leak / Thread Safety Issue',
    code: `class UserActivityLogger {
    companion object {
        // Keeps track of user listener callbacks
        private val listeners = mutableListOf<OnLogListener>()

        fun register(listener: OnLogListener) {
            listeners.add(listener)
        }
    }
    
    // Note: No deregister/unregister logic implemented!
}`,
    bugExplanation: 'The static listeners list stores references to callbacks. In Android, if these callbacks hold references to Context/Activity, those objects will never be garbage collected, leading to OOM leakages.',
    correction: `fun unregister(listener: OnLogListener) {
    listeners.remove(listener)
}`
  };

  const handleVerifyDsa = () => {
    if (dsaAnswer.toLowerCase().includes('unregister') || dsaAnswer.toLowerCase().includes('leak') || dsaAnswer.toLowerCase().includes('remove')) {
      setDsaScore('CORRECT');
    } else {
      setDsaScore('INCORRECT');
    }
  };

  return (
    <div className="career-vault-root">
      <header className="career-header glass-panel">
        <Briefcase size={24} className="neon-purple" />
        <div>
          <h2>Career Readiness Vault</h2>
          <p>Prepare for system design interviews, pass technical assessments, and export your portfolio.</p>
        </div>
      </header>

      {/* Internal Tabs */}
      <div className="vault-tabs-nav font-mono">
        <button 
          onClick={() => setActivePrepTab('system-design')}
          className={`tab-btn ${activePrepTab === 'system-design' ? 'active' : ''}`}
        >
          System Design Mock
        </button>
        <button 
          onClick={() => setActivePrepTab('debugging')}
          className={`tab-btn ${activePrepTab === 'debugging' ? 'active' : ''}`}
        >
          DSA Assessment
        </button>
        <button 
          onClick={() => setActivePrepTab('resume')}
          className={`tab-btn ${activePrepTab === 'resume' ? 'active' : ''}`}
        >
          Resume Generator
        </button>
      </div>

      <div className="vault-content">
        {activePrepTab === 'system-design' && (
          <div className="system-design-workspace glass-panel">
            <div className="workspace-header">
              <h3>System Design Challenge: Scale Search Autocomplete</h3>
              <p>Design a system capable of handling 50k requests per second with less than 10ms network latency.</p>
            </div>

            {/* Interactive architecture blocks */}
            <div className="architecture-canvas">
              <div className="canvas-block client font-mono">
                <h4>CLIENT</h4>
                <p>Mobile/Web Client</p>
                <div className="connector">↓ API Call</div>
              </div>

              <div className="canvas-block gateway font-mono">
                <h4>API GATEWAY</h4>
                <p>Reverse Proxy / Rate Limiter</p>
                <div className="connector-row">
                  <div className="arrow-down">↓ Cache Hit</div>
                  <div className="arrow-down">↓ Cache Miss</div>
                </div>
              </div>

              <div className="canvas-row">
                <div className="canvas-block cache font-mono">
                  <h4>REDIS CACHE</h4>
                  <p>In-memory Tries</p>
                </div>
                <div className="canvas-block db font-mono">
                  <h4>CASSANDRA DB</h4>
                  <p>Persistent Logs</p>
                </div>
              </div>
            </div>

            <div className="system-best-practices">
              <h4>Design Insights</h4>
              <p>
                For search autocomplete, queries are highly repetitive. Using an in-memory database like Redis 
                configured with pre-calculated Trie indices ensures &lt;10ms query lookup speeds. Updates can be run 
                asynchronously using Kafka event streams to update the persistent DB records weekly.
              </p>
            </div>
          </div>
        )}

        {activePrepTab === 'debugging' && (
          <div className="debugging-assessment glass-panel">
            <h3>Technical Assessment Debugging</h3>
            <p>Spot the memory leak or structural flaw in the code snippet below.</p>

            <div className="code-display font-mono">
              <pre>{dsaQuestion.code}</pre>
            </div>

            <div className="answer-section">
              <label className="font-mono">ENTER COMPILER FIX / EXPLANATION:</label>
              <textarea
                placeholder="How do you fix this leak? Explain or provide code code..."
                value={dsaAnswer}
                onChange={e => setDsaAnswer(e.target.value)}
                className="tech-input font-mono"
              />
              <button onClick={handleVerifyDsa} className="neon-btn font-sans">
                Submit Code Fix
              </button>
            </div>

            {dsaScore === 'CORRECT' && (
              <div className="dsa-feedback success font-mono">
                <CheckCircle size={16} />
                <div>
                  <strong>ASSESSMENT PASSED:</strong> Excellent! Implementing a deregister listener pattern is 
                  essential to clear weak garbage-collection references.
                </div>
              </div>
            )}

            {dsaScore === 'INCORRECT' && (
              <div className="dsa-feedback fail font-mono">
                <HelpCircle size={16} />
                <div>
                  <strong>ASSESSMENT FAILED:</strong> Check for a way to clear observers in the companion object.
                </div>
              </div>
            )}
          </div>
        )}

        {activePrepTab === 'resume' && (
          <div className="resume-generator-panel glass-panel">
            <div className="resume-sheet font-sans">
              <div className="resume-header">
                <h2>{user.callsign.toUpperCase()}</h2>
                <p className="resume-title font-mono">{user.path} // Verified Node ID: NODE_0x78B9</p>
                <p className="resume-contact">Email: verified-dev@atlas.dev | Git Signature: verified-mesh-sign</p>
              </div>

              <hr />

              <div className="resume-section">
                <h3>VERIFIED ENGINEERING EXPERIENCE</h3>
                <div className="experience-item">
                  <div className="exp-header">
                    <h4>Atlas Learning Ecosystem - Sandboxed Developer</h4>
                    <span className="font-mono">2026-Present</span>
                  </div>
                  <ul className="exp-bullets">
                    <li>Optimized Instagram follower prefix lookup algorithms in Kotlin JVM, shifting search performance from $O(N)$ to O(L) time and reducing latency from 290ms to 1.25ms (under 5ms budget SLA).</li>
                    <li>Designed and implemented memory-efficient data trees (Tries), keeping JVM heap footprint under 4.8MB (within 10MB budget).</li>
                    <li>Mastered secure compiler environments and automated performance analysis benchmarks.</li>
                  </ul>
                </div>
              </div>

              <div className="resume-section">
                <h3>CORE CAPABILITIES</h3>
                <div className="capabilities-list font-mono">
                  <span>Trie Trees</span>
                  <span>Prefix Matches</span>
                  <span>Big-O Bounds</span>
                  <span>Garbage Collection Debugging</span>
                  <span>Observer Patterns</span>
                  <span>Kotlin JVM</span>
                  <span>React Hooks</span>
                  <span>Gradle builds</span>
                </div>
              </div>

              <div className="resume-section">
                <h3>EDUCATION & CERTIFICATIONS</h3>
                <p><strong>Atlas Verified Certificate</strong> - {user.path} Certification (Level 42 Architect, 4,250 XP)</p>
              </div>
            </div>

            <div className="actions">
              <button onClick={() => window.print()} className="neon-btn font-sans">
                Export to Print / PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
