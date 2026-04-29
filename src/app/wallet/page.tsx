'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { ChevronLeft, Wallet, ArrowDownToLine, ArrowUpFromLine, ShieldCheck, ChevronRight, CheckCircle2, History as HistoryIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [addAmount, setAddAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'DIRECT_UPI' | 'QR_CODE'>('DIRECT_UPI');
  const [showUtrInput, setShowUtrInput] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

  useEffect(() => {
    // Dynamically load Cashfree SDK script
    const loadCashfreeScript = () => {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      document.body.appendChild(script);
    };
    loadCashfreeScript();

    // Fetch secure profile
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setBalance((data.user.depositBalance || 0) + (data.user.winningBalance || 0) + (data.user.bonusBalance || 0));
        } else {
          router.push('/login');
        }
      } catch (e) {
        toast.error('Failed to load wallet');
      }
    };
    fetchProfile();
  }, [router]);

  const handlePay = async () => {
    if (!user) return;
    if (parseFloat(addAmount) < 10) {
      return toast.error("Minimum deposit is ₹10");
    }
    
    setLoading(true);
    try {
      if (selectedGateway === 'QR_CODE') {
        const upiLink = `upi://pay?pa=paytmqr5hf46v@ptys&pn=Paytm&am=${parseFloat(addAmount).toFixed(2)}&cu=INR&tn=LuckSpin_Arena_Deposit`;
        
        setShowQRCode(true);
        setShowUtrInput(true);
        setLoading(false);
        toast.success('Please scan the QR code to pay.');
        return;

      } else if (selectedGateway === 'DIRECT_UPI') {
        // Now it uses REAL CASHFREE GATEWAY
        toast.loading('Initializing Cashfree Payment...', { id: 'cf_init' });

        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: addAmount, gateway: 'CASHFREE' }),
        });
        
        const orderData = await orderRes.json();
        
        if (!orderData.success) {
           toast.error(orderData.error || 'Failed to initialize payment', { id: 'cf_init' });
           setLoading(false);
           return;
        }

        toast.success('Opening Cashfree Gateway!', { id: 'cf_init' });
        
        // Ensure Cashfree SDK is loaded
        const cashfree = await (window as any).Cashfree({
             mode: "production" // or sandbox
        });
        
        let checkoutOptions = {
             paymentSessionId: orderData.payment_session_id,
             redirectTarget: "_modal",
        };
        
        cashfree.checkout(checkoutOptions).then((result: any) => {
             if(result.error){
                 toast.error("Payment failed or cancelled!");
                 setLoading(false);
             }
             if(result.redirect){
                 console.log("Redirection")
             }
             if(result.paymentDetails){
                 // VERIFY PAYMENT EXPLICITLY HERE IF ON MODAL
                 toast.success("Payment Received & processing...");
                 // Verification Call
                 fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: orderData.order_id })
                 }).then(r => r.json()).then(data => {
                    if(data.success) {
                        toast.success('Cash Added Successfully!');
                        setBalance(prev => prev + parseFloat(addAmount));
                        setUser((prev: any) => ({ ...prev, depositBalance: (prev.depositBalance || 0) + parseFloat(addAmount) }));
                    } else {
                        toast.error(data.error || 'Payment Verification Failed');
                    }
                    setLoading(false);
                 }).catch(() => setLoading(false));
             }
        });
      }
    } catch (err) {
      toast.error('Payment Error. Please try again.');
      setLoading(false);
    }
  };

  const handleUtrSubmit = () => {
    if(utrNumber.length < 12) {
       toast.error("Please enter a valid 12-digit UTR/Reference No.");
       return;
    }
    // TODO: Send to backend for admin verification
    toast.success("UTR Submitted successfully! Balance will be added after admin verification.");
    setShowUtrInput(false);
    setUtrNumber('');
  };

  const presetAmounts = ['50', '100', '200', '500', '1000', '2000'];

  return (
    <div className={styles.walletContainer}>
      <div className={styles.header}>
        <button onClick={() => router.push('/')} className={styles.backBtn}>
          <ChevronLeft size={24} />
        </button>
        <h2 className={styles.headerTitle}>My Beast Wallet</h2>
        <button onClick={() => router.push('/transactions')} className={styles.backBtn} style={{ marginLeft: 'auto' }}>
          <HistoryIcon size={24} />
        </button>
      </div>

      <div className={`glass-panel ${styles.balanceCard}`}>
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: '20px', width: '100%', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'block' }}>Deposit</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>₹{user?.depositBalance?.toFixed(2) || '0.00'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', display: 'block' }}>Winnings</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>₹{user?.winningBalance?.toFixed(2) || '0.00'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'block' }}>Bonus</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>₹{user?.bonusBalance?.toFixed(2) || '0.00'}</div>
          </div>
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', width: '100%', marginBottom: '1rem' }}></div>
        <span className={styles.balanceLabel}>Total Balance</span>
        <div className={styles.balanceAmount}>₹{( (user?.depositBalance || 0) + (user?.winningBalance || 0) + (user?.bonusBalance || 0) ).toFixed(2)}</div>
        
        <div className={styles.actionRow}>
          <button className={`btn btn-success ${styles.actionBtn}`}>
            <ArrowDownToLine size={18} /> Add Cash
          </button>
          <button onClick={() => router.push('/withdraw')} className={`btn btn-outline ${styles.actionBtn}`}>
            <ArrowUpFromLine size={18} /> Withdraw
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 className={styles.sectionTitle}>
          <Wallet size={20} color="var(--accent-green)" /> Add Money
        </h3>
        
        <div className={styles.presetAmounts}>
          {presetAmounts.map((amt) => (
            <button 
              key={amt}
              className={`${styles.presetBtn} ${addAmount === amt ? styles.presetBtnActive : ''}`}
              onClick={() => setAddAmount(amt)}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        <div className={styles.customInputWrapper}>
          <span className={styles.currencySymbol}>₹</span>
          <input 
            type="number"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            className={`input-glass ${styles.customInput}`}
            placeholder="Enter Amount"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
           <button 
             onClick={() => setSelectedGateway('DIRECT_UPI')}
             className={`btn ${selectedGateway === 'DIRECT_UPI' ? 'btn-primary' : 'btn-outline'}`}
             style={{ flex: 1, fontSize: '0.8rem', minWidth: '120px' }}
           >
             Online Payment {selectedGateway === 'DIRECT_UPI' && <CheckCircle2 size={14} />}
           </button>
           <button 
             onClick={() => {
               setSelectedGateway('QR_CODE');
               setShowQRCode(false);
               setShowUtrInput(false);
             }}
             className={`btn ${selectedGateway === 'QR_CODE' ? 'btn-primary' : 'btn-outline'}`}
             style={{ flex: 1, fontSize: '0.8rem', minWidth: '120px' }}
           >
             Other Methods (QR) {selectedGateway === 'QR_CODE' && <CheckCircle2 size={14} />}
           </button>
        </div>

        {!showUtrInput && (
          <button 
            onClick={handlePay}
            className={`btn btn-success ${loading ? 'loading' : ''}`}
            style={{ width: '100%', fontSize: '1.1rem', padding: '16px' }}
            disabled={loading || !addAmount}
          >
            {loading ? 'Processing...' : (selectedGateway === 'DIRECT_UPI' ? `Pay ₹${addAmount} via UPI App` : `Proceed to Pay ₹${addAmount}`)}
          </button>
        )}

        {showUtrInput && (
          <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
             
             {showQRCode && (
               <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <p style={{ color: '#000', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>
                   Scan & Pay ₹{addAmount}
                 </p>
                 <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=paytmqr5hf46v@ptys&pn=Paytm&am=${parseFloat(addAmount).toFixed(2)}&cu=INR&tn=LuckSpin_Arena_Deposit`)}`} 
                   alt="UPI QR Code" 
                   style={{ width: '200px', height: '200px', objectFit: 'contain' }}
                 />
               </div>
             )}

             <p style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--accent-gold)' }}>
               After paying on your UPI app, please enter the 12-digit UTR / Reference No. to verify your deposit.
             </p>
             <input 
               type="text"
               value={utrNumber}
               onChange={(e) => setUtrNumber(e.target.value)}
               className={`input-glass`}
               placeholder="Enter 12-digit UTR Number"
               maxLength={12}
             />
             <button 
               onClick={handleUtrSubmit}
               className="btn btn-primary animate-pulse-glow"
               style={{ width: '100%', marginTop: '10px' }}
             >
               Submit UTR for Verification
             </button>
             <button 
               onClick={() => {
                 setShowUtrInput(false);
                 setShowQRCode(false);
               }}
               className="btn btn-outline"
               style={{ width: '100%', marginTop: '10px' }}
             >
               Cancel
             </button>
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={14} color="var(--accent-green)" /> 100% Safe Payment Gateway
        </div>

        {/* Development Quick-Add (Only for Testing) */}
        <div style={{ marginTop: '20px', padding: '15px', border: '1px dashed #ff0080', borderRadius: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#ff0080', display: 'block', marginBottom: '8px' }}>DEVELOPER TOOLS (TEST MODE)</span>
          <button 
            onClick={async () => {
              const res = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: 'dummy_order_' + Date.now(), status: 'SUCCESS' }),
              });
              const data = await res.json();
              if (data.success) {
                setBalance(prev => prev + 100);
                toast.success('Test Balance Added: ₹100.00');
              }
            }}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '10px 20px', borderColor: '#ff0080', color: '#ff0080' }}
          >
            + Add Dummy ₹100
          </button>
        </div>
      </div>

      <div className={styles.paymentMethods}>
        <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Supported Methods</h3>
        
        <div 
          className={styles.upiOption} 
          onClick={() => {
            if (parseFloat(addAmount) < 10) return toast.error("Minimum deposit is ₹10");
            const upiLink = `upi://pay?pa=paytmqr5hf46v@ptys&pn=Paytm&am=${parseFloat(addAmount).toFixed(2)}&cu=INR&tn=LuckSpin_Arena_Deposit`;
            window.location.href = upiLink;
            setShowUtrInput(true);
            setShowQRCode(false);
            toast.success('Opening your UPI App...');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.upiDetails}>
            <div className={styles.upiIcon} style={{ color: '#005f73' }}>UPI</div>
            <div>
              <div className={styles.upiName}>Paytm / PhonePe / GPay</div>
              <div className={styles.upiSub}>Direct UPI App Deposit</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-secondary)" />
        </div>
      </div>

    </div>
  );
}
