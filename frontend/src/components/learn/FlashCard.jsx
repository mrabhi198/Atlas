import React, { useState, useEffect } from 'react';
import { RotateCw, Check, X, ThumbsUp } from 'lucide-react';

export default function FlashCard({ card, onRated }) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setFlipped(false);
  }, [card]);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFlip();
    }
  };

  const handleRate = (e, rating) => {
    e.stopPropagation();
    if (onRated) {
      onRated(rating);
    }
  };

  if (!card) return null;

  return (
    <div 
      className="flashcard-container" 
      style={{ 
        perspective: '1000px', 
        width: '100%', 
        height: '350px', 
        position: 'relative',
        cursor: 'pointer'
      }}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={flipped ? 'Flashcard answer shown. Press Enter or Space to flip back to question.' : 'Flashcard question. Press Enter or Space to reveal answer.'}
    >
      <div 
        className={`flashcard-inner ${flipped ? 'flipped' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front */}
        <div 
          className="flashcard-front glass-panel"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '30px',
            textAlign: 'center'
          }}
        >
          <p className="font-sans" style={{ fontSize: '18px', color: '#fff', marginBottom: '20px' }}>
            {card.front_content}
          </p>
          <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '12px', marginTop: 'auto' }}>
            <RotateCw size={14} /> Click to reveal answer
          </div>
        </div>

        {/* Back */}
        <div 
          className="flashcard-back glass-panel"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '30px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.03)'
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p className="font-sans" style={{ fontSize: '16px', color: 'var(--neon-cyan)', marginBottom: '10px' }}>
              {card.back_content}
            </p>
          </div>

          <div style={{ width: '100%', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            <p className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '12px' }}>HOW WELL DID YOU RECALL THIS?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={(e) => handleRate(e, 'again')}
                className="category-item-btn font-mono" 
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-red)' }}
              >
                <X size={14} /> AGAIN
              </button>
              <button 
                onClick={(e) => handleRate(e, 'hard')}
                className="category-item-btn font-mono" 
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}
              >
                HARD
              </button>
              <button 
                onClick={(e) => handleRate(e, 'good')}
                className="category-item-btn font-mono" 
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-cyan)' }}
              >
                <Check size={14} /> GOOD
              </button>
              <button 
                onClick={(e) => handleRate(e, 'easy')}
                className="category-item-btn font-mono" 
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-green)' }}
              >
                <ThumbsUp size={14} /> EASY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
