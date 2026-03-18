'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Phone, Lock, ChevronLeft, Gamepad2, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  
  // State
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login Flow
        if (!username && !phone) {
           toast.error('Please enter your username or phone number');
           setLoading(false);
           return;
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phone_or_username: username || phone, 
            password 
          }),
        });
        const data = await res.json();
        
        if (data.success) {
          toast.success('Welcome back! Login Successful.');
          router.push('/');
        } else {
          toast.error(data.error || 'Invalid credentials');
        }

      } else {
        // Registration Flow
        if (phone.length !== 10) {
           toast.error('Enter a valid 10-digit number');
           setLoading(false);
           return;
        }
        if (password.length < 6) {
           toast.error('Password must be at least 6 characters');
           setLoading(false);
           return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, phone, password }),
        });
        const data = await res.json();
        
        if (data.success) {
          toast.success('Account created successfully!');
          router.push('/');
        } else {
          toast.error(data.error || 'Failed to register');
        }
      }
    } catch (err) {
      toast.error('Network Error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <button onClick={() => router.push('/')} className={styles.backBtn}>
        <ChevronLeft size={20} />
        Back to Home
      </button>

      <div className={`glass-panel ${styles.authCard}`}>
        <div className={styles.brandLogo}>
          <Gamepad2 size={40} color="var(--primary-accent)" style={{ margin: '0 auto 12px' }} />
          <h1><span className="text-gradient">SkillSpin</span> Arena</h1>
          <p className={styles.authSubtitle}>
            {isLogin ? 'Login to your account' : 'Create a new account'}
          </p>
        </div>

        <form className={styles.authForm} onSubmit={handleAuth}>
          
          {/* Username Field (Always for Signup, optional visual swap for Login) */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>{isLogin ? 'Username or Phone' : 'Username'}</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.iconPrefix} />
              <input 
                type="text" 
                placeholder={isLogin ? 'Enter username or phone' : 'Choose a username'}
                className={`input-glass ${styles.inputWithIcon}`}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Phone Field (Only for Signup) */}
          {!isLogin && (
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
                />
              </div>
            </div>
          )}

          {/* Password Field */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.iconPrefix} />
              <input 
                type="password" 
                placeholder="Enter password" 
                className={`input-glass ${styles.inputWithIcon}`}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`btn btn-primary ${loading ? 'loading' : ''}`} 
            style={{ marginTop: '16px', width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login Now' : 'Create Account')}
          </button>
        </form>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <div className={styles.authFooter}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            className={styles.authLink} 
            onClick={() => {
              setIsLogin(!isLogin);
              setUsername(''); // Reset forms
              setPhone('');
              setPassword('');
            }}
          >
            {isLogin ? 'Sign up here' : 'Login here'}
          </span>
        </div>
      </div>
    </div>
  );
}
