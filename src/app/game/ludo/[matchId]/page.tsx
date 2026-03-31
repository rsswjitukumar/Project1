'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Dices, Trophy, CircleUser, MoveRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LudoEngine() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [user, setUser] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    fetch('/api/user/profile').then(res => res.json()).then(data => {
      if(data.user) setUser(data.user);
    });
  }, []);

  const fetchState = async () => {
    if (!matchId) return;
    try {
      const res = await fetch('/api/game/ludo/state', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId })
      });
      const data = await res.json();
      if(data.success) {
        setMatch(data.match);
        setGameState(data.gameState);
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (!matchId) return;
    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, [matchId]);

  const handleAction = async (action: string, tokenIndex?: number) => {
    try {
      const res = await fetch('/api/game/ludo/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, action, tokenIndex })
      });
      const data = await res.json();
      if(data.success) {
        setMatch(data.match);
        setGameState(data.gameState);
      } else {
        toast.error(data.error);
      }
    } catch(e) {
      toast.error("Network Error");
    }
  };

  if(!user || !match || !gameState) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)' }}>
        Loading Ludo Engine...
      </div>
    );
  }

  const isPlayer1 = match.player1Id === user.id;
  const opponentData = isPlayer1 ? match.player2 : match.player1;
  const myData = isPlayer1 ? match.player1 : match.player2;

  const myScore = isPlayer1 ? gameState.player1Score : gameState.player2Score;
  const oppScore = isPlayer1 ? gameState.player2Score : gameState.player1Score;
  const myTokens = isPlayer1 ? gameState.player1Tokens : gameState.player2Tokens;
  const oppTokens = isPlayer1 ? gameState.player2Tokens : gameState.player1Tokens;
  
  const isMyTurn = gameState.currentTurn === user.id;

  if(match.status === 'FINISHED') {
    const isWinner = gameState.winnerId === user.id;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(15, 16, 22, 1) 0%, rgba(0,0,0,1) 100%)', color: 'white' }}>
        <Trophy size={100} color={isWinner ? 'var(--accent-gold)' : 'var(--text-secondary)'} style={{ filter: `drop-shadow(0 0 20px ${isWinner ? 'var(--accent-gold)' : 'transparent'})` }} />
        <h1 style={{ fontSize: '3rem', margin: '20px 0', color: isWinner ? 'var(--accent-green)' : 'var(--accent-red)' }}>{isWinner ? 'VICTORY' : 'DEFEAT'}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '1.2rem' }}>Final Score: {myScore} - {oppScore}</p>
        <button className="btn btn-primary" onClick={() => router.push('/')} style={{ padding: '15px 40px', fontSize: '1.2rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'radial-gradient(ellipse at top, #1e1b4b, #000000)', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
        <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%', border: 'none', color: 'white', cursor: 'pointer', transition: 'background 0.2s' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Skill Ludo
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Target: 50 Pts</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' }}>
          ₹{match.entryFee * 1.8}
        </div>
      </div>

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: '20px' }}>
        
        {/* Opponent Zone */}
        <div style={{ 
          padding: '20px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '15px', 
          background: !isMyTurn ? 'linear-gradient(145deg, rgba(220,38,38,0.15), rgba(0,0,0,0.6))' : 'rgba(255,255,255,0.03)', 
          border: !isMyTurn ? '2px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(255,255,255,0.05)', 
          opacity: !isMyTurn ? 1 : 0.5, transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
          transform: !isMyTurn ? 'scale(1.02)' : 'scale(1)', 
          boxShadow: !isMyTurn ? '0 10px 40px rgba(239, 68, 68, 0.2)' : 'none' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Profile Photo */}
              <div style={{ position: 'relative' }}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${opponentData?.username || 'Opponent'}&backgroundColor=ffdfbf`} alt="Opponent" style={{ width: '56px', height: '56px', borderRadius: '50%', border: '3px solid #ef4444', objectFit: 'cover', background: '#ffdfbf' }} />
                {!isMyTurn && <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '16px', height: '16px', background: '#ef4444', borderRadius: '50%', border: '2px solid #1e1b4b', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />}
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#f87171' }}>{opponentData?.username || 'Opponent'}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Level 12</div>
              </div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', lineHeight: '1' }}>{oppScore}</div>
              <div style={{ fontSize: '0.7rem', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>pts</div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {oppTokens.map((pos: number, i: number) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.6)', height: '45px', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                <div style={{ width: `${(pos / 57) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #991b1b, #ef4444)', transition: 'width 0.6s ease-out', boxShadow: '0 0 10px #ef4444' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.85rem', fontWeight: '800', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {pos===0 ? 'Base' : pos===57 ? 'Win' : `${pos}/57`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Center - Dice Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '15px 0' }}>
          <div style={{ 
            fontSize: '1rem', marginBottom: '20px', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', letterSpacing: '0.5px',
            background: isMyTurn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isMyTurn ? '#34d399' : '#f87171',
            border: `1px solid ${isMyTurn ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {gameState.message || (isMyTurn ? 'Your Turn to Roll!' : `Waiting for ${opponentData?.username}...`)}
          </div>
          
          <button 
            onClick={() => handleAction('ROLL')}
            disabled={!isMyTurn || gameState.diceValue !== null}
            style={{ 
              width: '130px', height: '130px', borderRadius: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
              background: isMyTurn && gameState.diceValue === null ? 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)' : 'radial-gradient(circle, rgba(255,255,255,0.1), rgba(0,0,0,0.4))',
              boxShadow: isMyTurn && gameState.diceValue === null ? '0 10px 30px rgba(168, 85, 247, 0.5), inset 0 2px 10px rgba(255,255,255,0.4)' : 'inset 0 4px 15px rgba(0,0,0,0.6)',
              transform: isMyTurn && gameState.diceValue === null ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: isMyTurn && gameState.diceValue === null ? 'none' : '2px solid rgba(255,255,255,0.1)',
              cursor: isMyTurn && gameState.diceValue === null ? 'pointer' : 'not-allowed'
            }}
          >
            {gameState.diceValue ? (
              <span style={{ fontSize: '4.5rem', fontWeight: '900', color: 'white', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>{gameState.diceValue}</span>
            ) : (
              <Dices size={55} color={isMyTurn ? "white" : "rgba(255,255,255,0.2)"} style={{ filter: isMyTurn ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none' }} />
            )}
            {isMyTurn && gameState.diceValue === null && (
               <span style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '5px', color: 'rgba(255,255,255,0.9)' }}>ROLL DICE</span>
            )}
          </button>
        </div>

        {/* My Zone */}
        <div style={{ 
          padding: '20px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '15px', 
          background: isMyTurn ? 'linear-gradient(145deg, rgba(16,185,129,0.15), rgba(0,0,0,0.6))' : 'rgba(255,255,255,0.03)', 
          border: isMyTurn ? '2px solid rgba(16, 185, 129, 0.6)' : '1px solid rgba(255,255,255,0.05)', 
          opacity: isMyTurn ? 1 : 0.7, transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
          transform: isMyTurn ? 'scale(1.02)' : 'scale(1)', 
          boxShadow: isMyTurn ? '0 10px 40px rgba(16, 185, 129, 0.2)' : 'none' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Profile Photo */}
              <div style={{ position: 'relative' }}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${myData?.username || 'Player'}&backgroundColor=b6e3f4`} alt="Me" style={{ width: '56px', height: '56px', borderRadius: '50%', border: '3px solid #10b981', objectFit: 'cover', background: '#b6e3f4' }} />
                {isMyTurn && <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '16px', height: '16px', background: '#10b981', borderRadius: '50%', border: '2px solid #1e1b4b', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />}
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#34d399' }}>You ({myData?.username})</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Pro Player</div>
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', lineHeight: '1' }}>{myScore}</div>
              <div style={{ fontSize: '0.7rem', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>pts</div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {myTokens.map((pos: number, i: number) => {
              const playable = isMyTurn && gameState.diceValue !== null && pos < 57;
              return (
                <button 
                  key={i} 
                  onClick={() => handleAction('MOVE', i)}
                  disabled={!playable}
                  style={{ 
                    background: 'rgba(0,0,0,0.6)', height: '55px', borderRadius: '12px', overflow: 'hidden', position: 'relative', 
                    cursor: playable ? 'pointer' : 'default', padding: 0,
                    border: playable ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: playable ? '0 0 15px rgba(16,185,129,0.3), inset 0 2px 10px rgba(0,0,0,0.5)' : 'inset 0 2px 10px rgba(0,0,0,0.5)',
                    transform: playable ? 'translateY(-2px)' : 'none', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: `${(pos / 57) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #065f46, #10b981)', transition: 'width 0.6s ease-out', boxShadow: '0 0 10px #10b981' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', gap: '6px', color: 'white' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      {pos===0 ? 'Select' : pos===57 ? 'Win' : `${pos}/57`}
                    </span>
                    {playable && <MoveRight size={16} color="white" style={{ animation: 'bounce-x 1s infinite' }} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}} />
    </div>
  );
}
