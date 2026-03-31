'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Coins, Crosshair, Target as TargetIcon, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TargetTap() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(10);
  
  // 'setup' | 'playing' | 'processing' | 'result'
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'processing' | 'result'>('setup');
  const [timeLeft, setTimeLeft] = useState(15.00);
  const [score, setScore] = useState(0);
  
  // Dynamic CSS coordinate mappings to prevent click macros natively
  const [targetPos, setTargetPos] = useState({ top: '50%', left: '50%' });
  const [resultData, setResultData] = useState<any>(null);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize secure balance retrieval
  useEffect(() => {
    fetch('/api/user/profile').then(res => res.json()).then(data => {
      if (data.user) setBalance(data.user.walletBalance);
      else router.push('/login');
    });
  }, [router]);

  const startGame = () => {
    if (balance < bet) return toast.error('Insufficient real balance to play!');
    
    setBalance(prev => prev - bet); // Optimistic UX deduction
    setScore(0);
    setTimeLeft(15.0);
    setGameState('playing');
    moveTarget();
    
    startTimeRef.current = Date.now();
    
    // Heavy 60fps refresh clock
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, 15.0 - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        endGame(15000); // Trigger physical termination sequence payload
      }
    }, 50); 
  };

  const endGame = async (elapsedMs: number) => {
    clearInterval(timerRef.current);
    setGameState('processing');

    try {
      // POST direct verification metrics
      const res = await fetch('/api/game/target/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount: bet, score, timeElapsedMs: elapsedMs })
      });
      const data = await res.json();
      
      if (!data.success) {
        toast.error(data.error);
        setBalance(prev => prev + bet); // revert if errored structurally
        setGameState('setup');
        return;
      }
      
      setBalance(data.newBalance); // Sync true SQL ledger balance
      setResultData(data);
      setGameState('result');
      
      if (data.isBot) {
        toast.error("Auto-clicker macro detected! Score rejected automatically.");
      } else if (data.winAmount > 0) {
        toast.success(`Amazing! You secured ₹${data.winAmount}!`);
      } else {
        toast.error("You need at least 31 taps to break even.");
      }

    } catch(e) {
      toast.error('Network Error. Reverting.');
      setGameState('setup');
    }
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'playing') return;
    
    // Prevent double cascading events overriding physical inputs
    e.preventDefault(); 
    e.stopPropagation(); 
    
    setScore(prev => prev + 1);
    moveTarget();
  };

  const moveTarget = () => {
    if (!gameAreaRef.current) return;
    
    // Calculate physical bounding boxes keeping targets cleanly inside viewport
    const paddingX = 40; 
    const paddingY = 80;
    const width = Math.max(100, gameAreaRef.current.clientWidth - paddingX * 2);
    const height = Math.max(100, gameAreaRef.current.clientHeight - paddingY * 2);
    
    const randomX = Math.floor(Math.random() * width) + paddingX;
    const randomY = Math.floor(Math.random() * height) + paddingY;
    
    setTargetPos({ top: `${randomY}px`, left: `${randomX}px` });
  };

  // Add initial moveTarget call once mounted in 'playing' state
  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setTimeout(() => {
        moveTarget();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Housekeeping
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'radial-gradient(ellipse at bottom, #111827, #000000)', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Universal Safe Header */}
      <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 50 }}>
        <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%', border: 'none', color: 'white', cursor: 'pointer', transition: 'background 0.2s' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ fontWeight: '900', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px', background: 'linear-gradient(90deg, #f87171, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Target Tap
        </div>
        <div style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Coins size={16} color="white" /> ₹{balance.toFixed(2)}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        
        {/* GAME SETUP HUD */}
        {gameState === 'setup' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 80%)', padding: '20px', zIndex: 20 }}>
            <div style={{ position: 'relative', marginBottom: '30px' }}>
              <div style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', animation: 'pulse-ring 2s infinite' }} />
              <Crosshair size={90} color="#f87171" style={{ filter: 'drop-shadow(0 0 25px rgba(239,68,68,0.8))' }} />
            </div>
            
            <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '10px', textAlign: 'center', textShadow: '0 4px 20px rgba(0,0,0,0.5)', lineHeight: 1.1 }}>
               FASTEST <span style={{ color: '#ef4444' }}>FINGERS</span> WIN
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: '350px', fontSize: '1rem', marginBottom: '40px', lineHeight: 1.5 }}>
              Tap the moving target as fast as possible in 15 seconds. <strong style={{color: 'white'}}>60+ taps</strong> doubles your cash!
            </p>
            
            <div style={{ display: 'flex', gap: '15px', padding: '20px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', marginBottom: '40px' }}>
               {[10, 50, 100].map(amt => (
                <button 
                  key={amt}
                  onClick={() => setBet(amt)}
                  style={{ 
                    width: '90px', padding: '15px 0', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s',
                    background: bet === amt ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'rgba(0,0,0,0.5)', 
                    color: bet === amt ? 'white' : 'rgba(255,255,255,0.6)',
                    border: bet === amt ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: bet === amt ? '0 10px 20px rgba(239, 68, 68, 0.4)' : 'none',
                    transform: bet === amt ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  ₹{amt}
                </button>
               ))}
            </div>

            <button onClick={startGame} style={{ padding: '20px 60px', borderRadius: '30px', fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #f87171, #dc2626)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 15px 35px rgba(220, 38, 38, 0.5), inset 0 2px 10px rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px', transition: 'transform 0.2s' }}>
              Play Now
            </button>
          </div>
        )}

        {/* ACTIVE PLAY ARENA */}
        {gameState === 'playing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
            
            {/* Background Radar Animation */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '150vh', height: '150vh', marginLeft: '-75vh', marginTop: '-75vh', background: 'conic-gradient(from 0deg, transparent 70%, rgba(239, 68, 68, 0.1) 100%)', borderRadius: '50%', animation: 'radar 4s linear infinite', zIndex: 0, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%)', zIndex: 1, pointerEvents: 'none' }} />

            {/* Live Dashboard metrics */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 30px', background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10, backdropFilter: 'blur(5px)' }}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>TIME LEFT</span>
                 <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', color: timeLeft <= 5 ? '#f87171' : 'white', textShadow: timeLeft <= 5 ? '0 0 20px rgba(248,113,113,0.8)' : 'none' }}>
                   {timeLeft.toFixed(2)}<span style={{fontSize: '1rem'}}>s</span>
                 </span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                 <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>SCORE</span>
                 <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.6)', lineHeight: 1 }}>{score}</span>
               </div>
            </div>

            {/* Target Touch Surface Grid */}
            <div ref={gameAreaRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', touchAction: 'manipulation', zIndex: 10 }}>
               
               {/* The glowing target */}
               <button
                 onMouseDown={handleTap}
                 onTouchStart={handleTap}
                 style={{
                   position: 'absolute',
                   top: targetPos.top, left: targetPos.left,
                   transform: 'translate(-50%, -50%)',
                   width: '90px', height: '90px',
                   borderRadius: '50%',
                   background: 'radial-gradient(circle at center, #f87171 20%, #b91c1c 80%, #450a0a 100%)',
                   border: '6px solid white',
                   boxShadow: '0 0 30px rgba(239,68,68,1), inset 0 0 15px rgba(0,0,0,0.6), 0 0 0 15px rgba(239,68,68,0.2)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   cursor: 'crosshair', transition: 'none',
                   outline: 'none', padding: 0,
                 }}
               >
                 <div style={{ position: 'absolute', inset: '5px', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.5)', animation: 'radar 10s linear infinite' }} />
                 <TargetIcon size={45} color="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
               </button>

            </div>
          </div>
        )}

        {/* PROCESSING & RESULTS UI */}
        {(gameState === 'processing' || gameState === 'result') && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', padding: '20px', zIndex: 100 }}>
            
            {gameState === 'processing' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '6px solid rgba(255,255,255,0.05)', borderTopColor: '#f87171', animation: 'radar 1s linear infinite' }} />
                <h2 style={{ marginTop: '25px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '1px' }}>Verifying Taps...</h2>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.5s ease-out', background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <Crosshair size={90} color={resultData?.winAmount > 0 ? "#10b981" : "#ef4444"} style={{ filter: `drop-shadow(0 0 20px ${resultData?.winAmount > 0 ? '#10b981' : '#ef4444'})` }} />
                  {resultData?.winAmount > 0 && <Zap size={35} color="#fbbf24" style={{ position: 'absolute', top: '-5px', right: '-15px', animation: 'pulse-ring 2s infinite' }} />}
                </div>

                <h1 style={{ fontSize: '4rem', fontWeight: 900, color: resultData?.winAmount > 0 ? '#34d399' : '#f87171', marginBottom: '5px', lineHeight: 1, textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                  {resultData?.isBot ? 'REJECTED' : resultData?.score}
                </h1>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '2px', marginBottom: '20px' }}>TOTAL TAPS</div>

                {resultData?.isBot ? (
                   <div style={{ color: '#f87171', textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '15px', borderRadius: '12px' }}>Autoclicker detected. Voided.</div>
                ) : (
                  <>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 20px', borderRadius: '20px', marginBottom: '25px' }}>
                      <h2 style={{ fontSize: '1.2rem', color: 'white', margin: 0 }}>{resultData?.multiplier}x Multiplier</h2>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: resultData?.winAmount > 0 ? '#fbbf24' : 'rgba(255,255,255,0.4)', marginBottom: '35px', textShadow: resultData?.winAmount > 0 ? '0 0 20px rgba(251,191,36,0.5)' : 'none' }}>
                      {resultData?.winAmount > 0 ? `+ ₹${resultData?.winAmount.toFixed(2)}` : 'You Lost.'}
                    </h3>
                  </>
                )}

                <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                  <button onClick={() => router.push('/')} style={{ flex: 1, padding: '15px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>Dashboard</button>
                  <button onClick={() => setGameState('setup')} style={{ flex: 1, padding: '15px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}>Play Again</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes radar {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}} />
    </div>
  );
}
