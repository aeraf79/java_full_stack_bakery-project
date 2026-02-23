import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone, Lock, ArrowRight, X, Check, Sparkles, ChefHat, Coffee, Croissant } from 'lucide-react';
import './auth.css';

// ─── Validation Rules ───────────────────────────────────────────────────────
const RULES = {
  fullName: [
    { test: (v) => /^[a-zA-Z\s'-]+$/.test(v),    msg: 'Name can only contain letters, spaces, hyphens and apostrophes' },
    { test: (v) => v.trim().length > 0,          msg: 'Full name is required' },
    { test: (v) => v.trim().length >= 3,         msg: 'Name must be at least 3 characters' },
    { test: (v) => v.trim().length <= 50,        msg: 'Name must be less than 50 characters' },
    { test: (v) => !/\s{2,}/.test(v),            msg: 'Name cannot have consecutive spaces' },
  ],
  email: [
    { test: (v) => v.trim().length > 0,                           msg: 'Email is required' },
    { test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),         msg: 'Please enter a valid email address' },
    { test: (v) => v.length <= 100,                               msg: 'Email must be less than 100 characters' },
    { test: (v) => !/\s/.test(v),                                 msg: 'Email cannot contain spaces' },
  ],
  phoneNumber: [
    { test: (v) => v.trim().length > 0,           msg: 'Phone number is required' },
    { test: (v) => /^[0-9]+$/.test(v),            msg: 'Phone number must contain only digits' },
    { test: (v) => v.length === 10,               msg: 'Phone number must be exactly 10 digits' },
    { test: (v) => !/^(.)\1{9}$/.test(v),         msg: 'Phone number cannot be all the same digit' },
    { test: (v) => !['0000000000','1111111111','9999999999'].includes(v), msg: 'Please enter a valid phone number' },
  ],
  password: [
    { test: (v) => v.length > 0,                  msg: 'Password is required' },
    { test: (v) => v.length >= 6,                 msg: 'Password must be at least 6 characters' },
    { test: (v) => v.length <= 64,                msg: 'Password must be less than 64 characters' },
    { test: (v) => !/\s/.test(v),                 msg: 'Password cannot contain spaces' },
  ],
};

// Password strength checklist shown to user
const PASSWORD_CHECKS = [
  { label: 'At least 6 characters',        test: (v) => v.length >= 6 },
  { label: 'At least 8 characters',        test: (v) => v.length >= 8 },
  { label: 'Contains uppercase letter',    test: (v) => /[A-Z]/.test(v) },
  { label: 'Contains lowercase letter',    test: (v) => /[a-z]/.test(v) },
  { label: 'Contains a number',            test: (v) => /[0-9]/.test(v) },
  { label: 'Contains special character',   test: (v) => /[^a-zA-Z0-9]/.test(v) },
];

function validateField(field, value) {
  for (const rule of RULES[field]) {
    if (!rule.test(value)) return rule.msg;
  }
  return '';
}

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6)  score += 15;
  if (password.length >= 8)  score += 15;
  if (password.length >= 12) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  const capped = Math.min(score, 100);
  if (capped < 35)  return { score: capped, label: 'Weak',   color: '#dc3545' };
  if (capped < 70)  return { score: capped, label: 'Fair',   color: '#fd7e14' };
  if (capped < 90)  return { score: capped, label: 'Good',   color: '#ffc107' };
  return            { score: capped, label: 'Strong', color: '#28a745' };
}

// ─── Component ───────────────────────────────────────────────────────────────
const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phoneNumber: ''
  });
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const strength = getPasswordStrength(formData.password);

  // Live validate a field only after it has been touched
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone: block non-numeric input at source
    if (name === 'phoneNumber' && value && !/^[0-9]*$/.test(value)) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (apiError) setApiError('');
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, formData[field] || '')
    }));
    if (field === 'password') setShowChecklist(false);
  };

  const handleFocus = (field) => {
    if (field === 'password') setShowChecklist(true);
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
    if (!validateAll()) return;

    setLoading(true);
    setApiError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'USER' })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify({
            email: data.email, fullName: data.fullName, role: data.role
          }));
        }
        // Show success toast-like message
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.innerHTML = '<div class="toast-content"><Check size={18} /> Registration Successful! Please sign in.</div>';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
        
        setTimeout(() => navigate('/login'), 1500);
      } else {
        if (typeof data === 'object' && !data.error && !data.message) {
          setErrors((prev) => ({ ...prev, ...data }));
          setTouched({ fullName: true, email: true, password: true, phoneNumber: true });
        } else {
          setApiError(data.error || data.message || 'Registration failed. Please try again.');
        }
      }
    } catch {
      setApiError('Network error. Please check your connection and ensure the backend is running.');
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
        {/* Left Side - Image/Visual */}
        <div className="auth-visual-side">
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

        {/* Right Side - Form */}
        <div className="auth-form-panel">
          <div className="form-container">
            <div className="form-header">
              <div className="header-icon">
                <Croissant size={32} />
              </div>
              <h2>Create Account</h2>
              <p>Join our bakery family today</p>
            </div>

            {apiError && (
              <div className="alert-message error">
                <X size={18} />
                <span>{apiError}</span>
                <button className="alert-close" onClick={() => setApiError('')}>×</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modern-form">

              {/* Full Name */}
              <div className="modern-form-group">
                <label htmlFor="fullName">Full Name</label>
                <div className="input-wrapper-modern">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('fullName')}
                    className={
                      errors.fullName && touched.fullName ? 'error'
                      : fieldOk('fullName') ? 'success' : ''
                    }
                    placeholder="John Anderson"
                    maxLength={50}
                    autoComplete="name"
                  />
                  {fieldOk('fullName') && (
                    <Check size={16} className="input-success-icon" />
                  )}
                  {errors.fullName && touched.fullName && (
                    <X size={16} className="input-error-icon" />
                  )}
                </div>
                {errors.fullName && touched.fullName && (
                  <span className="error-text">{errors.fullName}</span>
                )}
              </div>

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
                    maxLength={100}
                    autoComplete="email"
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

              {/* Phone Number */}
              <div className="modern-form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <div className="input-wrapper-modern">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    onBlur={() => handleBlur('phoneNumber')}
                    className={
                      errors.phoneNumber && touched.phoneNumber ? 'error'
                      : fieldOk('phoneNumber') ? 'success' : ''
                    }
                    placeholder="1234567890"
                    maxLength={10}
                    autoComplete="tel"
                  />
                  {fieldOk('phoneNumber') && (
                    <Check size={16} className="input-success-icon" />
                  )}
                  {errors.phoneNumber && touched.phoneNumber && (
                    <X size={16} className="input-error-icon" />
                  )}
                </div>
                {errors.phoneNumber && touched.phoneNumber && (
                  <span className="error-text">{errors.phoneNumber}</span>
                )}
                {touched.phoneNumber && !errors.phoneNumber && (
                  <span className="char-hint">{formData.phoneNumber.length}/10</span>
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
                    onFocus={() => handleFocus('password')}
                    className={
                      errors.password && touched.password ? 'error'
                      : fieldOk('password') ? 'success' : ''
                    }
                    placeholder="Create a strong password"
                    maxLength={64}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-modern"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Strength indicator */}
                {formData.password && (
                  <div className="strength-modern">
                    <div className="strength-bars">
                      <div className={`strength-bar ${strength.score >= 20 ? 'active' : ''}`} style={{backgroundColor: strength.score >= 20 ? strength.color : '#e0e0e0'}}></div>
                      <div className={`strength-bar ${strength.score >= 40 ? 'active' : ''}`} style={{backgroundColor: strength.score >= 40 ? strength.color : '#e0e0e0'}}></div>
                      <div className={`strength-bar ${strength.score >= 60 ? 'active' : ''}`} style={{backgroundColor: strength.score >= 60 ? strength.color : '#e0e0e0'}}></div>
                      <div className={`strength-bar ${strength.score >= 80 ? 'active' : ''}`} style={{backgroundColor: strength.score >= 80 ? strength.color : '#e0e0e0'}}></div>
                    </div>
                    <span className="strength-label-modern" style={{color: strength.color}}>
                      {strength.label}
                    </span>
                  </div>
                )}

                {/* Password checklist */}
                {(showChecklist || (touched.password && formData.password)) && (
                  <div className="checklist-modern">
                    {PASSWORD_CHECKS.map((check) => {
                      const ok = check.test(formData.password);
                      return (
                        <div key={check.label} className={`checklist-item ${ok ? 'valid' : ''}`}>
                          <span className="check-icon-modern">
                            {ok ? <Check size={12} /> : <X size={12} />}
                          </span>
                          <span>{check.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {errors.password && touched.password && (
                  <span className="error-text">{errors.password}</span>
                )}
              </div>

              <div className="terms-modern">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">
                  I agree to the <button type="button" className="link-modern">Terms</button> and <button type="button" className="link-modern">Privacy Policy</button>
                </label>
              </div>

              <button type="submit" className="submit-modern" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-modern"></span>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="footer-modern">
                <p>
                  Already have an account?{' '}
                  <button type="button" onClick={() => navigate('/login')} className="link-modern">
                    
                    Sign in
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
      </div>
    </div>
  );
};

export default Register;