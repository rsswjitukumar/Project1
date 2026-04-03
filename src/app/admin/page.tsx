'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Users, LayoutDashboard, History, Settings, LogOut, Swords, Wallet, CheckCircle, XCircle } from 'lucide-react';
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
        toast.success(data.message);
        fetchUsers(); 
      } else {
        toast.error(data.error || 'Execution failed');
      }
    } catch(e) {
      toast.error('Network Error');
    }
  };

  const handleTxAction = async (txId: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action} this transaction?`)) return;
    try {
      const res = await fetch('/api/admin/transactions/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId, action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        fetchTxs();
        fetchDashboardStats();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch(e) {
      toast.error('Error processing request');
    }
  };
  
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchDashboardStats();
      setLoading(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'transactions') fetchTxs();
    if (activeTab === 'matches') fetchMatches();
  }, [activeTab]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff0080', background: '#0f1016' }}>Authorizing Admin...</div>;
  }

  const getTabStyle = (tabId: string) => ({
    padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
    background: activeTab === tabId ? 'rgba(255,0,128,0.1)' : 'transparent',
    color: activeTab === tabId ? '#ff0080' : '#9da3b9',
    fontWeight: activeTab === tabId ? 'bold' : 'normal',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', color: '#ffffff' }}>
      
      {/* Sidebar */}
      <div style={{ width: '250px', background: '#13141c', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#ff0080', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={24} /> Admin Hub
          </h2>
        </div>

        <nav style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div onClick={() => setActiveTab('dashboard')} style={getTabStyle('dashboard')}><LayoutDashboard size={20} /> Dashboard</div>
          <div onClick={() => setActiveTab('users')} style={getTabStyle('users')}><Users size={20} /> Manage Users</div>
          <div onClick={() => setActiveTab('transactions')} style={getTabStyle('transactions')}><History size={20} /> Transactions</div>
          <div onClick={() => setActiveTab('matches')} style={getTabStyle('matches')}><Swords size={20} /> Match History</div>
        </nav>

        <div style={{ padding: '24px 12px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '12px 16px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
              <LogOut size={20} /> Exit Admin
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {activeTab === 'dashboard' && (
          <div>
            <h1 style={{ fontSize: '2rem' }}>Platform Overview</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
              <div className="glass-panel">
                <div style={{ color: '#9da3b9', fontSize: '0.8rem' }}>TOTAL WEALTH</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{stats?.totalWealth?.toFixed(2)}</div>
              </div>
              <div className="glass-panel">
                <div style={{ color: '#9da3b9', fontSize: '0.8rem' }}>TOTAL USERS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.totalUsers}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h1 style={{ fontSize: '2rem' }}>Players Management</h1>
            <div className="glass-panel" style={{ marginTop: '20px', padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <tr>
                    <th style={{ padding: '15px' }}>Username</th>
                    <th style={{ padding: '15px' }}>Phone</th>
                    <th style={{ padding: '15px' }}>Wallet</th>
                    <th style={{ padding: '15px' }}>Status</th>
                    <th style={{ padding: '15px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '15px' }}>@{u.username}</td>
                      <td style={{ padding: '15px' }}>{u.phone}</td>
                      <td style={{ padding: '15px' }}>₹{u.walletBalance.toFixed(2)}</td>
                      <td style={{ padding: '15px' }}>{u.role}</td>
                      <td style={{ padding: '15px' }}>
                        <button onClick={() => handleUserAction(u.id, u.role === 'BANNED' ? 'UNBLOCK' : 'BLOCK')} className="btn" style={{ fontSize: '0.7rem', padding: '5px 10px', background: u.role === 'BANNED' ? '#10b981' : '#ef4444' }}>{u.role === 'BANNED' ? 'Unblock' : 'Block'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <h1 style={{ fontSize: '2rem' }}>Transaction Ledger</h1>
            <div className="glass-panel" style={{ marginTop: '20px', padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <tr>
                    <th style={{ padding: '15px' }}>User</th>
                    <th style={{ padding: '15px' }}>Type</th>
                    <th style={{ padding: '15px' }}>Amount</th>
                    <th style={{ padding: '15px' }}>Details</th>
                    <th style={{ padding: '15px' }}>Status</th>
                    <th style={{ padding: '15px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {txList.map((tx: any) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '15px' }}>@{tx.user?.username}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ color: tx.type === 'DEPOSIT' ? '#10b981' : (tx.type === 'WITHDRAWAL' ? '#ff0080' : 'white') }}>{tx.type}</span>
                      </td>
                      <td style={{ padding: '15px' }}>₹{tx.amount.toFixed(2)}</td>
                      <td style={{ padding: '15px', fontSize: '0.8rem' }}>{tx.paymentDetails || tx.orderId}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ color: tx.status === 'SUCCESS' ? '#10b981' : (tx.status === 'PENDING' ? '#fbbf24' : '#ef4444') }}>{tx.status}</span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        {tx.status === 'PENDING' && tx.type === 'WITHDRAWAL' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleTxAction(tx.id, 'APPROVE')} style={{ background: '#10b981', border: 'none', borderRadius: '4px', padding: '5px' }}><CheckCircle size={16} color="white" /></button>
                            <button onClick={() => handleTxAction(tx.id, 'REJECT')} style={{ background: '#ef4444', border: 'none', borderRadius: '4px', padding: '5px' }}><XCircle size={16} color="white" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
