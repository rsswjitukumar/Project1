'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Gift, Users, UserCircle, Home as HomeIcon, Trophy, 
  Copy, Share2, Sparkles, Coins, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReferralStats = async () => {
      try {
        const res = await fetch('/api/user/referral-stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        } else {
          router.push('/login');
        }
      } catch (e) {
        toast.error('Failed to load referral details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReferralStats();
  }, [router]);

  const copyToClipboard = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      toast.success('Invite link copied to clipboard!');
    }
  };

  const shareViaWhatsApp = () => {
    if (stats?.referralLink) {
      const message = `Ready to play and win real cash? 🎮 Join LuckSpin Arena using my invite link and let's play Ludo together! 🏆\n\nPlay now: ${stats.referralLink}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  if (isLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)' }}>Loading Rewards...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', paddingBottom: '90px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ padding: '1.5rem 0', display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--primary-accent)', margin: 0 }}>
          <Gift size={24} /> Refer & Earn
        </h2>
        <div /> {/* Placeholder for grid balance */}
      </div>

      {/* Hero Graphic Section */}
      <div style={{ padding: '40px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'radial-gradient(circle at center, rgba(255,0,128,0.15) 0%, transparent 70%)' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff0080, #7928ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 0 30px rgba(255,0,128,0.4)', position: 'relative' }}>
          <Gift size={40} color="white" />
          <Sparkles size={20} color="var(--accent-gold)" style={{ position: 'absolute', top: '-10px', right: '-10px' }} />
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Get <span className="text-gradient">₹50 Rewards</span></h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: '1.5' }}>
          Invite your friends to LuckSpin Arena. When they register using your link, you instantly get ₹50, and they get ₹10 signup bonus!
        </p>
      </div>

      {/* Unique Referral Code Section */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>My Unique Referral Code</div>
        <div style={{ 
          fontSize: '2rem', fontWeight: '800', color: 'var(--primary-accent)', 
          background: 'rgba(255, 0, 128, 0.05)', padding: '16px', borderRadius: '12px',
          border: '2px solid var(--primary-accent)', display: 'inline-block',
          minWidth: '200px', letterSpacing: '4px', marginBottom: '16px'
        }}>
          {stats?.referralCode || '...'}
        </div>
        <button onClick={() => {
          navigator.clipboard.writeText(stats?.referralCode || '');
          toast.success('Referral code copied!');
        }} className="btn btn-outline" style={{ display: 'block', margin: '0 auto', fontSize: '0.8rem', padding: '8px 16px' }}>
          <Copy size={16} /> Copy Code Only
        </button>
      </div>

      {/* Invite Link Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Invitation Link:</div>
        <div style={{ 
          background: 'rgba(0,0,0,0.4)', border: '1px dashed var(--primary-accent)', 
          padding: '12px', borderRadius: '8px', color: 'white', wordBreak: 'break-all', 
          fontFamily: 'monospace', fontSize: '0.85rem'
        }}>
          {stats?.referralLink}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button onClick={copyToClipboard} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
            <Copy size={18} /> Copy Full Link
          </button>
          <button onClick={shareViaWhatsApp} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
            <Share2 size={18} /> WhatsApp
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '50%', marginBottom: '12px' }}>
            <Users size={24} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.totalInvited}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Friends</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '50%', marginBottom: '12px' }}>
            <Coins size={24} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>₹{stats?.totalEarnings.toFixed(2)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Bonus Earned</div>
        </div>
      </div>

      {/* Recent Invites */}
      {stats?.recentInvites && stats.recentInvites.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: 'var(--text-primary)' }}>Recently Joined</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.recentInvites.map((invite: any, i: number) => (
              <div key={i} className="glass-panel" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${invite.username}&backgroundColor=b6e3f4`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                  <span style={{ fontWeight: 600 }}>{invite.username}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 600 }}>+₹50</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--primary-accent)', fontSize: '0.75rem', fontWeight: 600 }}>
          <Gift size={24} style={{ filter: 'grayscale(0)', opacity: 1, transform: 'translateY(-2px)' }} />
          <span>Refer</span>
        </div>
        <Link href="/profile" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            <UserCircle size={24} style={{ filter: 'grayscale(1)', opacity: 0.6 }} />
            <span>Profile</span>
          </div>
        </Link>
      </nav>
    </div>
  );
}
