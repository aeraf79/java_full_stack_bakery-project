import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X, Mail, Lock, ArrowRight, Check, Sparkles, ChefHat, Coffee, Croissant } from 'lucide-react';
import './auth.css';

// ─── Validation Rules ───────────────────────────────────────────────────────
const RULES = {
  email: [
    { test: (v) => v.trim().length > 0,                     msg: 'Email is required' },
    { test: (v) => !/\s/.test(v),                           msg: 'Email cannot contain spaces' },
    { test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),   msg: 'Please enter a valid email address' },
  ],
  password: [
    { test: (v) => v.length > 0,   msg: 'Password is required' },
    { test: (v) => v.length >= 6,  msg: 'Password must be at least 6 characters' },
    { test: (v) => !/\s/.test(v),  msg: 'Password cannot contain spaces' },
  ],
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

function validateField(field, value) {
  for (const rule of RULES[field]) {
    if (!rule.test(value)) return rule.msg;
  }
  return '';
}

// ─── Component ───────────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [errors,   setErrors]       = useState({});
  const [touched,  setTouched]      = useState({});
  const [loading,  setLoading]      = useState(false);
  const [apiError, setApiError]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);

  // Rate-limiting state
  const [attempts,       setAttempts]       = useState(0);
  const [lockedOut,      setLockedOut]      = useState(false);
  const [lockoutTimer,   setLockoutTimer]   = useState(0);
  const timerRef = useRef(null);

  // Live validate after touch
  useEffect(() => {
    Object.keys(touched).forEach((field) => {
      if (touched[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: validateField(field, formData[field] || '')
        }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // Lockout countdown
  useEffect(() => {
    if (lockedOut) {
      setLockoutTimer(LOCKOUT_SECONDS);
      timerRef.current = setInterval(() => {
        setLockoutTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setLockedOut(false);
            setAttempts(0);
            setApiError('');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [lockedOut]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Block spaces in email and password fields
    if ((name === 'email' || name === 'password') && value.includes(' ')) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (apiError) setApiError('');
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, formData[field] || '')
    }));
  };

  const validateAll = () => {
    const newErrors = {};
    const allTouched = {};
    Object.keys(RULES).forEach((field) => {
      allTouched[field] = true;
      const msg = validateField(field, formData[field] || '');
      if (msg) newErrors[field] = msg;
    });
    setTouched(allTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockedOut) return;
    if (!validateAll()) return;

    setLoading(true);
    setApiError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Reset attempts on success
        setAttempts(0);

        if (data.token) localStorage.setItem('token', data.token);

        const userData = {
          email:    data.email,
          fullName: data.fullName,
          role:     data.role || 'USER'
        };
        localStorage.setItem('user', JSON.stringify(userData));

        // Show success toast-like message
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.innerHTML = `<div class="toast-content"><Check size={18} /> Welcome back, ${userData.fullName}!</div>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);

        setTimeout(() => {
          if (userData.role === 'ADMIN') {
            alert('Admin login successful! Redirecting to admin panel...');
            navigate('/adminpanel');
          } else {
            navigate('/userpanel');
            alert('Login successful! Redirecting to your dashboard...');
          }
        }, 1500);
      } else {
        // Track failed attempts → lockout
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedOut(true);
          setApiError(`Too many failed attempts. Please wait ${LOCKOUT_SECONDS} seconds.`);
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          const base = data.error || data.message || 'Invalid email or password.';
          setApiError(
            remaining <= 2
              ? `${base} ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`
              : base
          );
        }
      }
    } catch {
      setApiError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fieldOk = (field) =>
    touched[field] && !errors[field] && formData[field];

  return (
    <div className="auth-page">
      <div className="auth-pattern"></div>
      
      {/* Floating bakery icons */}
      <div className="floating-icon icon-1"><Croissant size={24} /></div>
      <div className="floating-icon icon-2"><Coffee size={24} /></div>
      <div className="floating-icon icon-3"><ChefHat size={24} /></div>
      <div className="floating-icon icon-4"><Sparkles size={24} /></div>

      <div className="auth-wrapper">
        {/* Left Side - Form */}
        <div className="auth-form-panel left-panel">
          <div className="form-container">
            <div className="form-header">
              <div className="header-icon">
                <Croissant size={32} />
              </div>
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>
            </div>

            {apiError && (
              <div className={`alert-message error ${lockedOut ? 'lockout' : ''}`}>
                <X size={18} />
                <span>
                  {apiError}
                  {lockedOut && (
                    <strong> {lockoutTimer}s</strong>
                  )}
                </span>
                <button className="alert-close" onClick={() => setApiError('')}>×</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modern-form">

              {/* Email */}
              <div className="modern-form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper-modern">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    className={
                      errors.email && touched.email ? 'error'
                      : fieldOk('email') ? 'success' : ''
                    }
                    placeholder="john@example.com"
                    autoComplete="email"
                    disabled={lockedOut}
                  />
                  {fieldOk('email') && (
                    <Check size={16} className="input-success-icon" />
                  )}
                  {errors.email && touched.email && (
                    <X size={16} className="input-error-icon" />
                  )}
                </div>
                {errors.email && touched.email && (
                  <span className="error-text">{errors.email}</span>
                )}
              </div>

              {/* Password */}
              <div className="modern-form-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrapper-modern">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    className={
                      errors.password && touched.password ? 'error'
                      : fieldOk('password') ? 'success' : ''
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={lockedOut}
                  />
                  <button
                    type="button"
                    className="password-toggle-modern"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <span className="error-text">{errors.password}</span>
                )}
              </div>

              <div className="options-modern">
                <label className="checkbox-modern">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-custom-modern"></span>
                  <span className="checkbox-text">Remember me</span>
                </label>
                <button type="button" className="link-modern">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="submit-modern"
                disabled={loading || lockedOut}
              >
                {loading ? (
                  <>
                    <span className="spinner-modern"></span>
                    <span>Signing in...</span>
                  </>
                ) : lockedOut ? (
                  <>
                    <span>Locked — {lockoutTimer}s</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="footer-modern">
                <p>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => navigate('/register')} className="link-modern">
                    Create account
                  </button>
                </p>
              </div>

              <div className="social-modern">
                <div className="social-divider-modern">
                  <span>or continue with</span>
                </div>
                <div className="social-buttons-modern">
                  <button type="button" className="social-btn-modern google">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                  </button>
                  <button type="button" className="social-btn-modern facebook">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="currentColor" d="M22,12c0-5.523-4.477-10-10-10S2,6.477,2,12c0,4.991,3.657,9.128,8.438,9.879v-6.99h-2.54V12h2.54V9.797c0-2.506,1.492-3.89,3.777-3.89c1.094,0,2.238,0.195,2.238,0.195v2.46h-1.26c-1.243,0-1.63,0.771-1.63,1.562V12h2.773l-0.443,2.89h-2.33v6.99C18.343,21.128,22,16.991,22,12z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Image/Visual */}
        <div className="auth-visual-side right-panel">
          <div className="visual-content">
            <div className="visual-overlay"></div>
            <div className="visual-text">
              <span className="visual-badge">Welcome to</span>
              <h2 className="visual-title">Maison Dorée</h2>
              <p className="visual-subtitle">Artisan Bakery Since 1985</p>
              
              <div className="visual-stats">
                <div className="stat-item">
                  <span className="stat-number">40+</span>
                  <span className="stat-label">Years of Tradition</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Artisan Recipes</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">10k+</span>
                  <span className="stat-label">Happy Customers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;