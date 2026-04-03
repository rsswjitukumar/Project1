'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ReceiptText, ArrowUpToLine, ArrowDownToLine, Trophy, Gift, Clock, Search } from 'lucide-react';
import styles from '../wallet/page.module.css';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/user/transactions');
        const data = await res.json();
        if (data.success) {
          setTransactions(data.transactions);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'ALL') return true;
    return tx.type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return <ArrowDownToLine size={18} color="#10b981" />;
      case 'WITHDRAWAL': return <ArrowUpToLine size={18} color="#ff0080" />;
      case 'GAME_WIN': return <Trophy size={18} color="var(--accent-gold)" />;
      case 'GAME_LOSS': return <Clock size={18} color="#ef4444" />;
      case 'REFERRAL_BONUS': return <Gift size={18} color="#a855f7" />;
      default: return <ReceiptText size={18} color="var(--text-secondary)" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return '#10b981';
      case 'PENDING': return '#fbbf24';
      case 'FAILED': return '#ef4444';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className={styles.walletContainer}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ChevronLeft size={24} />
        </button>
        <h2 className={styles.headerTitle}>Transaction History</h2>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 5px 15px', marginBottom: '10px' }}>
         {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'GAME_WIN', 'REFERRAL_BONUS'].map(f => (
           <button 
             key={f}
             onClick={() => setFilter(f)}
             style={{ 
                padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                background: filter === f ? 'var(--accent-green)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? 'black' : 'white', fontWeight: 'bold'
             }}
           >
             {f.replace('_', ' ')}
           </button>
         ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>Loading transactions...</div>
      ) : filteredTransactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
           <Search size={48} color="rgba(255,255,255,0.1)" />
           <p style={{ color: 'var(--text-secondary)' }}>No transactions found for this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="glass-panel" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}>
                  {getIcon(tx.type)}
                </div>
                <div>
                   <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{tx.type.replace('_', ' ')}</div>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(tx.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: tx.type === 'GAME_WIN' || tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_BONUS' ? '#10b981' : (tx.type === 'GAME_LOSS' || tx.type === 'WITHDRAWAL' ? '#ef4444' : 'white') }}>
                   {tx.type === 'GAME_WIN' || tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_BONUS' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                 </div>
                 <div style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', color: getStatusColor(tx.status) }}>
                   {tx.status}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
