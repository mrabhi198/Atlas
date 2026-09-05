import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Bookmark, 
  BookmarkCheck,
  CheckCircle, 
  BookOpen,
  MessageSquare,
  Send,
  Trash2,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import { apiFetch } from '../../api/client';

export default function LessonViewer({ lessonId, accessToken, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  
  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      const res = await apiFetch(`/lessons/${lessonId}`, { token: accessToken });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      const res = await apiFetch('/bookmarks', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({ item_type: 'lesson', item_id: lessonId })
      });
      if (res.ok) {
        const json = await res.json();
        setData(prev => ({ ...prev, isBookmarked: json.isBookmarked }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await apiFetch(`/lessons/${lessonId}/notes`, {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({ text: newNote })
      });
      if (res.ok) {
        setNewNote('');
        loadLesson(); // Reload to get notes
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const res = await apiFetch(`/lessons/notes/${noteId}`, {
        method: 'DELETE',
        token: accessToken
      });
      if (res.ok) {
        loadLesson();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteLesson = async () => {
    try {
      const res = await apiFetch(`/lessons/${lessonId}/progress`, {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({ status: 'completed', progress_percent: 100, last_position: 100 })
      });
      if (res.ok) {
        loadLesson();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const res = await apiFetch('/quiz/submit', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({
          lesson_id: lessonId,
          answers: Object.keys(quizAnswers).map(qIdx => ({
            question_index: parseInt(qIdx),
            selected_option: quizAnswers[qIdx]
          }))
        })
      });
      if (res.ok) {
        const json = await res.json();
        setQuizResults(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="onboarding-root">
        <div className="onboarding-panel glass-panel text-center">
          <BookOpen className="neon-cyan" size={32} style={{ margin: '0 auto 16px' }} />
          <p className="font-mono text-sm">Initializing Learning Module...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.lesson) {
    return (
      <div className="onboarding-root">
        <div className="onboarding-panel glass-panel text-center">
          <AlertCircle className="neon-red" size={32} style={{ margin: '0 auto 16px' }} />
          <p className="font-mono text-sm">Failed to retrieve lesson sequence.</p>
          <button onClick={onBack} className="neon-btn secondary font-sans" style={{ marginTop: '16px' }}>Return to Hub</button>
        </div>
      </div>
    );
  }

  const { lesson, markdownContent, quiz, resources, notes, isBookmarked, progress } = data;
  const isCompleted = progress.status === 'completed';

  return (
    <div className="dashboard-root fade-in" style={{ padding: '20px 40px' }}>
      
      {/* Top Navigation & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={onBack} className="category-item-btn font-mono" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
          <ArrowLeft size={16} /> BACK TO HUB
        </button>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleToggleBookmark} 
            className="ctrl-btn font-mono" 
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isBookmarked ? <BookmarkCheck size={16} className="neon-cyan" /> : <Bookmark size={16} />}
            {isBookmarked ? 'BOOKMARKED' : 'BOOKMARK'}
          </button>

          <button 
            onClick={handleCompleteLesson} 
            className={`ctrl-btn font-mono ${isCompleted ? 'active' : 'load'}`} 
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={isCompleted}
          >
            <CheckCircle size={16} className={isCompleted ? "neon-green" : ""} />
            {isCompleted ? 'COMPLETED' : 'MARK COMPLETE'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px' }}>
        
        {/* Main Reading Area */}
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'left', minHeight: '600px' }}>
          <h1 className="font-sans" style={{ fontSize: '32px', color: '#fff', marginBottom: '8px' }}>{lesson.title}</h1>
          <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '30px', display: 'flex', gap: '16px' }}>
            <span>XP: {lesson.xp_reward}</span>
            <span>TIME: {lesson.estimated_time}</span>
          </div>

          <div className="markdown-body font-sans" style={{ lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '15px' }}>
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {markdownContent}
            </ReactMarkdown>
          </div>

          {/* Quiz Section */}
          {quiz && quiz.length > 0 && (
            <div style={{ marginTop: '50px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
              <h3 className="font-sans" style={{ fontSize: '20px', color: '#fff', marginBottom: '20px' }}>Knowledge Check</h3>
              
              {quiz.map((q, qIdx) => (
                <div key={qIdx} style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px' }}>
                  <p className="font-sans" style={{ color: '#fff', marginBottom: '14px', fontWeight: 'bold' }}>{qIdx + 1}. {q.question}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {q.options.map((opt, oIdx) => {
                      const isSelected = quizAnswers[qIdx] === oIdx;
                      let optionStyle = { 
                        padding: '12px', 
                        borderRadius: '6px', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        background: isSelected ? 'rgba(0, 243, 255, 0.1)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--text-dim)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      };

                      if (quizResults && quizResults.results) {
                        const resObj = quizResults.results.find(r => r.question_index === qIdx);
                        if (resObj && oIdx === q.correctAnswer) {
                          optionStyle.border = '1px solid var(--neon-green)';
                          optionStyle.background = 'rgba(16, 185, 129, 0.1)';
                        } else if (resObj && !resObj.is_correct && isSelected) {
                          optionStyle.border = '1px solid var(--neon-red)';
                          optionStyle.background = 'rgba(239, 68, 68, 0.1)';
                        }
                      }

                      return (
                        <div 
                          key={oIdx} 
                          onClick={() => !quizResults && setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                          style={optionStyle}
                          className="font-sans"
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </div>
                      );
                    })}
                  </div>

                  {quizResults && quizResults.results && (
                    <div className="font-sans" style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-dim)', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      {quizResults.results.find(r => r.question_index === qIdx)?.is_correct 
                        ? <span style={{ color: 'var(--neon-green)' }}>Correct! {q.explanation}</span> 
                        : <span style={{ color: 'var(--neon-red)' }}>Incorrect. {q.explanation}</span>}
                    </div>
                  )}
                </div>
              ))}

              {!quizResults && (
                <button 
                  onClick={handleSubmitQuiz}
                  className="neon-btn font-sans" 
                  style={{ marginTop: '10px' }}
                  disabled={Object.keys(quizAnswers).length < quiz.length}
                >
                  Submit Answers
                </button>
              )}
              {quizResults && (
                <div className="font-mono" style={{ marginTop: '20px', color: 'var(--neon-cyan)', fontSize: '14px' }}>
                  Score: {quizResults.score_percent}% (+{quizResults.xp_awarded} XP)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Notes Panel */}
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'left' }}>
            <h4 className="font-sans" style={{ fontSize: '14px', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={14} /> My Notes
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '14px' }}>
              {notes.length === 0 ? (
                <p className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>No notes saved.</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', position: 'relative' }}>
                    <p className="font-sans" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>{note.note_text}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-dim)' }}>
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                      <button onClick={() => handleDeleteNote(note.id)} style={{ background: 'transparent', border: 'none', color: 'var(--neon-red)', cursor: 'pointer', padding: '2px' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="atlas-input font-sans" 
                placeholder="Add a quick note..." 
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
              />
              <button type="submit" className="ctrl-btn load" style={{ padding: '8px' }}>
                <Send size={14} />
              </button>
            </form>
          </div>

          {/* Resources Panel */}
          {resources && resources.length > 0 && (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'left' }}>
              <h4 className="font-sans" style={{ fontSize: '14px', color: '#fff', marginBottom: '14px' }}>
                External Resources
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {resources.map(res => (
                  <a 
                    key={res.id} 
                    href={res.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: 'var(--neon-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px' }}
                  >
                    <BookOpen size={12} />
                    {res.title}
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
