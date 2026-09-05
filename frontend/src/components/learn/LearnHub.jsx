import React, { useState, useEffect } from 'react';
import {
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
  Layout,
  BookmarkCheck,
  Play,
  GraduationCap
} from 'lucide-react';
import FlashCard from './FlashCard';
import { apiFetch } from '../../api/client';
import { Button, StatePanel, Skeleton, ProgressBar } from '../../components/shared';

const LESSON_STATUS_META = {
  completed: { label: 'Completed', color: 'var(--neon-green)' },
  in_progress: { label: 'In progress', color: 'var(--neon-cyan)' },
  available: { label: 'Not started', color: 'var(--text-secondary)' },
  locked: { label: 'Locked', color: 'var(--text-dim)' }
};

function bookmarkLabel(itemId) {
  if (itemId.startsWith('less_and_')) return itemId.replace('less_and_', 'Compose Lesson ');
  if (itemId.startsWith('less_back_')) return itemId.replace('less_back_', 'Kotlin Lesson ');
  return itemId;
}

function flattenTrackLessons(roadmap) {
  if (!roadmap) return [];
  return roadmap.modules.flatMap(m =>
    m.topics.flatMap(t => t.lessons.map(l => ({ ...l, moduleTitle: m.title })))
  );
}

export default function LearnHub({ accessToken, onNavigateToLesson }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Roadmap state
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapError, setRoadmapError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  const [activeSubTab, setActiveSubTab] = useState('roadmap'); // roadmap, revision, bookmarks

  // Revision States
  const [revisionLoading, setRevisionLoading] = useState(true);
  const [revisionError, setRevisionError] = useState(null);
  const [revisionQueue, setRevisionQueue] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);

  // Bookmarks State
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [bookmarksError, setBookmarksError] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);

  // Fetch Tracks
  const loadTracks = async () => {
    try {
      const res = await apiFetch('/tracks', { token: accessToken });
      if (res.ok) {
        const json = await res.json();
        setLoadError(null);
        setTracks(json);
        if (json.length > 0) {
          setSelectedTrack(prev => prev || json[0].id);
        }
      } else {
        setLoadError('Failed to map course blueprints.');
      }
    } catch (err) {
      console.error(err);
      setLoadError('Failed to map course blueprints.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Selected Track Roadmap
  const loadRoadmap = async (trackId) => {
    if (!trackId) return;
    setRoadmapLoading(true);
    setRoadmapError(null);
    try {
      const res = await apiFetch(`/tracks/${trackId}`, { token: accessToken });
      if (res.ok) {
        const json = await res.json();
        setRoadmap(json);
        const initExpanded = {};
        json.modules.forEach(m => {
          initExpanded[m.id] = true;
        });
        setExpandedModules(initExpanded);
      } else {
        setRoadmapError('Failed to load this track roadmap.');
      }
    } catch (err) {
      console.error(err);
      setRoadmapError('Failed to load this track roadmap.');
    } finally {
      setRoadmapLoading(false);
    }
  };

  // Fetch Revision Deck
  const loadRevisionQueue = async () => {
    setRevisionLoading(true);
    setRevisionError(null);
    try {
      const res = await apiFetch('/revision', { token: accessToken });
      if (res.ok) {
        const json = await res.json();
        setRevisionQueue(json.queue || []);
        setFlashcards(json.flashcards || []);
      } else {
        setRevisionError('Failed to synchronize your revision deck.');
      }
    } catch (err) {
      console.error(err);
      setRevisionError('Failed to synchronize your revision deck.');
    } finally {
      setRevisionLoading(false);
    }
  };

  // Fetch Bookmarked list
  const loadBookmarksList = async () => {
    setBookmarksLoading(true);
    setBookmarksError(null);
    try {
      const res = await apiFetch('/bookmarks', { token: accessToken });
      if (res.ok) {
        const json = await res.json();
        setBookmarks(json);
      } else {
        setBookmarksError('Failed to load your bookmarks.');
      }
    } catch (err) {
      console.error(err);
      setBookmarksError('Failed to load your bookmarks.');
    } finally {
      setBookmarksLoading(false);
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

  const handleCardRated = async (rating) => {
    const card = flashcards[currentCardIdx];
    try {
      await apiFetch('/revision/rate', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({ card_id: card.id || currentCardIdx, rating })
      });
    } catch (err) {
      console.error(err);
    }

    if (currentCardIdx < flashcards.length - 1) {
      setCurrentCardIdx(prev => prev + 1);
    } else {
      setCurrentCardIdx(0);
      loadRevisionQueue();
    }
  };

  // ---- Global loading (tracks) preserved page structure ----
  if (loading) {
    return (
      <div className="dashboard-root" aria-busy="true" aria-label="Loading learning hub">
        <div className="glass-panel" style={{ padding: '24px' }}>
          <Skeleton width="30%" height="28px" />
          <div style={{ marginTop: '12px' }}><Skeleton width="45%" height="14px" /></div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <Skeleton width="110px" height="34px" />
            <Skeleton width="130px" height="34px" />
            <Skeleton width="120px" height="34px" />
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton width="100%" height="56px" />
          {[0, 1, 2].map(i => <Skeleton key={i} width="100%" height="40px" />)}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="dashboard-root">
        <div className="glass-panel">
          <StatePanel
            variant="error"
            title="Learning Hub Sync Failure"
            message={`${loadError} Try again to reload your learning tracks.`}
            action={
              <Button
                variant="secondary"
                icon={<RefreshCw size={14} />}
                onClick={() => {
                  setLoadError(null);
                  setLoading(true);
                  loadTracks();
                }}
              >
                RETRY SYNC
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const selectedTrackMeta = tracks.find(t => t.id === selectedTrack) || null;

  // Derived learning position from the selected track roadmap
  const allLessons = flattenTrackLessons(roadmap);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter(l => l.status === 'completed').length;
  const inProgressLessons = allLessons.filter(l => l.status === 'in_progress').length;
  const trackPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const isLessonLocked = (lesson) => {
    if (!lesson.prerequisites) return false;
    return !roadmap.modules.some(m =>
      m.topics.some(t => t.lessons.some(l => l.id === lesson.prerequisites && l.status === 'completed'))
    );
  };

  const nextLesson = allLessons.find(l => l.status !== 'completed' && !isLessonLocked(l) && l.status !== 'available') ||
    allLessons.find(l => l.status !== 'completed' && !isLessonLocked(l));

  const renderTrackTabs = () => (
    <div className="learn-tabs" role="group" aria-label="Learning hub sections">
      <button
        onClick={() => setActiveSubTab('roadmap')}
        aria-pressed={activeSubTab === 'roadmap'}
        className={`category-item-btn font-mono ${activeSubTab === 'roadmap' ? 'active' : ''}`}
      >
        <Map size={13} aria-hidden="true" /> ROADMAP
      </button>
      <button
        onClick={() => setActiveSubTab('revision')}
        aria-pressed={activeSubTab === 'revision'}
        className={`category-item-btn font-mono ${activeSubTab === 'revision' ? 'active' : ''}`}
      >
        <Compass size={13} aria-hidden="true" /> REVISION CENTER ({flashcards.length})
      </button>
      <button
        onClick={() => setActiveSubTab('bookmarks')}
        aria-pressed={activeSubTab === 'bookmarks'}
        className={`category-item-btn font-mono ${activeSubTab === 'bookmarks' ? 'active' : ''}`}
      >
        <Bookmark size={13} aria-hidden="true" /> BOOKMARKS ({bookmarks.length})
      </button>
    </div>
  );

  const renderContinueBand = () => (
    <section className="glass-panel dash-continue" aria-label="Continue learning">
      <div className="dash-continue__action">
        <div className="dash-eyebrow">CONTINUE LEARNING · {selectedTrackMeta.title.toUpperCase()}</div>
        <h2 className="dash-continue__title">
          {nextLesson ? nextLesson.title : 'Track complete'}
        </h2>
        <p className="dash-continue__sub">
          {nextLesson
            ? `Next up in ${nextLesson.moduleTitle}.`
            : 'All lessons in this track are complete.'}
        </p>
        {nextLesson ? (
          <Button
            variant="accent"
            block
            className="dash-continue__cta"
            icon={<Play size={16} />}
            onClick={() => onNavigateToLesson(nextLesson.id)}
          >
            Continue Lesson
          </Button>
        ) : (
          <Button
            variant="accent"
            block
            className="dash-continue__cta"
            onClick={() => setActiveSubTab('revision')}
          >
            Review with Flashcards
          </Button>
        )}
      </div>
      <div className="dash-continue__plan">
        <div className="dash-eyebrow">TRACK PROGRESS</div>
        <div className="dash-continue__plan-count font-mono">
          {completedLessons} / {totalLessons} lessons complete
        </div>
        <ProgressBar value={trackPercent} label={`${selectedTrackMeta.title} progress`} color="var(--neon-purple)" thickness="10px" />
        <div className="dash-continue__plan-note">
          {inProgressLessons > 0
            ? `${inProgressLessons} lesson${inProgressLessons > 1 ? 's' : ''} in progress right now.`
            : totalLessons === 0
              ? 'This track has no lessons yet.'
              : 'No lessons started yet — pick one below to begin.'}
        </div>
      </div>
    </section>
  );

  const renderModuleCount = (module) => {
    const lessons = module.topics.flatMap(t => t.lessons);
    const done = lessons.filter(l => l.status === 'completed').length;
    if (lessons.length === 0) return null;
    return `${done}/${lessons.length}`;
  };

  const renderRoadmapView = () => {
    if (tracks.length === 0) {
      return (
        <div className="glass-panel">
          <StatePanel
            variant="empty"
            title="No Learning Tracks Available"
            message="Track blueprints will appear here once the platform publishes them."
          />
        </div>
      );
    }

    if (roadmapLoading) {
      return (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }} aria-busy="true">
          <Skeleton width="30%" height="24px" />
          <Skeleton width="100%" height="46px" />
          {[0, 1, 2].map(i => <Skeleton key={i} width="100%" height="38px" />)}
        </div>
      );
    }

    if (roadmapError) {
      return (
        <div className="glass-panel">
          <StatePanel
            variant="error"
            title="Track Roadmap Unavailable"
            message={roadmapError}
            action={
              <Button variant="secondary" size="sm" icon={<RefreshCw size={12} />} onClick={() => loadRoadmap(selectedTrack)}>
                Retry
              </Button>
            }
          />
        </div>
      );
    }

    if (!roadmap) {
      return (
        <div className="glass-panel">
          <StatePanel variant="empty" title="Select a Track" message="Choose a learning track above to see its roadmap." />
        </div>
      );
    }

    if (roadmap.modules.length === 0) {
      return (
        <div className="glass-panel">
          <StatePanel
            variant="empty"
            title="No Content in This Track Yet"
            message={`${roadmap.track.title} has no modules published yet. Choose another track to keep learning.`}
          />
        </div>
      );
    }

    return (
      <section className="glass-panel" aria-labelledby="learn-track-title">
        <div className="learn-track-head">
          <span className="learn-track-head__icon" aria-hidden="true">{roadmap.track.icon}</span>
          <div className="learn-track-head__body">
            <h2 id="learn-track-title" className="learn-track-head__title">{roadmap.track.title}</h2>
            <p className="learn-track-head__desc">{roadmap.track.description}</p>
            <div className="learn-track-head__stats font-mono">
              <span>{totalLessons} lessons</span>
              <span>{completedLessons} completed</span>
              <span>{inProgressLessons} in progress</span>
            </div>
            {totalLessons > 0 && (
              <ProgressBar value={trackPercent} label={`${roadmap.track.title} progress`} color="var(--neon-purple)" thickness="8px" />
            )}
          </div>
        </div>

        <div className="learn-modules">
          {roadmap.modules.map((mod, modIdx) => {
            const isOpen = !!expandedModules[mod.id];
            return (
              <div key={mod.id} className={`learn-module ${isOpen ? 'learn-module--open' : ''}`}>
                <button
                  type="button"
                  className="learn-module__bar"
                  onClick={() => toggleModule(mod.id)}
                  aria-expanded={isOpen}
                >
                  <span className="learn-module__bar-left">
                    {isOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
                    <span className="learn-module__badge font-mono">MODULE 0{modIdx + 1}</span>
                    <span className="learn-module__title">{mod.title}</span>
                  </span>
                  {renderModuleCount(mod) && (
                    <span className="learn-module__count font-mono">{renderModuleCount(mod)}</span>
                  )}
                </button>

                {isOpen && (
                  <div className="learn-module__body">
                    {mod.topics.length === 0 ? (
                      <p className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', padding: '8px 4px' }}>
                        No topics in this module yet.
                      </p>
                    ) : (
                      mod.topics.map(topic => (
                        <div key={topic.id} className="learn-topic">
                          <h3 className="learn-topic__title">
                            <Layout size={12} aria-hidden="true" />
                            {topic.title}
                          </h3>

                          <div className="learn-lessons">
                            {topic.lessons.map(lesson => {
                              const completed = lesson.status === 'completed';
                              const locked = isLessonLocked(lesson);
                              const inProgress = lesson.status === 'in_progress';
                              const status = locked ? LESSON_STATUS_META.locked
                                : completed ? LESSON_STATUS_META.completed
                                  : inProgress ? LESSON_STATUS_META.in_progress
                                    : LESSON_STATUS_META.available;

                              const openLesson = () => {
                                if (!locked) onNavigateToLesson(lesson.id);
                              };

                              return (
                                <div
                                  key={lesson.id}
                                  className={`learn-lesson ${completed ? 'learn-lesson--done' : ''} ${locked ? 'learn-lesson--locked' : ''} ${inProgress ? 'learn-lesson--active' : ''}`}
                                >
                                  <button
                                    type="button"
                                    className="learn-lesson__row"
                                    onClick={openLesson}
                                    disabled={locked}
                                    aria-label={`${status.label}: ${lesson.title}`}
                                  >
                                    <span className="learn-lesson__icon">
                                      {completed ? <CheckCircle size={16} style={{ color: status.color }} aria-hidden="true" />
                                        : locked ? <Lock size={16} style={{ color: status.color }} aria-hidden="true" />
                                          : <Unlock size={16} style={{ color: status.color }} aria-hidden="true" />}
                                    </span>
                                    <span className="learn-lesson__body">
                                      <span className="learn-lesson__status" style={{ color: status.color }}>
                                        {status.label}
                                      </span>
                                      <span className="learn-lesson__title">{lesson.title}</span>
                                      {inProgress && (
                                        <ProgressBar value={lesson.progressPercent} label={`${lesson.title} progress`} color="var(--neon-cyan)" thickness="5px" />
                                      )}
                                    </span>
                                    <span className="learn-lesson__meta font-mono">
                                      {lesson.estimated_time && (
                                        <span><Clock size={10} aria-hidden="true" /> {lesson.estimated_time}</span>
                                      )}
                                      {lesson.xp_reward && (
                                        <span className="learn-lesson__meta-xp"><Award size={10} aria-hidden="true" /> {lesson.xp_reward} XP</span>
                                      )}
                                    </span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderRevisionView = () => (
    <div className="learn-revision-grid">
      {/* Weak / review queue */}
      <section className="glass-panel" aria-labelledby="revision-queue-title">
        <h3 id="revision-queue-title" className="panel-caption__title">Upcoming Reviews</h3>

        {revisionLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} aria-busy="true">
            {[0, 1].map(i => <Skeleton key={i} width="100%" height="40px" />)}
          </div>
        ) : revisionError ? (
          <StatePanel
            variant="error"
            title="Revision Queue Unavailable"
            message={revisionError}
            action={
              <Button variant="secondary" size="sm" icon={<RefreshCw size={12} />} onClick={loadRevisionQueue}>
                Retry
              </Button>
            }
          />
        ) : revisionQueue.length === 0 ? (
          <StatePanel
            variant="empty"
            title="All Reviews Cleared"
            message="Lessons you complete are scheduled here for spaced review."
          />
        ) : (
          <div className="learn-queue">
            {revisionQueue.map(item => (
              <button
                key={item.id}
                type="button"
                className="learn-queue-item"
                onClick={() => onNavigateToLesson(item.id)}
              >
                <span className="learn-queue-item__body">
                  <span className="learn-queue-item__title">{item.title}</span>
                  <span className="learn-queue-item__meta font-mono">
                    {[item.estimated_time && `ESTIMATE: ${item.estimated_time}`, item.interval_days && `REVIEW CYCLE ${item.interval_days}d`]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <ChevronRight size={14} className="learn-queue-item__chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Flashcard deck */}
      <section className="glass-panel" aria-labelledby="deck-panel-title">
        <h3 id="deck-panel-title" className="panel-caption__title" style={{ textAlign: 'left' }}>Active Flashcard Deck</h3>

        {revisionLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} aria-busy="true">
            <Skeleton width="100%" height="90px" />
          </div>
        ) : revisionError ? (
          <StatePanel
            variant="error"
            title="Flashcard Deck Unavailable"
            message={revisionError}
            action={
              <Button variant="secondary" size="sm" icon={<RefreshCw size={12} />} onClick={loadRevisionQueue}>
                Retry
              </Button>
            }
          />
        ) : flashcards.length === 0 ? (
          <div className="learn-deck-empty">
            <BookmarkCheck size={36} style={{ color: 'var(--neon-green)', margin: '0 auto 12px' }} aria-hidden="true" />
            <p className="font-mono" style={{ fontSize: '12px' }}>Flashcard deck is fully reviewed. Complete more lessons to seed new review targets!</p>
          </div>
        ) : (
          <div>
            <div className="learn-deck-meta font-mono">
              <span>CARD {currentCardIdx + 1} OF {flashcards.length}</span>
              <span style={{ textTransform: 'uppercase' }}>DIFFICULTY: {flashcards[currentCardIdx].difficulty}</span>
            </div>
            <FlashCard card={flashcards[currentCardIdx]} onRated={handleCardRated} />
          </div>
        )}
      </section>
    </div>
  );

  const renderBookmarksView = () => (
    <section className="glass-panel" aria-labelledby="bookmarks-panel-title">
      <h3 id="bookmarks-panel-title" className="panel-caption__title">Bookmarked Resources</h3>

      {bookmarksLoading ? (
        <div className="learn-bookmarks-grid" aria-busy="true">
          {[0, 1, 2].map(i => <Skeleton key={i} width="100%" height="52px" />)}
        </div>
      ) : bookmarksError ? (
        <StatePanel
          variant="error"
          title="Bookmarks Unavailable"
          message={bookmarksError}
          action={
            <Button variant="secondary" size="sm" icon={<RefreshCw size={12} />} onClick={loadBookmarksList}>
              Retry
            </Button>
          }
        />
      ) : bookmarks.length === 0 ? (
        <StatePanel
          variant="empty"
          title="No Bookmarks Yet"
          message="Pin lessons you want to return to from inside any lesson to collect them here."
        />
      ) : (
        <div className="learn-bookmarks-grid">
          {bookmarks.map(b => {
            const isLesson = b.item_type === 'lesson';
            return isLesson ? (
              <button
                key={b.item_id}
                type="button"
                className="learn-bookmark"
                onClick={() => onNavigateToLesson(b.item_id)}
              >
                <span className="learn-bookmark__body">
                  <span className="learn-bookmark__type font-mono">{b.item_type.toUpperCase()}</span>
                  <span className="learn-bookmark__title">{bookmarkLabel(b.item_id)}</span>
                </span>
                <ChevronRight size={14} className="learn-queue-item__chevron" aria-hidden="true" />
              </button>
            ) : (
              <div key={b.item_id} className="learn-bookmark learn-bookmark--inert">
                <span className="learn-bookmark__body">
                  <span className="learn-bookmark__type font-mono">{b.item_type.toUpperCase()}</span>
                  <span className="learn-bookmark__title">{b.item_id}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="dashboard-root">
      {/* 1. Learning Hub Header */}
      <header className="dashboard-header-row learnhub-header">
        <div>
          <div className="learnhub-title-row">
            <GraduationCap size={26} className="neon-cyan" aria-hidden="true" />
            <h1 className="welcome-architect">Learning Hub</h1>
          </div>
          <p className="system-status">
            Explore {tracks.length} learning track{tracks.length === 1 ? '' : 's'}, resume lessons, and review with flashcards.
          </p>
        </div>

        <div className="track-selector" role="group" aria-label="Select a learning track">
          {tracks.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTrack(t.id)}
              aria-pressed={selectedTrack === t.id}
              className={`ctrl-btn font-mono ${selectedTrack === t.id ? 'active' : 'load'}`}
              style={{ padding: '8px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              <span aria-hidden="true">{t.icon}</span>
              <span>{t.title}</span>
            </button>
          ))}
        </div>
      </header>

      {/* 2. Continue Learning band (roadmap tab) */}
      {activeSubTab === 'roadmap' && roadmap && roadmap.modules.length > 0 && selectedTrackMeta && (
        renderContinueBand()
      )}

      {/* 3. Mode Tabs */}
      {renderTrackTabs()}

      {/* 4. Active View */}
      {activeSubTab === 'roadmap' && renderRoadmapView()}
      {activeSubTab === 'revision' && renderRevisionView()}
      {activeSubTab === 'bookmarks' && renderBookmarksView()}
    </div>
  );
}