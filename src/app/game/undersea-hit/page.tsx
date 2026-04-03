'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Clock, Coins, Target } from 'lucide-react';
import styles from './page.module.css';

const TOTAL_TIME = 30; // 30 seconds game
const HOLES_POSITIONS = [
  { left: '15%', bottom: '50px' },
  { left: '40%', bottom: '80px' },
  { left: '65%', bottom: '60px' },
  { left: '85%', bottom: '90px' },
  { left: '25%', bottom: '110px' },
  { left: '55%', bottom: '130px' },
  { left: '75%', bottom: '120px' },
];

export default function UnderseaEelHit() {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('IDLE');
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [isHit, setIsHit] = useState(false);
  
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eelTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random hole
  const showEel = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    
    // Choose a random hole different from current
    let nextHole;
    do {
      nextHole = Math.floor(Math.random() * HOLES_POSITIONS.length);
    } while (nextHole === activeHole);
    
    setActiveHole(nextHole);
    setIsHit(false);

    // Hide eel after a short random delay
    const duration = Math.max(800, 1500 - (score * 20)); // Gets faster with score
    eelTimerRef.current = setTimeout(() => {
      setActiveHole(null);
      // Wait a bit before showing next one
      setTimeout(showEel, 200 + Math.random() * 500);
    }, duration);
  }, [activeHole, gameState, score]);

  // Start the game
  const startGame = () => {
    setScore(0);
    setTimeLeft(TOTAL_TIME);
    setGameState('PLAYING');
    
    // Game clock
    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (gameTimerRef.current) clearInterval(gameTimerRef.current);
          setGameState('FINISHED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(showEel, 500);
  };

  // Handle hit
  const handleHit = (index: number) => {
    if (activeHole === index && !isHit && gameState === 'PLAYING') {
      setIsHit(true);
      setScore(s => s + 1);
      
      // Electric effect sound would go here
      
      // Move to next hole immediately
      if (eelTimerRef.current) clearTimeout(eelTimerRef.current);
      setTimeout(() => {
        setActiveHole(null);
        setTimeout(showEel, 100);
      }, 150);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (eelTimerRef.current) clearTimeout(eelTimerRef.current);
    };
  }, []);

  return (
    <div className={styles.pageContainer}>
      {/* Background Fish Animations */}
      <div className={styles.fish} style={{ top: '20%', animationDuration: '25s' }}>
        <FishSVG color="#ff5733" />
      </div>
      <div className={styles.fish} style={{ top: '45%', animationDuration: '40s', animationDelay: '-10s' }}>
        <FishSVG color="#33ffde" />
      </div>
      <div className={styles.fish} style={{ top: '70%', animationDuration: '30s', animationDelay: '-5s' }}>
        <FishSVG color="#fcd34d" />
      </div>

      {/* Decorative Bubbles */}
      {[...Array(15)].map((_, i) => (
        <div 
          key={i} 
          className={styles.bubble} 
          style={{ 
            left: `${Math.random() * 100}%`,
            width: `${10 + Math.random() * 20}px`,
            height: `${10 + Math.random() * 20}px`,
            animationDuration: `${5 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}

      {/* Game UI Header */}
      <div className={styles.gameHeader}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
          <ArrowLeft size={24} />
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <div className={styles.scoreLabel}>POINTS</div>
          <div className={styles.scoreValue}>{score}</div>
        </div>

        <div className={styles.timerContainer}>
          <div className={styles.scoreLabel}>TIME LEFT</div>
          <div className={`${styles.timer} ${timeLeft < 10 ? 'animate-pulse' : ''}`}>{timeLeft}s</div>
        </div>
      </div>

      {/* Main Game Stage */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '800px', height: '600px', flex: 1 }}>
        {HOLES_POSITIONS.map((pos, index) => (
          <div 
            key={index} 
            className={styles.rockHole} 
            style={{ left: pos.left, bottom: pos.bottom }}
          >
            {/* The Eel Fish */}
            <div 
              className={`${styles.eelHead} ${activeHole === index ? styles.eelActive : ''} ${isHit && activeHole === index ? styles.hitEffect : ''}`}
              onClick={() => handleHit(index)}
              style={{ bottom: activeHole === index ? '40px' : '-80px' }}
            >
              <div style={{ display: 'flex' }}>
                <div className={styles.eelEye} />
                <div className={styles.eelEye} />
              </div>
              <div className={styles.eelMouth} />
              {/* Electric Sparks Placeholder using shadow */}
              {activeHole === index && <div style={{ 
                position: 'absolute', inset: 0, 
                borderRadius: 'inherit',
                boxShadow: isHit ? '0 0 40px #fcd34d, 0 0 80px #fcd34d' : 'none',
                opacity: 0.6, pointerEvents: 'none'
              }} />}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.seaBase} />

      {/* Start Overlay */}
      {gameState === 'IDLE' && (
        <div className={styles.overlay}>
          <Target size={80} color="#0ea5e9" style={{ marginBottom: '20px' }} />
          <h1 style={{ fontSize: '3rem', fontWeight: 900 }}>Undersea Hit</h1>
          <p style={{ color: '#94a3b8', maxWidth: '300px' }}>Hit as many electric eels as you can in 30 seconds!</p>
          <div className={styles.amountInfo}>Entry Fee: ₹10.00</div>
          <button className={styles.startBtn} onClick={startGame}>Start Game</button>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'FINISHED' && (
        <div className={styles.overlay}>
          <Trophy size={80} color="#fcd34d" style={{ marginBottom: '20px' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Game Over!</h1>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Total Score: <span style={{ color: 'white', fontWeight: 700 }}>{score}</span></p>
          <div style={{ marginTop: '20px', fontSize: '1.5rem', color: '#10b981', fontWeight: 800 }}>
            Won: ₹{(score * 0.50).toFixed(2)}
          </div>
          <button className={styles.startBtn} onClick={() => router.push('/')}>Go to Dashboard</button>
          <button 
            style={{ marginTop: '15px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            onClick={startGame}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Water Overlay texture */}
      <div 
        style={{ 
          position: 'fixed', inset: 0, 
          background: 'radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.1), transparent)',
          pointerEvents: 'none', zIndex: 100
        }} 
      />
    </div>
  );
}

function FishSVG({ color }: { color: string }) {
  return (
    <svg width="60" height="30" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 20C50 28 40 35 25 35C10 35 0 28 0 20C0 12 10 5 25 5C40 5 50 12 50 20Z" fill={color} />
      <path d="M45 20L60 10V30L45 20Z" fill={color} />
      <circle cx="10" cy="15" r="3" fill="white" />
      <circle cx="11" cy="15" r="1.5" fill="black" />
    </svg>
  );
}

