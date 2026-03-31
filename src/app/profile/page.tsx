'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wallet, Trophy, Users, UserCircle, 
  Home as HomeIcon, Gift, LogOut, ChevronRight, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (e) {
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (e) {
      toast.error('Failed to logout');
    }
  };

  if (isLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)' }}>Loading Profile...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', paddingBottom: '80px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ padding: '1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: '1.5rem' }}>My Profile</h2>
        <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', gap: '8px', color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Profile Card */}
      <div className="glass-panel" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary-glow), var(--primary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <UserCircle size={48} color="white" />
        </div>
        
        <h3 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>@{user?.username || 'Gamer'}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>+91 {user?.phone}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Wallet Balance</div>
            <div style={{ color: 'var(--accent-gold)', fontSize: '1.25rem', fontWeight: 'bold' }}>₹{user?.walletBalance.toFixed(2)}</div>
            <button onClick={() => router.push('/wallet')} className="btn btn-success" style={{ width: '100%', marginTop: '12px', padding: '8px', fontSize: '0.8rem' }}>+ Add Cash</button>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Matches Won</div>
            <div style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>0</div>
            <button className="btn btn-outline" style={{ width: '100%', marginTop: '12px', padding: '8px', fontSize: '0.8rem' }}>History</button>
          </div>
        </div>

        {/* Unique Referral Code Box */}
        <div style={{ 
          width: '100%', marginTop: '1.5rem', padding: '1.25rem', 
          background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px',
          border: '1px dashed var(--primary-accent)', display: 'flex', 
          flexDirection: 'column', alignItems: 'center', gap: '8px'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>My Unique Referral Code</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-accent)', letterSpacing: '2px' }}>{user?.referralCode || user?.username}</div>
          <button onClick={() => {
            navigator.clipboard.writeText(user?.referralCode || user?.username || '');
            toast.success('Referral code copied!');
          }} style={{ 
            background: 'none', border: 'none', color: 'var(--text-secondary)', 
            fontSize: '0.8rem', cursor: 'pointer', display: 'flex', 
            alignItems: 'center', gap: '4px', padding: '4px'
          }}>
            <Copy size={14} /> Copy Code Only
          </button>
        </div>
      </div>

      {/* Menu Options */}
      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
         <div className="glass-panel" onClick={() => router.push('/refer')} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <Gift color="var(--primary-accent)" size={20} />
             <span>Refer & Earn</span>
           </div>
           <ChevronRight size={20} color="var(--text-secondary)" />
         </div>
         <div className="glass-panel" onClick={() => router.push('/transactions')} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <Wallet color="var(--accent-gold)" size={20} />
             <span>Transaction History</span>
           </div>
           <ChevronRight size={20} color="var(--text-secondary)" />
         </div>
      </div>

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', display: 'flex', justifyContent: 'space-around', background: 'rgba(15, 16, 22, 0.95)', backdropFilter: 'blur(15px)', padding: '12px 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)', zIndex: 100 }}>
        <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            <HomeIcon size={24} style={{ filter: 'grayscale(1)', opacity: 0.6 }} />
            <span>Home</span>
          </div>
        </Link>
        <Link href="/leaderboard" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            <Trophy size={24} style={{ filter: 'grayscale(1)', opacity: 0.6 }} />
            <span>Contests</span>
          </div>
        </Link>
        <Link href="/refer" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            <Gift size={24} style={{ filter: 'grayscale(1)', opacity: 0.6 }} />
            <span>Refer</span>
          </div>
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--primary-accent)', fontSize: '0.75rem', fontWeight: 600 }}>
          <UserCircle size={24} style={{ filter: 'grayscale(0)', opacity: 1, transform: 'translateY(-2px)' }} />
          <span>Profile</span>
        </div>
      </nav>
    </div>
  );
}
