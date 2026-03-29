'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { 
  Wallet, Trophy, Users, UserCircle, 
  Gamepad2, Coins, Play, Loader, 
  Target, Home as HomeIcon, Gift
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setBalance(data.user.walletBalance);
        } else {
          // Kick to login if unauthorized
          router.push('/login');
        }
      } catch (e) {
        toast.error('Failed to authenticate');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  if (isLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)' }}>Loading Arena...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header / Navbar */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <h1><span className="text-gradient">SkillSpin</span> Arena</h1>
        </div>
        
        <div className={styles.walletCard}>
          <Wallet size={16} color="var(--accent-gold)" />
          <div className={styles.walletDetails}>
            <span className={styles.walletLabel}>Balance</span>
            <span className={styles.walletAmount}>₹{balance.toFixed(2)}</span>
          </div>
          <button onClick={() => router.push('/wallet')} className={`btn btn-success ${styles.addBtn}`}>+ Add</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h2 className={styles.heroTitle}>
            Play & <span className="text-gradient-gold">Win Real Cash</span> Every Minute!
          </h2>
          <p className={styles.heroSubtitle}>
            Join India&apos;s #1 Skill Gaming Platform. Instant Withdrawals via UPI.
          </p>
          <div className={styles.actionGroup}>
            <button className="btn btn-primary animate-pulse-glow" style={{ gap: '8px' }}>
              <Gamepad2 size={20} /> Play Now - ₹10 Entry
            </button>
            <button onClick={() => router.push('/refer')} className="btn btn-outline" style={{ gap: '8px' }}>
              <Users size={20} /> Refer & Earn ₹50
            </button>
          </div>
        </div>
        
        {/* Decorative Floating Element */}
        <div className={`${styles.heroImage} animate-float`}>
          <div className={styles.spinningCoin}>
            <div className={styles.coinInner}>₹</div>
          </div>
        </div>
      </section>

      {/* Game Selection Grid */}
      <section className={styles.gamesSection}>
        <div className={styles.sectionHeader}>
          <h3>Trending Games</h3>
          <button className={styles.textBtn}>View All</button>
        </div>
        
        <div className="grid-cards">
          {/* Game Card 1 */}
          <div className="glass-panel">
            <div className={styles.gameBanner} style={{background: 'linear-gradient(45deg, #1e3a8a, #3b82f6)'}}>
              <span className={styles.gameBadge}>Hot</span>
            </div>
            <div className={styles.gameInfo}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gamepad2 size={20} color="var(--accent-blue)" /> Skill Ludo (1v1)
              </h4>
              <p>Fast-paced 5-minute ludo.</p>
              
              <div className={styles.matchStats}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Trophy size={14} color="var(--accent-gold)" /> Win: ₹18.00
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Coins size={14} /> Entry: ₹10.00
                </span>
              </div>
              
              <button 
                onClick={() => router.push('/match-room')}
                className="btn btn-primary" 
                style={{width: '100%', marginTop: '16px', gap: '8px'}}
              >
                <Play size={18} fill="currentColor" /> Play Ludo
              </button>
            </div>
          </div>

          {/* Game Card 2 */}
          <div className="glass-panel">
            <div className={styles.gameBanner} style={{background: 'linear-gradient(45deg, #831843, #ec4899)'}}>
              <span className={styles.gameBadge}>New</span>
            </div>
            <div className={styles.gameInfo}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader size={20} color="var(--primary-accent)" /> Spin Wheel Turbo
              </h4>
              <p>Test your luck & timing.</p>
              
              <div className={styles.matchStats}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Trophy size={14} color="var(--accent-gold)" /> Win: Upto ₹50
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Coins size={14} /> Entry: ₹5.00
                </span>
              </div>
              
              <button 
                onClick={() => router.push('/game/spin')}
                className="btn btn-primary" 
                style={{width: '100%', marginTop: '16px', gap: '8px'}}
              >
                <Loader size={18} /> Spin Now
              </button>
            </div>
          </div>

          {/* Game Card 3 */}
          <div className="glass-panel">
            <div className={styles.gameBanner} style={{background: 'linear-gradient(45deg, #064e3b, #10b981)'}}>
            </div>
            <div className={styles.gameInfo}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} color="var(--accent-green)" /> Target Tap
              </h4>
              <p>30 seconds reaction battle.</p>
              
              <div className={styles.matchStats}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Trophy size={14} color="var(--accent-gold)" /> Win: ₹4.50
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Coins size={14} /> Entry: ₹2.50
                </span>
              </div>
              
              <button 
                onClick={() => router.push('/game/target')}
                className="btn btn-outline" 
                style={{width: '100%', marginTop: '16px', gap: '8px'}}
              >
                <Target size={18} /> Play Tap
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav}>
        <div className={`${styles.navItem} ${styles.navActive}`}>
          <HomeIcon className={styles.navIcon} size={24} />
          <span>Home</span>
        </div>
        <Link href="/leaderboard" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.navItem}>
            <Trophy className={styles.navIcon} size={24} />
            <span>Contests</span>
          </div>
        </Link>
        <Link href="/refer" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.navItem}>
            <Gift className={styles.navIcon} size={24} />
            <span>Refer</span>
          </div>
        </Link>
        <Link href="/profile" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.navItem}>
            <UserCircle className={styles.navIcon} size={24} />
            <span>Profile</span>
          </div>
        </Link>
      </nav>
    </div>
  );
}
