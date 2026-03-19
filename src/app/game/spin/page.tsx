'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Coins, PlayCircle, Trophy, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const SLICES = [
  { label: '0x', color: '#ff1a1a', multiplier: 0 },
  { label: '0.5x', color: '#ff8c00', multiplier: 0.5 },
  { label: '1.5x', color: '#00ccff', multiplier: 1.5 },
  { label: '2x', color: '#6600ff', multiplier: 2 },
  { label: '5x', color: '#ff00ff', multiplier: 5 },
  { label: '10x', color: '#ffc107', multiplier: 10 },
];

export default function SpinWheel() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [bet, setBet] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState<{win: number, multi: number} | null>(null);

  useEffect(() => {
    fetch('/api/user/profile').then(res => res.json()).then(data => {
      if (data.user) setBalance(data.user.walletBalance);
      else router.push('/login');
    });
  }, [router]);

  const spin = async () => {
    if (balance < bet) return toast.error('Insufficient balance to spin!');
    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(null);
    setBalance(prev => prev - bet);

    try {
      const res = await fetch('/api/game/spin/play', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount: bet })
      });
      const data = await res.json();
      
      if (!data.success) {
        toast.error(data.error);
        setBalance(prev => prev + bet);
        setIsSpinning(false);
        return;
      }

      const currentWheelRotation = rotation % 360;
      const targetDeg = 360 - (data.multiplierIndex * 60) - 30;
      const neededRotation = targetDeg - currentWheelRotation;
      const completeAngles = neededRotation > 0 ? neededRotation : 360 + neededRotation;
      
      const fastSpins = 360 * 6; // 6 heavy spins
      setRotation(rotation + completeAngles + fastSpins);

      setTimeout(() => {
        setIsSpinning(false);
        setBalance(data.newBalance);
        setShowResult({ win: data.winAmount, multi: data.multiplier });
        
        if (data.multiplier > 0) {
           toast.success(`JACKPOT! ₹${data.winAmount} Added!`, { icon: '💰', duration: 4000 });
        } else {
           toast.error('Missed! Try again!', { icon: '💔' });
        }
      }, 4000); 

    } catch(e) {
      toast.error('Network Error.');
      setBalance(prev => prev + bet);
      setIsSpinning(false);
    }
  };

  const getConicGradient = () => {
    let gradient = 'conic-gradient(';
    SLICES.forEach((slice, i) => {
      const start = i * 60;
      const end = (i + 1) * 60;
      gradient += `${slice.color} ${start}deg ${end}deg${i === SLICES.length - 1 ? '' : ', '}`;
    });
    return gradient + ')';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'radial-gradient(circle at center, #1a0b2e 0%, #0a0a0f 100%)', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,193,7,0.2)' }}>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', zIndex: 10 }}>
          <ChevronLeft size={28} />
        </button>
        <div style={{ fontWeight: '900', fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px', textShadow: '0 0 10px rgba(255,193,7,0.5)' }}>
          <Sparkles color="var(--accent-gold)" size={24} /> SPIN TURBO
        </div>
        <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontWeight: 'bold', border: '1px solid rgba(255,193,7,0.4)', background: 'rgba(255,193,7,0.1)' }}>
          <Coins size={18} /> ₹{balance.toFixed(2)}
        </div>
      </div>

      <div style={{ padding: '30px 20px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
        
        {/* Elite Casino Wheel Hub */}
        <div style={{ position: 'relative', marginTop: '50px', marginBottom: '80px' }}>
          
          {/* 3D Pointer Needle */}
          <div style={{
            position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)',
            width: '46px', height: '56px', background: 'linear-gradient(to bottom, #fff 0%, #ffd700 100%)', 
            clipPath: 'polygon(50% 100%, 0 0, 100% 0)', zIndex: 30, filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.8))'
          }}>
            <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.1)', clipPath: 'polygon(50% 100%, 50% 0, 100% 0)' }} />
          </div>

          {/* Premium Outer Ring with Bulbs */}
          <div style={{
            width: '350px', height: '350px', borderRadius: '50%', padding: '16px',
            background: 'linear-gradient(45deg, #111, #333)',
            boxShadow: '0 0 60px rgba(255, 0, 128, 0.4), inset 0 0 20px rgba(0,0,0,1)',
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {/* Outer dotted bulbs (Casino Lights Effect) */}
            <div style={{ position: 'absolute', inset: '4px', borderRadius: '50%', border: '4px dotted rgba(255, 215, 0, 0.6)', animation: isSpinning ? 'spin 10s linear infinite reverse' : 'none', opacity: 0.7 }} />
            
            {/* Inner Wheel Canvas */}
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%', position: 'relative', overflow: 'hidden',
              background: getConicGradient(),
              transform: `rotate(${rotation}deg)`,
              transition: `transform ${isSpinning ? '4s cubic-bezier(0.1, 0.9, 0.2, 1)' : '0s'}`,
              boxShadow: '0 0 20px rgba(0,0,0,0.8) inset',
              border: '4px solid #gold'
            }}>
              {/* Inner Segment Separators & Labels */}
              {SLICES.map((slice, i) => {
                const rotationAngle = i * 60 + 30; 
                return (
                  <div key={i} style={{
                    position: 'absolute', top: 0, left: '50%', width: '80px', height: '50%',
                    transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${rotationAngle}deg)`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '15px'
                  }}>
                    {/* Shadowed text for deep 3D readability */}
                    <span style={{
                      color: 'white', fontWeight: '900', fontSize: '1.6rem',
                      textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 4px 10px rgba(0,0,0,0.8)'
                    }}>
                      {slice.label}
                    </span>
                  </div>
                );
              })}
              {/* Geometric slice dividers */}
              {SLICES.map((_, i) => (
                <div key={`div-${i}`} style={{
                  position: 'absolute', top: 0, left: '50%', width: '4px', height: '50%', background: 'rgba(0,0,0,0.4)',
                  transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${i * 60}deg)`, zIndex: 10
                }} />
              ))}
            </div>
            
            {/* Golden Center Hub */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '70px', height: '70px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #ffd700, #b8860b)',
              border: '4px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 20px rgba(0,0,0,0.7), inset 0 -5px 10px rgba(0,0,0,0.4)', zIndex: 20
            }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            </div>
          </div>
        </div>

        {/* Action Center Container */}
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '25px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,215,0,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', color: '#9da3b9', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Select WagerAmount</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            {[10, 50, 100].map(amt => (
              <button 
                key={amt}
                onClick={() => setBet(amt)}
                disabled={isSpinning}
                className={`btn ${bet === amt ? 'btn-primary' : 'btn-outline'}`}
                style={{ 
                  padding: '12px 0', fontSize: '1.2rem', fontWeight: 'bold',
                  background: bet === amt ? 'linear-gradient(45deg, #10b981, #059669)' : 'transparent',
                  borderColor: bet === amt ? 'transparent' : 'rgba(255,255,255,0.2)',
                  opacity: isSpinning ? 0.5 : 1 
                }}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <button 
            onClick={spin}
            disabled={isSpinning}
            className="btn btn-primary"
            style={{ 
              padding: '24px', fontSize: '1.6rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '3px',
              background: isSpinning ? 'linear-gradient(45deg, #444, #222)' : 'linear-gradient(to right, #ff0080, #7928ca)',
              boxShadow: isSpinning ? 'none' : '0 10px 30px rgba(255, 0, 128, 0.4)', opacity: isSpinning ? 0.7 : 1, marginTop: '10px'
            }}
          >
            {isSpinning ? 'Spinning...' : 'SPIN NOW!'}
          </button>
        </div>

        {/* Win/Loss Broadcast Banner */}
        {showResult && (
          <div style={{ marginTop: '40px', textAlign: 'center', animation: 'bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            {showResult.multi > 0 ? (
              <div style={{ background: 'linear-gradient(45deg, rgba(16,185,129,0.1), rgba(16,185,129,0.2))', padding: '20px 40px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.4)' }}>
                <Trophy size={48} color="#10b981" style={{ marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.8))' }} />
                <h2 style={{ fontSize: '3rem', fontWeight: '900', color: '#10b981', textShadow: '0 0 30px rgba(16,185,129,0.5)', margin: 0 }}>+₹{showResult.win.toFixed(2)}</h2>
                <div style={{ fontSize: '1.3rem', color: '#fff', marginTop: '10px', fontWeight: 'bold' }}>{showResult.multi}x Multiplier Hit!</div>
              </div>
            ) : (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '20px 40px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ef4444', margin: 0 }}>₹0.00</h2>
                <div style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', marginTop: '10px' }}>Try again to hit the Jackpot!</div>
              </div>
            )}
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes bounceIn {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
