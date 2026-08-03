import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Map, 
  Compass, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Clock, 
  Award, 
  Bookmark, 
  ChevronDown, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Layout,
  BookmarkCheck
} from 'lucide-react';
import FlashCard from './FlashCard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export default function LearnHub({ accessToken, onNavigateToLesson, onNavigateToBookmarks }) {
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [activeSubTab, setActiveSubTab] = useState('roadmap'); // roadmap, revision, bookmarks
  
  // Revision States
  const [revisionQueue, setRevisionQueue] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState([]);

  // Fetch Tracks
  const loadTracks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tracks`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        setTracks(json);
        if (json.length > 0) {
          setSelectedTrack(json[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Selected Track Roadmap
  const loadRoadmap = async (trackId) => {
    if (!trackId) return;
    try {
      const res = await fetch(`${API_BASE}/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRoadmap(json);
        
        // Auto-expand modules on load
        const initExpanded = {};
        json.modules.forEach(m => {
          initExpanded[m.id] = true;
        });
        setExpandedModules(initExpanded);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Revision Deck
  const loadRevisionQueue = async () => {
    try {
      const res = await fetch(`${API_BASE}/revision`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRevisionQueue(json.queue || []);
        setFlashcards(json.flashcards || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Bookmarked list
  const loadBookmarksList = async () => {
    try {
      const res = await fetch(`${API_BASE}/bookmarks`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        setBookmarks(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadTracks();
      loadRevisionQueue();
      loadBookmarksList();
    }
  }, [accessToken]);

  useEffect(() => {
    if (selectedTrack) {
      loadRoadmap(selectedTrack);
    }
  }, [selectedTrack]);

  const toggleModule = (id) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTopic = (id) => {
    setExpandedTopics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCardRated = async (rating) => {
    // Spaced repetition action
    const card = flashcards[currentCardIdx];
    try {
      await fetch(`${API_BASE}/revision/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ card_id: card.id || currentCardIdx, rating })
      });
    } catch (err) {
      console.error(err);
    }

    if (currentCardIdx < flashcards.length - 1) {
      setCurrentCardIdx(prev => prev + 1);
    } else {
      // Completed current deck - reload
      setCurrentCardIdx(0);
      loadRevisionQueue();
    }
  };

  if (loading) {
    return (
      <div className="onboarding-root">
        <div className="onboarding-panel glass-panel text-center">
          <RefreshCw className="spin neon-cyan" size={32} style={{ margin: '0 auto 16px' }} />
          <p className="font-mono text-sm">Mapping course blueprints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root fade-in">
      
      {/* 1. Tracks Header Selector */}
      <header className="dashboard-header-row" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', alignItems: 'flex-start' }}>
        <div>
          <h1 className="welcome-architect">Educational Learning Hub</h1>
          <p className="system-status font-mono">
            Structured tracks for systems engineering pipelines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
          {tracks.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTrack(t.id)}
              className={`ctrl-btn font-mono ${selectedTrack === t.id ? 'active' : 'load'}`}
              style={{ padding: '8px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              <span>{t.icon}</span>
              <span>{t.title}</span>
            </button>
          ))}
        </div>
      </header>

      {/* 2. Mode Sub Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveSubTab('roadmap')}
          className={`category-item-btn font-mono ${activeSubTab === 'roadmap' ? 'active' : ''}`}
        >
          <Map size={13} style={{ marginRight: '6px' }} /> ROADMAP
        </button>
        <button
          onClick={() => setActiveSubTab('revision')}
          className={`category-item-btn font-mono ${activeSubTab === 'revision' ? 'active' : ''}`}
        >
          <Compass size={13} style={{ marginRight: '6px' }} /> REVISION CENTER ({flashcards.length})
        </button>
        <button
          onClick={() => setActiveSubTab('bookmarks')}
          className={`category-item-btn font-mono ${activeSubTab === 'bookmarks' ? 'active' : ''}`}
        >
          <Bookmark size={13} style={{ marginRight: '6px' }} /> BOOKMARKS
        </button>
      </div>

      {/* 3. Main Views Grid */}
      {activeSubTab === 'roadmap' && roadmap && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '32px' }}>{roadmap.track.icon}</span>
              <div>
                <h2 className="font-sans" style={{ fontSize: '18px', color: '#fff' }}>{roadmap.track.title}</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{roadmap.track.description}</p>
              </div>
            </div>

            {/* Hierarchical Roadmap Tree */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              {roadmap.modules.map((mod, modIdx) => (
                <div key={mod.id} style={{ border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                  
                  {/* Module Bar */}
                  <div 
                    onClick={() => toggleModule(mod.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 18px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {expandedModules[mod.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-mono" style={{ fontSize: '11px', color: 'var(--neon-purple)' }}>MODULE 0{modIdx + 1}</span>
                      <h3 className="font-sans" style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{mod.title}</h3>
                    </div>
                  </div>

                  {/* Topics List */}
                  {expandedModules[mod.id] && (
                    <div style={{ padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {mod.topics.map(topic => (
                        <div key={topic.id} style={{ marginLeft: '12px' }}>
                          <h4 className="font-sans" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Layout size={12} /> {topic.title}
                          </h4>

                          {/* Lessons inside topic */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '14px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                            {topic.lessons.map(lesson => {
                              const isCompleted = lesson.status === 'completed';
                              const isLocked = lesson.prerequisites && !roadmap.modules.some(m => 
                                m.topics.some(t => t.lessons.some(l => l.id === lesson.prerequisites && l.status === 'completed'))
                              );
                              
                              const handleLessonClick = () => {
                                if (isLocked) return;
                                onNavigateToLesson(lesson.id);
                              };

                              return (
                                <div
                                  key={lesson.id}
                                  onClick={handleLessonClick}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: isCompleted ? 'rgba(16, 185, 129, 0.03)' : isLocked ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.02)',
                                    border: isCompleted ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(255,255,255,0.05)',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    opacity: isLocked ? 0.45 : 1,
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    {isCompleted ? (
                                      <CheckCircle size={15} style={{ color: 'var(--neon-green)' }} />
                                    ) : isLocked ? (
                                      <Lock size={15} style={{ color: 'var(--text-dim)' }} />
                                    ) : (
                                      <Unlock size={15} style={{ color: 'var(--neon-cyan)' }} />
                                    )}
                                    <span className="font-sans" style={{ fontSize: '13px', color: '#fff' }}>{lesson.title}</span>
                                  </div>

                                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} className="font-mono">
                                    <span style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-dim)' }}>
                                      <Clock size={10} /> {lesson.estimated_time}
                                    </span>
                                    <span style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--neon-cyan)' }}>
                                      <Award size={10} /> {lesson.xp_reward} XP
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Revision Center Tab */}
      {activeSubTab === 'revision' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          
          {/* Weak / Incomplete topics */}
          <div className="glass-panel" style={{ textAlign: 'left' }}>
            <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff', marginBottom: '14px' }}>Weak Concept Revisions</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '16px' }}>Topics requiring recall focus based on study spacing schedules.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {revisionQueue.length === 0 ? (
                <p className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>All conceptual review targets completed.</p>
              ) : (
                revisionQueue.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => onNavigateToLesson(item.id)}
                    style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', display: 'flex', justifyItems: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ flex: 1 }}>
                      <span className="font-sans" style={{ fontSize: '12px', color: '#fff' }}>{item.title}</span>
                      <div className="font-mono" style={{ fontSize: '8px', color: 'var(--text-dim)', marginTop: '4px' }}>ESTIMATE: {item.estimated_time}</div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Flashcard Space */}
          <div className="glass-panel">
            <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff', marginBottom: '14px', textAlign: 'left' }}>Active Flashcard Deck</h3>
            {flashcards.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <BookmarkCheck size={36} style={{ color: 'var(--neon-green)', margin: '0 auto 12px' }} />
                <p className="font-mono" style={{ fontSize: '12px' }}>Flashcard deck is fully reviewed. Complete more lessons to seed new review targets!</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '14px' }} className="font-mono">
                  <span>CARD {currentCardIdx + 1} OF {flashcards.length}</span>
                  <span style={{ textTransform: 'uppercase' }}>DIFFICULTY: {flashcards[currentCardIdx].difficulty}</span>
                </div>

                <FlashCard 
                  card={flashcards[currentCardIdx]} 
                  onRated={handleCardRated}
                />
              </div>
            )}
          </div>

        </div>
      )}

      {/* Bookmarks Tab */}
      {activeSubTab === 'bookmarks' && (
        <div className="glass-panel" style={{ textAlign: 'left' }}>
          <h3 className="font-sans" style={{ fontSize: '15px', color: '#fff', marginBottom: '14px' }}>Bookmarked Resources</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '16px' }}>Pinned lessons and active developer references.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {bookmarks.length === 0 ? (
              <p className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', gridColumn: 'span 2' }}>No bookmarks pinned currently.</p>
            ) : (
              bookmarks.map((b, idx) => (
                <div 
                  key={idx}
                  onClick={() => b.item_type === 'lesson' && onNavigateToLesson(b.item_id)}
                  style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyItems: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ flex: 1 }}>
                    <span className="font-mono" style={{ fontSize: '9px', background: 'rgba(255,255,255,0.04)', padding: '2px 5px', borderRadius: '3px', color: 'var(--neon-cyan)', marginRight: '6px' }}>
                      {b.item_type.toUpperCase()}
                    </span>
                    <span className="font-sans" style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{b.item_id.replace('less_and_', 'Compose Lesson ').replace('less_back_', 'Kotlin Lesson ')}</span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
