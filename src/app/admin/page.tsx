'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Users, LayoutDashboard, History, Settings, LogOut, Swords, Wallet, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  
  const [usersList, setUsersList] = useState<any[]>([]);
  const [txList, setTxList] = useState<any[]>([]);
  const [matchList, setMatchList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Modular asynchronous lambda handlers natively parsing Prisma scopes securely
  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats((await res.json()).stats);
      else router.push('/');
    } catch(e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsersList((await res.json()).users);
    } catch(e) {}
  };

  const fetchTxs = async () => {
    try {
      const res = await fetch('/api/admin/transactions');
      if (res.ok) setTxList((await res.json()).transactions);
    } catch(e) {}
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/admin/matches');
      if (res.ok) setMatchList((await res.json()).matches);
    } catch(e) {}
  };

  const handleUserAction = async (userId: string, action: string) => {
    if (!confirm(`Are you absolutely sure you want to ${action} this user?`)) return;
    try {
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (action === 'RESET_PASSWORD') {
           toast.success(`PASSWORD RESET! New PIN: ${data.newPassword}`, { duration: 15000, icon: '🔑' });
        } else {
           toast.success(data.message);
           fetchUsers(); 
        }
      } else {
        toast.error(data.error || 'Execution failed');
      }
    } catch(e) {
      toast.error('Network connection disrupted. Reverting.');
    }
  };
  
  // Base initialization mapping JWT securely overriding states via native headers
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchDashboardStats();
      setLoading(false);
    };
    init();
  }, [router]);

  // Tab mapping dependency loops
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'transactions') fetchTxs();
    if (activeTab === 'matches') fetchMatches();
  }, [activeTab]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff0080', background: '#0f1016' }}>Authorizing Super Admin...</div>;
  }

  const getTabStyle = (tabId: string) => {
    return {
      padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
      background: activeTab === tabId ? 'rgba(255,0,128,0.1)' : 'transparent',
      color: activeTab === tabId ? '#ff0080' : '#9da3b9',
      fontWeight: activeTab === tabId ? 'bold' : 'normal',
      transition: 'all 0.2s'
    };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', color: '#ffffff' }}>
      
      {/* Sidebar Core Engine */}
      <div style={{ width: '250px', background: '#13141c', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#ff0080', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={24} /> Admin Hub
          </h2>
        </div>

        <nav style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div onClick={() => setActiveTab('dashboard')} style={getTabStyle('dashboard')}>
            <LayoutDashboard size={20} /> Dashboard Overview
          </div>
          <div onClick={() => setActiveTab('users')} style={getTabStyle('users')}>
            <Users size={20} /> Manage Users
          </div>
          <div onClick={() => setActiveTab('transactions')} style={getTabStyle('transactions')}>
            <History size={20} /> Transaction Logs
          </div>
          <div onClick={() => setActiveTab('matches')} style={getTabStyle('matches')}>
            <Swords size={20} /> Match History
          </div>
          <div onClick={() => setActiveTab('settings')} style={getTabStyle('settings')}>
            <Settings size={20} /> Settings
          </div>
        </nav>

        <div style={{ padding: '24px 12px' }}>
          <Link href="/" passHref style={{ textDecoration: 'none' }}>
            <div style={{ padding: '12px 16px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
              <LogOut size={20} /> Exit Admin
            </div>
          </Link>
        </div>
      </div>

      {/* Primary Dynamic State Router */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* DASHBOARD TAB OMNI-OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>Platform Overview</h1>
            <p style={{ color: '#9da3b9', marginBottom: '32px' }}>Welcome back, Super Admin. Here is the latest system data.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ color: '#9da3b9', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Platform Wealth</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24' }}>₹{stats?.totalWealth?.toFixed(2) || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '12px' }}>
                    <Wallet color="#fbbf24" size={24} />
                  </div>
                </div>
              </div>
    
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ color: '#9da3b9', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Registered Players</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats?.totalUsers || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px' }}>
                    <Users color="#3b82f6" size={24} />
                  </div>
                </div>
              </div>
    
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ color: '#9da3b9', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Active Ludo Matches</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{stats?.activeMatches || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px' }}>
                    <Swords color="#10b981" size={24} />
                  </div>
                </div>
              </div>
    
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ color: '#9da3b9', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Successful Deposits</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a855f7' }}>{stats?.totalDeposits || 0}</div>
                  </div>
                  <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '12px', borderRadius: '12px' }}>
                    <History color="#a855f7" size={24} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* USERS RELATIONAL TAB */}
        {activeTab === 'users' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>Manage Users</h1>
            <p style={{ color: '#9da3b9', marginBottom: '32px' }}>Directory of all registered players on SkillSpin Arena.</p>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <tr>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Full Unique ID</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Username</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Phone</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Wallet</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Role</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u: any) => (
                    <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: u.role === 'BANNED' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '16px', fontSize: '0.75rem', color: '#9da3b9', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{u.id}</td>
                      <td style={{ padding: '16px', fontWeight: 'bold' }}>@{u.username}</td>
                      <td style={{ padding: '16px' }}>{u.phone}</td>
                      <td style={{ padding: '16px', color: '#10b981', fontWeight: 'bold' }}>₹{u.walletBalance.toFixed(2)}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: u.role === 'ADMIN' ? 'rgba(255,0,128,0.2)' : (u.role === 'BANNED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)'), color: u.role === 'ADMIN' ? '#ff0080' : (u.role === 'BANNED' ? '#ef4444' : 'white'), fontWeight: 'bold' }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                         <button onClick={() => handleUserAction(u.id, 'RESET_PASSWORD')} className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>Reset Pass</button>
                         {u.role === 'BANNED' ? (
                           <button onClick={() => handleUserAction(u.id, 'UNBLOCK')} className="btn" style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}>Unblock</button>
                         ) : (
                           <button onClick={() => handleUserAction(u.id, 'BLOCK')} className="btn" style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)' }}>Block</button>
                         )}
                      </td>
                    </tr>
                  ))}
                  {usersList.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#9da3b9' }}>No users found in database.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRANSACTIONS LEDGER TAB */}
        {activeTab === 'transactions' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>Platform Ledger</h1>
            <p style={{ color: '#9da3b9', marginBottom: '32px' }}>Real-time feed of all transactions happening within the ecosystem.</p>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <tr>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Tx ID</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Player</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Type</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Amount</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {txList.map((tx: any) => (
                    <tr key={tx.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: '#9da3b9', fontFamily: 'monospace' }}>{tx.id.substring(0, 8)}...</td>
                      <td style={{ padding: '16px', fontWeight: 'bold' }}>@{tx.user?.username || 'Unknown'}</td>
                      <td style={{ padding: '16px' }}>{tx.type}</td>
                      <td style={{ padding: '16px', fontWeight: 'bold' }}>₹{tx.amount.toFixed(2)}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: tx.status === 'SUCCESS' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: tx.status === 'SUCCESS' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{tx.status}</span>
                      </td>
                    </tr>
                  ))}
                  {txList.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#9da3b9' }}>No transactions recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MATCHES ENFORCEMENT TAB */}
        {activeTab === 'matches' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>Match Enforcement</h1>
            <p style={{ color: '#9da3b9', marginBottom: '32px' }}>Live monitoring of Skill Ludo instances and matchups globally.</p>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <tr>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Match ID</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Player 1</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Player 2</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Entry Fee</th>
                    <th style={{ padding: '16px', color: '#9da3b9' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {matchList.map((m: any) => (
                    <tr key={m.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: '#9da3b9', fontFamily: 'monospace' }}>{m.id.substring(0, 8)}...</td>
                      <td style={{ padding: '16px', fontWeight: 'bold', color: '#3b82f6' }}>@{m.player1?.username || 'Pending Engine'}</td>
                      <td style={{ padding: '16px', fontWeight: 'bold', color: '#ef4444' }}>@{m.player2?.username || 'Pending Engine'}</td>
                      <td style={{ padding: '16px', color: '#fbbf24', fontWeight: 'bold' }}>₹{m.entryFee.toFixed(2)}</td>
                      <td style={{ padding: '16px' }}>
                         <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: m.status === 'PLAYING' ? 'rgba(16,185,129,0.2)' : (m.status === 'FINISHED' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.1)'), color: m.status === 'PLAYING' ? '#10b981' : (m.status === 'FINISHED' ? '#a855f7' : 'white'), fontWeight: 'bold' }}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                  {matchList.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#9da3b9' }}>No matchups found in active node.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS SECURITY ZERO-TRUST TAB */}
        {activeTab === 'settings' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>System Parameters</h1>
            <p style={{ color: '#9da3b9', marginBottom: '32px' }}>Configure payout edges and global constants.</p>
            <div className="glass-panel" style={{ padding: '50px 30px', border: '1px dashed rgba(255,0,128,0.5)', textAlign: 'center', background: 'rgba(255,0,128,0.02)' }}>
               <ShieldAlert size={60} color="#ff0080" style={{ marginBottom: '20px' }} />
               <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Configuration Engine Offline</h2>
               <p style={{ color: '#9da3b9', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>Modifying global environment variables natively via GUI elements is disabled for strict security parameters during live e-sports production payloads. Deploy structural hardcode modifications individually via Git SSH access to avoid platform fractures.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
