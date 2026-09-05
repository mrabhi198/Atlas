import React, { useState } from 'react';
import { BookOpen, AlertCircle, CheckCircle2, ChevronRight, Zap, Code, Shield } from 'lucide-react';

export default function LogicPractice() {
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [practiceStatus, setPracticeStatus] = useState({});

  const challenges = [
    {
      id: 'login',
      title: 'Build a login validation system',
      difficulty: 'BEGINNER',
      category: 'Security / RegEx',
      desc: 'Create secure validation patterns for email format, password entropy (special char, digit, length), and check for common SQL injection inputs.',
      realUse: 'Security gateway filters preventing illicit logins and SQL injection attacks before reaching authentication handlers.',
      codeTemplate: `fun validateLogin(email: String, passcode: String): Boolean {
    // Implement format checks and character restrictions
    val emailRegex = "^[A-Za-z0-9+_.-]+@(.+)$".toRegex()
    val isEmailValid = email.matches(emailRegex)
    
    // TODO: Verify passcode contains at least 8 chars, 1 digit, 1 special char
    return isEmailValid && passcode.length >= 8
}`,
      bestPractice: 'Always sanitize inputs on client-side for immediate UX feedback, and re-validate on server-side to prevent security bypasses. Use parameterized queries in databases.'
    },
    {
      id: 'sort',
      title: 'Sort Instagram followers efficiently',
      difficulty: 'MEDIUM',
      category: 'Algorithms / Big O',
      desc: 'Users report sorted list displays are slow. Re-implement sorting logic from O(N^2) bubble sort to O(N log N) quicksort/mergesort for active follower indexes.',
      realUse: 'Speeding up feed rendering and follower grids where lists scale up to millions of nodes.',
      codeTemplate: `fun sortFollowers(followers: MutableList<User>) {
    // TODO: Re-implement using quicksort or mergesort
    // Current: Bubble sort O(N^2) complexity
    for (i in 0 until followers.size) {
        for (j in 0 until followers.size - i - 1) {
            if (followers[j].username > followers[j+1].username) {
                val temp = followers[j]
                followers[j] = followers[j+1]
                followers[j+1] = temp
            }
        }
    }
}`,
      bestPractice: 'JVM uses Dual-Pivot Quicksort. For custom UI rendering, ensure sorting is done on background threads or offloaded to index databases to keep the UI frame rate at 60fps.'
    },
    {
      id: 'notify',
      title: 'Design a notification system',
      difficulty: 'MEDIUM',
      category: 'Systems / PubSub',
      desc: 'Implement a pub-sub observer pattern to dispatch push notifications, emails, and SMS alerts to users based on custom notification preferences.',
      realUse: 'Decoupling notification triggers (likes, comments) from delivery handlers, preventing synchronous API blocks.',
      codeTemplate: `class NotificationService : Subject {
    private val observers = mutableListOf<Observer>()
    
    fun registerObserver(observer: Observer) {
        observers.add(observer)
    }
    
    // TODO: Dispatch payload to appropriate channels
    fun notifyUsers(payload: NotificationPayload) {
        for (obs in observers) {
            obs.update(payload)
        }
    }
}`,
      bestPractice: 'Use asynchronous task queues (like Celery or RabbitMQ) and batch notifications together to avoid rate limits on SMS and email gateways.'
    },
    {
      id: 'api-opt',
      title: 'Optimize API responses',
      difficulty: 'HARD',
      category: 'Networking / Serialization',
      desc: 'Optimize heavy JSON response structures. Reduce response payload size by stripping redundant fields, implementing gzip compressions, and caching static resources.',
      realUse: 'Reducing mobile bandwidth usage and cutting API cloud server hosting expenses.',
      codeTemplate: `fun serializeResponse(user: UserProfile): String {
    // TODO: Minimize JSON fields for mobile clients
    // Strip heavy historical log fields. Only return critical info.
    return Gson().toJson(user)
}`,
      bestPractice: 'Consider migrating to Protocol Buffers or GraphQL for mobile client endpoints to allow clients to request only the exact fields they need.'
    },
    {
      id: 'memory-leak',
      title: 'Fix mobile app memory leaks',
      difficulty: 'HARD',
      category: 'Memory Management',
      desc: 'Debug a garbage collection leak where context objects are held by static variables, causing Out Of Memory (OOM) crashes on rotation.',
      realUse: 'Retaining active users by preventing app crashes due to memory resource leaks.',
      codeTemplate: `class MainActivity : AppCompatActivity() {
    companion object {
        // WARNING: Holding static reference to Activity context!
        // TODO: Replace with WeakReference or remove static variable.
        var activeContext: Context? = null
    }
}`,
      bestPractice: 'Never hold static references to Views, Contexts, or Activities. Always unregister broadcast receivers and listeners inside onDestroy() hooks.'
    }
  ];

  const handleVerify = (id) => {
    setPracticeStatus(prev => ({
      ...prev,
      [id]: 'VERIFIED'
    }));
  };

  return (
    <div className="practice-root">
      <header className="practice-header glass-panel">
        <BookOpen size={24} className="neon-purple" />
        <div>
          <h2>Logic Building Sandbox</h2>
          <p>Practice bite-sized problems inspired by real-world engineering challenges.</p>
        </div>
      </header>

      <div className="practice-layout">
        {/* Left Challenges list */}
        <div className="challenges-list">
          {challenges.map(c => {
            const status = practiceStatus[c.id];
            return (
              <div 
                key={c.id} 
                className={`challenge-row glass-panel ${selectedChallenge?.id === c.id ? 'active' : ''}`}
                onClick={() => setSelectedChallenge(c)}
              >
                <div className="row-header">
                  <div className="category font-mono">{c.category}</div>
                  <span className={`diff-tag ${c.difficulty.toLowerCase()} font-mono`}>
                    {c.difficulty}
                  </span>
                </div>
                <h3 className="row-title">{c.title}</h3>
                <p className="row-excerpt">{c.desc.slice(0, 85)}...</p>
                <div className="row-footer">
                  <span className="verify-status font-mono">
                    {status === 'VERIFIED' ? (
                      <span className="text-glow-green">✔ VERIFIED</span>
                    ) : (
                      <span className="text-glow-blue">⏳ READY</span>
                    )}
                  </span>
                  <ChevronRight size={14} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Details Sandbox */}
        <div className="challenge-details">
          {selectedChallenge ? (
            <div className="details-panel glass-panel">
              <div className="panel-header">
                <h2>{selectedChallenge.title}</h2>
                <div className="tags">
                  <span className="tag font-mono">{selectedChallenge.category}</span>
                  <span className="tag font-mono">{selectedChallenge.difficulty}</span>
                </div>
              </div>

              <div className="details-section">
                <h4>Ecosystem Context (Why it matters)</h4>
                <p>{selectedChallenge.realUse}</p>
              </div>

              <div className="details-section">
                <h4>Code Template</h4>
                <div className="code-block font-mono">
                  <pre>{selectedChallenge.codeTemplate}</pre>
                </div>
              </div>

              <div className="details-section">
                <h4>AI Architect Guidance</h4>
                <div className="tip-panel">
                  <AlertCircle size={16} className="neon-cyan" />
                  <p>{selectedChallenge.bestPractice}</p>
                </div>
              </div>

              <div className="panel-actions">
                {practiceStatus[selectedChallenge.id] === 'VERIFIED' ? (
                  <div className="success-badge font-mono">
                    <CheckCircle2 size={16} className="neon-green" />
                    <span>CHALLENGE VERIFIED IN PASSPORT (+250 XP)</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleVerify(selectedChallenge.id)} 
                    className="neon-btn accent"
                  >
                    <Code size={16} /> Run Static Code Verification
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-details glass-panel">
              <BookOpen size={48} className="neon-cyan pulse-border" style={{ borderRadius: '50%', padding: '10px' }} />
              <h3>Select a logic challenge from the list</h3>
              <p>Explore real-world engineering concepts and test your logical skills.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
