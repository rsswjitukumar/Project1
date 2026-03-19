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
    const width = gameAreaRef.current.clientWidth - paddingX * 2;
    const height = gameAreaRef.current.clientHeight - paddingY * 2;
    
    const randomX = Math.floor(Math.random() * width) + paddingX;
    const randomY = Math.floor(Math.random() * height) + paddingY;
    
    setTargetPos({ top: `${randomY}px`, left: `${randomX}px` });
  };

  // Housekeeping
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'var(--bg-dark)', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      {/* Universal Safe Header */}
      <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 50 }}>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
          <ChevronLeft size={28} />
        </button>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crosshair color="var(--accent-red)" size={20} /> Target Tap
        </div>
        <div className="glass-panel" style={{ padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
          <Coins size={16} /> ₹{balance.toFixed(2)}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        
        {/* GAME SETUP HUD */}
        {gameState === 'setup' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 80%)', padding: '20px' }}>
            <Crosshair size={80} color="var(--accent-red)" style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.5))', marginBottom: '20px' }} />
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Fastest Fingers Win</h1>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', marginBottom: '30px' }}>
              Tap the moving target as fast as possible in 15 seconds. 60+ taps doubles your cash!
            </p>
            
            <div className="glass-panel" style={{ display: 'flex', gap: '10px', padding: '15px', borderRadius: '15px', marginBottom: '30px' }}>
               {[10, 50, 100].map(amt => (
                <button 
                  key={amt}
                  onClick={() => setBet(amt)}
                  className={`btn ${bet === amt ? 'btn-primary' : 'btn-outline'}`}
                  style={{ width: '80px', padding: '10px 0' }}
                >
                  ₹{amt}
                </button>
               ))}
            </div>

            <button onClick={startGame} className="btn" style={{ padding: '20px 40px', fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(135deg, var(--accent-red), #991b1b)', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Play Now
            </button>
          </div>
        )}

        {/* ACTIVE PLAY ARENA */}
        {gameState === 'playing' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Live Dashboard metrics */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>TIME LEFT</span>
                 <span style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace', color: timeLeft <= 5 ? 'var(--accent-red)' : 'white' }}>{timeLeft.toFixed(2)}s</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>SCORE</span>
                 <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{score}</span>
               </div>
            </div>

            {/* Target Touch Surface Grid */}
            <div ref={gameAreaRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', touchAction: 'manipulation' }}>
               {/* The moving target specifically mapped natively using X,Y state translations */}
               <button
                 onMouseDown={handleTap}
                 onTouchStart={handleTap}
                 style={{
                   position: 'absolute',
                   top: targetPos.top, left: targetPos.left,
                   transform: 'translate(-50%, -50%)',
                   width: '80px', height: '80px',
                   borderRadius: '50%',
                   background: 'radial-gradient(circle at center, var(--accent-red) 30%, #450a0a 100%)',
                   border: '4px solid white',
                   boxShadow: '0 0 20px rgba(239,68,68,0.8), inset 0 0 10px rgba(0,0,0,0.5)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   cursor: 'pointer', transition: 'none', // Removed transition to make it strictly instant teleports preventing macro sliding
                   outline: 'none', padding: 0
                 }}
               >
                 <TargetIcon size={40} color="white" />
               </button>
            </div>
          </div>
        )}

        {/* PROCESSING & RESULTS UI */}
        {(gameState === 'processing' || gameState === 'result') && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', padding: '20px' }}>
            
            {gameState === 'processing' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary-accent)', animation: 'spin 1s linear infinite' }} />
                <h2 style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Verifying Score API...</h2>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ marginBottom: '30px', position: 'relative' }}>
                  <Crosshair size={100} color={resultData?.winAmount > 0 ? "var(--accent-green)" : "var(--accent-red)"} />
                  {resultData?.winAmount > 0 && <Zap size={40} color="var(--accent-gold)" style={{ position: 'absolute', top: '-10px', right: '-10px' }} />}
                </div>

                <h1 style={{ fontSize: '3rem', color: resultData?.winAmount > 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom: '10px' }}>
                  {resultData?.isBot ? 'REJECTED' : resultData?.score} TAPS
                </h1>

                {resultData?.isBot ? (
                   <div style={{ color: 'var(--accent-red)', textAlign: 'center' }}>Macro software detected. Transaction voided natively.</div>
                ) : (
                  <>
                    <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '5px' }}>{resultData?.multiplier}x Multiplier</h2>
                    <h3 style={{ fontSize: '1.5rem', color: resultData?.winAmount > 0 ? 'var(--accent-gold)' : 'var(--text-secondary)', marginBottom: '40px' }}>
                      {resultData?.winAmount > 0 ? `Won ₹${resultData?.winAmount.toFixed(2)}` : 'You Lost.'}
                    </h3>
                  </>
                )}

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={() => setGameState('setup')} className="btn btn-outline" style={{ padding: '15px 30px' }}>Play Again</button>
                  <button onClick={() => router.push('/')} className="btn btn-primary" style={{ padding: '15px 30px' }}>Dashboard</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
