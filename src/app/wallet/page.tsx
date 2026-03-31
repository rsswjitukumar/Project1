'use client';
// Force redeploy with real Paytm keys sync 2026.1

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { ChevronLeft, Wallet, ArrowDownToLine, ArrowUpFromLine, ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [addAmount, setAddAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'RAZORPAY' | 'PAYTM'>('RAZORPAY');

  useEffect(() => {
    // Dynamically load Razorpay script
    const loadRazorpayScript = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    };
    loadRazorpayScript();

    // Fetch secure profile
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setBalance(data.user.walletBalance);
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
      // 1. Create Order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: addAmount, gateway: selectedGateway }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
         toast.error(orderData.error || 'Failed to initialize payment');
         setLoading(false);
         return;
      }

      if (selectedGateway === 'RAZORPAY') {
        // Real Razorpay Flow
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: orderData.order.amount * 100,
          currency: orderData.order.currency,
          name: "SkillSpin Arena",
          description: "Add Cash to Wallet",
          order_id: orderData.order.id,
          handler: async function (response: any) {
            // 2. Verify Payment
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                orderId: orderData.order.id, 
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                status: 'SUCCESS' 
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setBalance(prev => prev + parseFloat(addAmount));
              toast.success('Cash Added Successfully!');
            } else {
              toast.error(verifyData.error || 'Payment verification failed');
            }
          },
          prefill: {
            name: user.username || "Gamer",
            contact: user.phone || ""
          },
          theme: { color: "#6366f1" }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setLoading(false);

      } else if (selectedGateway === 'PAYTM' && orderData.order.txnToken) {
        // REAL PAYTM JS CHECKOUT FLOW
        // Laptop/PC par QR dikhayega, Mobile par App Open karega
        const mid = orderData.order.mid;
        const isProd = process.env.NODE_ENV === 'production' && process.env.PAYTM_WEBSITE !== 'WEBSTAGING';
        
        const loadPaytmScript = () => {
          return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = `https://securegw${isProd ? '' : '-stage'}.paytm.in/merchantpgpui/checkoutjs/merchants/${mid}.js`;
            script.async = true;
            script.onload = resolve;
            document.body.appendChild(script);
          });
        };

        await loadPaytmScript();

        if (window.Paytm && window.Paytm.CheckoutJS) {
          const config = {
            "root": "",
            "flow": "DEFAULT", // This is mandatory for Desktop QR & Mobile Intent
            "data": {
              "orderId": orderData.order.id,
              "token": orderData.order.txnToken,
              "tokenType": "TXN_TOKEN",
              "amount": orderData.order.amount.toString()
            },
            "handler": {
              "notifyMerchant": async function(eventName: string, data: any) {
                if (eventName === 'SESSION_FINISHED') {
                  // After session finishes, trigger secure server-side verification
                  const verifyRes = await fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      orderId: orderData.order.id, 
                      status: 'SUCCESS' 
                    }),
                  });
                  const verifyData = await verifyRes.json();
                  if (verifyData.success) {
                    setBalance(prev => prev + parseFloat(addAmount));
                    toast.success('Money Added Successfully!');
                    setTimeout(() => window.location.reload(), 2000);
                  } else {
                    toast.error(verifyData.error || 'Verification pending. Check balance in 5 mins.');
                  }
                }
              }
            }
          };

          window.Paytm.CheckoutJS.init(config).then(function onSuccess() {
            window.Paytm.CheckoutJS.invoke();
          }).catch(function onError(error: any) {
            console.error("Paytm invoke error:", error);
            toast.error("Paytm initialization failed. Check your MID/Key.");
          });
        }
        setLoading(false);
      } else {
        // STRICT: No more direct adding of money
        toast.error('Real Paytm gateway could not start. Please add Merchant Keys in Vercel Settings.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Payment Error. Please try again.');
      setLoading(false);
    }
  };

  const presetAmounts = ['50', '100', '200', '500', '1000', '2000'];

  return (
    <div className={styles.walletContainer}>
      <div className={styles.header}>
        <button onClick={() => router.push('/')} className={styles.backBtn}>
          <ChevronLeft size={24} />
        </button>
        <h2 className={styles.headerTitle}>My Beast Wallet</h2>
      </div>

      <div className={`glass-panel ${styles.balanceCard}`}>
        <span className={styles.balanceLabel}>Total Balance</span>
        <div className={styles.balanceAmount}>₹{balance.toFixed(2)}</div>
        
        <div className={styles.actionRow}>
          <button className={`btn btn-success ${styles.actionBtn}`}>
            <ArrowDownToLine size={18} /> Add Cash
          </button>
          <button className={`btn btn-outline ${styles.actionBtn}`}>
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

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
           <button 
             onClick={() => setSelectedGateway('RAZORPAY')}
             className={`btn ${selectedGateway === 'RAZORPAY' ? 'btn-primary' : 'btn-outline'}`}
             style={{ flex: 1, fontSize: '0.8rem' }}
           >
             Razorpay {selectedGateway === 'RAZORPAY' && <CheckCircle2 size={14} />}
           </button>
           <button 
             onClick={() => setSelectedGateway('PAYTM')}
             className={`btn ${selectedGateway === 'PAYTM' ? 'btn-primary' : 'btn-outline'}`}
             style={{ flex: 1, fontSize: '0.8rem' }}
           >
             Paytm {selectedGateway === 'PAYTM' && <CheckCircle2 size={14} />}
           </button>
        </div>

        <button 
          onClick={handlePay}
          className={`btn btn-success ${loading ? 'loading' : ''}`}
          style={{ width: '100%', fontSize: '1.1rem', padding: '16px' }}
          disabled={loading || !addAmount}
        >
          {loading ? 'Processing...' : `Pay ₹${addAmount} via ${selectedGateway}`}
        </button>
        
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={14} color="var(--accent-green)" /> 100% Safe Payment Gateway
        </div>
      </div>

      <div className={styles.paymentMethods}>
        <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Supported Methods</h3>
        
        <div className={styles.upiOption}>
          <div className={styles.upiDetails}>
            <div className={styles.upiIcon} style={{ color: '#005f73' }}>UPI</div>
            <div>
              <div className={styles.upiName}>Paytm / PhonePe / GPay</div>
              <div className={styles.upiSub}>Instant Deposit via Razorpay</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-secondary)" />
        </div>
      </div>

    </div>
  );
}
