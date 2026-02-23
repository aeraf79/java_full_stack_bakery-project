import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, Phone, Save,
  Camera, Edit2, X, Check, Lock
} from 'lucide-react';
import './profile.css';
import Footer from '../components/Footer';

const Profile = () => {
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [userData, setUserData] = useState({
    userId: null, fullName: '', email: '', phoneNumber: '', role: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── Load user: try localStorage first, then fetch from /api/users/profile ── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const storedUser = localStorage.getItem('user');
    let parsed = null;
    try { parsed = storedUser ? JSON.parse(storedUser) : null; } catch (_) {}

    // If localStorage already has userId, use it directly
    if (parsed?.userId) {
      const u = {
        userId: parsed.userId,
        fullName: parsed.fullName || '',
        email: parsed.email || '',
        phoneNumber: parsed.phoneNumber || '',
        role: parsed.role || 'USER'
      };
      setUserData(u);
      setOriginalData(u);
      return;
    }

    // userId missing in localStorage (old login session) → fetch from backend
    fetch('http://localhost:8080/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) { navigate('/login'); return null; }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        const u = {
          userId: data.userId,
          fullName: data.fullName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          role: data.role || 'USER'
        };
        // Update localStorage so future loads don't need the extra fetch
        localStorage.setItem('user', JSON.stringify({ ...parsed, ...u }));
        setUserData(u);
        setOriginalData(u);
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const validatePasswords = () => {
    if (!passwordData.newPassword) return true;
    if (!passwordData.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required.' });
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validatePasswords()) return;

    // Guard: userId must be present before calling PATCH
    if (!userData.userId) {
      setMessage({ type: 'error', text: 'Session error — please log out and log in again.' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');

      const payload = {
        fullName: userData.fullName,
        email: userData.email,
        phoneNumber: userData.phoneNumber
      };
      if (passwordData.newPassword) {
        payload.currentPassword = passwordData.currentPassword;
        payload.newPassword = passwordData.newPassword;
      }

      const response = await fetch(
        `http://localhost:8080/api/users/patch/${userData.userId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update profile');
      }

      const updated = await response.json();
      const refreshed = {
        userId: updated.userId,
        fullName: updated.fullName || '',
        email: updated.email || '',
        phoneNumber: updated.phoneNumber || '',
        role: updated.role || ''
      };

      // Persist to localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...refreshed }));

      setUserData(refreshed);
      setOriginalData(refreshed);
      setIsEditing(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: '✓ Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setUserData(originalData);
    setIsEditing(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="profile-page">
      <nav className={`user-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo">Maison Dorée</div>
          <button className="back-btn" onClick={() => navigate('/userpanel')}>
            <ArrowLeft size={20} /><span>Back to Dashboard</span>
          </button>
        </div>
      </nav>

      <main className="profile-content">
        <div className="profile-container">

          <div className="profile-header">
            <div>
              <h1>Profile Settings</h1>
              <p>Manage your account information</p>
            </div>
            {!isEditing && (
              <button className="edit-header-btn" onClick={() => setIsEditing(true)}>
                <Edit2 size={18} /><span>Edit Profile</span>
              </button>
            )}
          </div>

          {message.text && (
            <div className={`message-banner ${message.type}`}>
              {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="profile-card">
            <div className="profile-picture-section">
              <div className="profile-picture">
                <div className="picture-placeholder"><User size={48} /></div>
                {isEditing && <button className="change-picture-btn"><Camera size={16} /></button>}
              </div>
              <div className="picture-info">
                <h3>{userData.fullName}</h3>
                <p>{userData.email}</p>
              </div>
            </div>

            <div className="profile-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label><User size={18}/> Full Name</label>
                    <input type="text" name="fullName" value={userData.fullName}
                      onChange={handleInputChange} disabled={!isEditing}
                      className={isEditing ? 'editable' : ''} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label><Mail size={18}/> Email</label>
                    <input type="email" name="email" value={userData.email}
                      onChange={handleInputChange} disabled={!isEditing}
                      className={isEditing ? 'editable' : ''} />
                  </div>
                  <div className="form-group">
                    <label><Phone size={18}/> Phone</label>
                    <input type="tel" name="phoneNumber" value={userData.phoneNumber}
                      onChange={handleInputChange} disabled={!isEditing}
                      className={isEditing ? 'editable' : ''} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Change Password</h3>
                {!isEditing ? (
                  <div className="form-row">
                    <div className="form-group">
                      <label><Lock size={18}/> Password</label>
                      <input type="password" value="********" disabled />
                    </div>
                  </div>
                ) : (
                  <div className="form-row">
                    <div className="form-group">
                      <label><Lock size={18}/> Current Password</label>
                      <input type="password" name="currentPassword" placeholder="Enter current password"
                        value={passwordData.currentPassword} onChange={handlePasswordChange} className="editable" />
                    </div>
                    <div className="form-group">
                      <label><Lock size={18}/> New Password</label>
                      <input type="password" name="newPassword" placeholder="Min. 6 characters"
                        value={passwordData.newPassword} onChange={handlePasswordChange} className="editable" />
                    </div>
                    <div className="form-group">
                      <label><Lock size={18}/> Confirm Password</label>
                      <input type="password" name="confirmPassword" placeholder="Repeat new password"
                        value={passwordData.confirmPassword} onChange={handlePasswordChange} className="editable" />
                    </div>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button className="cancel-btn" onClick={handleCancel}>
                    <X size={18}/> Cancel
                  </button>
                  <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                    {isSaving
                      ? <><div className="spinner"></div>Saving...</>
                      : <><Save size={18}/> Save Changes</>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;