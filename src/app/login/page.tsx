'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Phone, Lock, ChevronLeft, Gamepad2, Sparkles, MessageCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (otpSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phone.length !== 10) return toast.error('Enter a valid 10-digit number');
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setCountdown(30);
        toast.success(data.message || 'OTP sent on WhatsApp!');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error('Internal Server Error. Check if server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (data.success) {
        // Will migrate to cookies entirely but sync generic logic for now
        toast.success('Welcome back! Login Successful.');
        router.push('/');
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (err) {
      toast.error('Verification Error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      {/* Back Button */}
      <button onClick={() => router.push('/')} className={styles.backBtn}>
        <ChevronLeft size={20} />
        Back to Home
      </button>

      <div className={`glass-panel ${styles.authCard}`}>
        <div className={styles.brandLogo}>
          <Gamepad2 size={40} color="var(--primary-accent)" style={{ margin: '0 auto 12px' }} />
          <h1><span className="text-gradient">SkillSpin</span> Arena</h1>
          <p className={styles.authSubtitle}>
            {otpSent 
              ? 'Verify the 6-digit code' 
              : isLogin 
                ? 'Login via WhatsApp OTP' 
                : 'Sign up and get ₹50 bonus!'}
          </p>
        </div>

        <form className={styles.authForm} onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
          
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Mobile Number</label>
            <div className={styles.inputWrapper}>
              <Phone size={18} className={styles.iconPrefix} />
              <input 
                type="tel" 
                placeholder="Enter 10-digit number" 
                className={`input-glass ${styles.inputWithIcon}`}
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
              />
            </div>
          </div>

          {otpSent && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>OTP Code</label>
              <div className={styles.inputWrapper}>
                <ShieldCheck size={18} className={styles.iconPrefix} />
                <input 
                  type="text" 
                  ref={otpInputRef}
                  placeholder="Enter 6-digit OTP" 
                  className={`input-glass ${styles.inputWithIcon}`}
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <span 
                  onClick={countdown === 0 && !loading ? () => handleSendOtp() : undefined}
                  style={{ 
                    fontSize: '0.85rem', 
                    color: countdown === 0 ? 'var(--primary-accent)' : '#888',
                    cursor: countdown === 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 500,
                    transition: 'color 0.2s ease'
                  }}
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </span>
              </div>
            </div>
          )}

          {!isLogin && !otpSent && (
             <div className={styles.inputGroup}>
               <label className={styles.inputLabel}>Referral Code (Optional)</label>
               <div className={styles.inputWrapper}>
                 <Sparkles size={18} className={styles.iconPrefix} />
                 <input 
                   type="text" 
                   placeholder="Have a referral code?" 
                   className={`input-glass ${styles.inputWithIcon}`}
                 />
               </div>
             </div>
          )}

          <button 
            type="submit" 
            className={`btn btn-primary ${loading ? 'loading' : ''}`} 
            style={{ marginTop: '8px', gap: '10px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (
              <>
                {otpSent ? 'Verify OTP' : (
                  <>Send OTP <MessageCircle size={18} fill="white" /></>
                )}
              </>
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <button className={styles.socialBtn}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" width={20} height={20} />
          Continue with Google
        </button>

        <div className={styles.authFooter}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            className={styles.authLink} 
            onClick={() => {
              setIsLogin(!isLogin);
              setOtpSent(false);
            }}
          >
            {isLogin ? 'Sign up here' : 'Login here'}
          </span>
        </div>
      </div>
    </div>
  );
}
