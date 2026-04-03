'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Info, Landmark, QrCode, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WithdrawPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        if (data.user) setBalance(data.user.walletBalance);
        else router.push('/login');
      });
  }, [router]);

  const handleWithdraw = async () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount < 100) {
      return toast.error('Minimum withdrawal is ₹100');
    }
    if (numericAmount > balance) {
      return toast.error('Insufficient balance!');
    }
    if (!upiId.includes('@')) {
      return toast.error('Please enter a valid UPI ID');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: numericAmount, 
          paymentDetails: upiId,
          gateway: 'UPI' 
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setIsSuccess(true);
        setBalance(prev => prev - numericAmount);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Withdrawal failed');
      }
    } catch (e) {
      toast.error('Network Error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <CheckCircle size={80} color="var(--accent-green)" style={{ margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Request Submitted</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Your withdrawal of ₹{amount} is being processed. It will reflect in your account within 24-48 hours.
        </p>
        <button onClick={() => router.push('/')} className="btn btn-primary" style={{ width: '100%' }}>Go Back Home</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
          <ChevronLeft size={28} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Withdraw Cash</h1>
      </div>

      <div className="glass-panel" style={{ padding: '25px', textAlign: 'center', background: 'linear-gradient(225deg, rgba(16, 185, 129, 0.1), rgba(0,0,0,0))' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Withdrawable Balance</span>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-green)', margin: '5px 0' }}>₹{balance.toFixed(2)}</div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Landmark size={20} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.1rem' }}>Enter Withdrawal Details</h3>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Amount (Min ₹100)</label>
          <div style={{ position: 'relative' }}>
             <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>₹</span>
             <input 
               type="number" 
               placeholder="100" 
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               className="input-glass"
               style={{ paddingLeft: '35px' }}
             />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>UPI ID (PhonePe/GPay/Paytm)</label>
          <div style={{ position: 'relative' }}>
             <QrCode size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} color="var(--text-secondary)" />
             <input 
               type="text" 
               placeholder="example@ybl" 
               value={upiId}
               onChange={(e) => setUpiId(e.target.value)}
               className="input-glass"
               style={{ paddingLeft: '45px' }}
             />
          </div>
        </div>

        <div style={{ background: 'rgba(251, 191, 36, 0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.1)', display: 'flex', gap: '10px' }}>
          <AlertCircle size={16} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', lineHeight: '1.4' }}>
            Please double-check your UPI ID. We are not responsible for funds sent to a wrong ID.
          </p>
        </div>

        <button 
          onClick={handleWithdraw}
          disabled={loading || !amount || !upiId}
          className={`btn btn-primary ${loading ? 'loading' : ''}`}
          style={{ width: '100%', marginTop: '10px' }}
        >
          {loading ? 'Processing...' : 'Submit Request'}
        </button>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <Info size={14} />
        Requests are processed every Monday, Wednesday, and Friday.
      </div>
    </div>
  );
}
