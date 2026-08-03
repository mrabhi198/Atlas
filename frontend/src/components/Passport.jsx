import React, { useState } from 'react';
import { Award, User, Code, Calendar, CheckCircle2, ShieldAlert, Cpu, Copy, Check } from 'lucide-react';

export default function Passport({ user, missionCompleted }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://atlas.dev/passport/${user.callsign.toLowerCase()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="passport-root">
      <header className="passport-header glass-panel">
        <div className="profile-badge">
          <div className="passport-avatar font-mono">
            {user.callsign[0]?.toUpperCase() || 'A'}
          </div>
          <div className="profile-info">
            <h1 className="passport-name">{user.callsign || 'Architect'}</h1>
            <p className="passport-title font-mono">{user.path || 'Backend Architect'}</p>
            <p className="passport-id font-mono">ID: SECURE_NODE_0x78B9</p>
          </div>
        </div>

        <div className="passport-actions">
          <button onClick={handleCopyLink} className="neon-btn font-sans">
            {copied ? (
              <>
                <Check size={16} className="neon-green" /> Copied!
              </>
            ) : (
              <>
                <Copy size={16} /> Share Engineering Passport
              </>
            )}
          </button>
        </div>
      </header>

      <div className="passport-layout">
        {/* Left Side: Summary & Verify proofs */}
        <div className="passport-main">
          {/* Verified Achievements */}
          <section className="passport-section glass-panel">
            <h3 className="section-title">Verified Engineering Accomplishments</h3>
            <div className="accomplishment-list">
              <div className="accomplishment-item verified">
                <div className="item-header">
                  <div className="title-row">
                    <CheckCircle2 size={16} className="neon-green" />
                    <h4>System Initialization & Core Registry</h4>
                  </div>
                  <span className="date font-mono">2026-08-03</span>
                </div>
                <p className="item-desc">
                  Authenticated against security protocols, registered developer node Call Sign, 
                  and initialized personalized career roadmap in the Atlas Learning mesh.
                </p>
                <div className="proof-footer font-mono">
                  VERIFIED BY: ATLAS_SECURITY_GATEWAY // HASH: 0x90F9B2...
                </div>
              </div>

              {missionCompleted ? (
                <div className="accomplishment-item verified">
                  <div className="item-header">
                    <div className="title-row">
                      <CheckCircle2 size={16} className="neon-green" />
                      <h4>Scale Instagram Followers Search</h4>
                    </div>
                    <span className="date font-mono">2026-08-03</span>
                  </div>
                  <p className="item-desc">
                    Re-implemented a linear scanning search array using a multi-branch Trie Prefix Tree. 
                    Optimized execution latency from 290ms to 1.25ms (99.5% latency reduction), satisfying budget SLAs.
                  </p>
                  <div className="proof-footer font-mono">
                    VERIFIED BY: SECURE_JVM_COMPILER_V21 // HASH: 0xAEF28394BC
                  </div>
                </div>
              ) : (
                <div className="accomplishment-item pending">
                  <div className="item-header">
                    <div className="title-row">
                      <ShieldAlert size={16} className="neon-yellow" />
                      <h4>Scale Instagram Followers Search</h4>
                    </div>
                    <span className="date font-mono">PENDING RUN</span>
                  </div>
                  <p className="item-desc">
                    Optimization mission is currently in-progress. Implement index patterns in FollowerSearch.kt 
                    and execute compiler benchmarks to verify performance compliance.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Mastered Skills Grid */}
          <section className="passport-section glass-panel">
            <h3 className="section-title">Verified Skill Matrix</h3>
            <div className="skills-grid font-mono">
              <div className="skill-badge verified">Prefix Trie Indexing</div>
              <div className="skill-badge verified">Big O Complexity Analysis</div>
              <div className="skill-badge verified">Kotlin JVM Runtime</div>
              <div className="skill-badge verified">System Sandbox Auth</div>
              {missionCompleted && (
                <>
                  <div className="skill-badge verified">Index Sharding & Rebalancing</div>
                  <div className="skill-badge verified">Memory Heap Management</div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Right Side: Quick Stats & Architecture Patterns */}
        <div className="passport-sidebar">
          {/* Quick Metrics */}
          <section className="passport-section glass-panel stats-list">
            <h3 className="section-title">Ecosystem Metrics</h3>
            <div className="mini-stat font-mono">
              <span className="label">TOTAL XP:</span>
              <span className="value text-glow-purple">{missionCompleted ? '5,050 XP' : '4,250 XP'}</span>
            </div>
            <div className="mini-stat font-mono">
              <span className="label">MISSIONS PASSED:</span>
              <span className="value">{missionCompleted ? '1 / 1' : '0 / 1'}</span>
            </div>
            <div className="mini-stat font-mono">
              <span className="label">CODE QUALITY AVG:</span>
              <span className="value text-glow-green">{missionCompleted ? '94%' : '52%'}</span>
            </div>
            <div className="mini-stat font-mono">
              <span className="label">COMPILER COMPILES:</span>
              <span className="value">14 runs</span>
            </div>
          </section>

          {/* Architecture Patterns */}
          <section className="passport-section glass-panel">
            <h3 className="section-title">Architecture Patterns Mastered</h3>
            <div className="patterns-container font-mono">
              <div className="pattern-item">
                <Cpu size={14} className="neon-cyan" />
                <div>
                  <div className="name">Hierarchical Trie Indices</div>
                  <div className="use">String prefix matching optimization</div>
                </div>
              </div>
              <div className="pattern-item">
                <Code size={14} className="neon-cyan" />
                <div>
                  <div className="name">Secure Execution sandboxing</div>
                  <div className="use">Running arbitrary tests inside JVM limits</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
