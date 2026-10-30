import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../services/apiClient';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useSystemSettings } from '../context/SystemSettingsContext';
import './UserProfilePage.css';

/**
 * 3D Glowing Particles Canvas for Hero Banner
 * Renders small 3D floating luminous particles with perspective projection,
 * camera mouse parallax, radial glow halos, and subtle connecting constellation lines.
 */
function ProfileHeroParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse parallax tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouse.targetX = x * 0.0006;
      mouse.targetY = y * 0.0006;
    };
    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
    }

    // Glowing particle color palette for comfortable soft organic theme
    const colors = [
      'rgba(37, 99, 235, ',   // royal blue
      'rgba(14, 165, 233, ',  // sky cyan
      'rgba(13, 148, 136, ',  // soft calming teal
      'rgba(16, 185, 129, ',  // gentle emerald mint
      'rgba(2, 132, 199, ',   // ocean blue
      'rgba(217, 119, 6, '    // warm amber glint
    ];

    const count = 55;
    const particles = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 850,
      y: (Math.random() - 0.5) * 450,
      z: Math.random() * 550 + 40,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      vz: (Math.random() - 0.5) * 0.45,
      baseRadius: Math.random() * 2.2 + 1.2,
      colorBase: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.03 + 0.015
    }));

    let angleX = 0;
    let angleY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth camera interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;
      angleY = mouse.x;
      angleX = -mouse.y;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const fov = 320;
      const projected = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 3D physics update
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Wrap around 3D boundaries
        if (p.x < -450) p.x = 450;
        if (p.x > 450) p.x = -450;
        if (p.y < -250) p.y = 250;
        if (p.y > 250) p.y = -250;
        if (p.z < 20) p.z = 600;
        if (p.z > 600) p.z = 20;

        // 3D Rotation
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        if (z2 <= -fov + 10) continue;

        const scale = fov / (fov + z2);
        const projX = width / 2 + x1 * scale;
        const projY = height / 2 + y2 * scale;

        p.pulse += p.pulseSpeed;
        const pulseFactor = 0.8 + 0.25 * Math.sin(p.pulse);
        const alpha = Math.min(1, Math.max(0.2, (1 - z2 / 650) * pulseFactor));
        const currentRadius = Math.max(0.9, p.baseRadius * scale * pulseFactor);

        projected.push({
          x: projX,
          y: projY,
          radius: currentRadius,
          alpha,
          colorBase: p.colorBase,
          z: z2
        });
      }

      // Draw subtle luminous constellation lines
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 4900) { // < 70px
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / 70) * 0.22 * Math.min(p1.alpha, p2.alpha);
            ctx.strokeStyle = `rgba(14, 165, 233, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw glowing 3D particles with luminous halos and jewel cores on light background
      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i];
        if (pt.x < -20 || pt.x > width + 20 || pt.y < -20 || pt.y > height + 20) continue;

        // Glowing soft halo
        const glowRadius = pt.radius * 3.5;
        const gradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowRadius);
        gradient.addColorStop(0, `${pt.colorBase}${pt.alpha * 0.45})`);
        gradient.addColorStop(0.4, `${pt.colorBase}${pt.alpha * 0.18})`);
        gradient.addColorStop(1, `${pt.colorBase}0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Vivid jewel core
        ctx.fillStyle = `${pt.colorBase}${Math.min(1, pt.alpha * 0.95)})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0.8, pt.radius * 0.75), 0, Math.PI * 2);
        ctx.fill();

        // Sparkle glint on top
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pt.x - pt.radius * 0.2, pt.y - pt.radius * 0.2, Math.max(0.4, pt.radius * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="profile-particles-canvas" aria-hidden="true" />;
}

const PRESET_AVATARS = [
  { id: 'student', label: 'Student', bg: '#4338ca', icon: '🎓' },
  { id: 'farmer', label: 'Farmer', bg: '#059669', icon: '🌾' },
  { id: 'business', label: 'Business', bg: '#d97706', icon: '💼' },
  { id: 'woman', label: 'Women', bg: '#db2777', icon: '🌸' },
  { id: 'senior', label: 'Senior', bg: '#0284c7', icon: '🌿' },
  { id: 'health', label: 'Health', bg: '#e11d48', icon: '❤️' },
  { id: 'scholar', label: 'Youth', bg: '#7c3aed', icon: '🚀' },
  { id: 'citizen', label: 'Citizen', bg: '#0f766e', icon: '🇮🇳' },
];

function createPresetDataUrl(emoji, bg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="${bg}"/><text x="50%" y="54%" font-size="64" dominant-baseline="middle" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
];

export default function UserProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const { isMaintenanceMode, showMaintenanceAlert } = useSystemSettings();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem('schemesathi_user_profile') || '{}');
      return cached?.profile?.profile_picture || cached?.profile_picture || null;
    } catch (e) {
      return null;
    }
  });

  // Avatar Modal State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(null);

  // Change Password State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    date_of_birth: '',
    gender: '',
    state: '',
    district: '',
    city: '',
    occupation: '',
    education_level: '',
    annual_income: '',
    social_category: '',
    disability_status: 'NO',
    residence_type: '',
    preferred_categories: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchProfile();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: prev.first_name || user.first_name || '',
        last_name: prev.last_name || user.last_name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  // Auto-dismiss password feedback message (success & error) after 4.5 seconds
  useEffect(() => {
    if (passwordMessage) {
      const timer = setTimeout(() => {
        setPasswordMessage(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [passwordMessage]);

  // Auto-dismiss profile update message (success & error) after 4.5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Auto-dismiss avatar modal error after 4.5 seconds
  useEffect(() => {
    if (avatarError) {
      const timer = setTimeout(() => {
        setAvatarError(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [avatarError]);

  // Auto-dismiss delete account error after 4.5 seconds
  useEffect(() => {
    if (deleteError) {
      const timer = setTimeout(() => {
        setDeleteError('');
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [deleteError]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.users.getProfile();
      if (response?.success && (response.data || response.user)) {
        const data = response.data || response.user;
        setProfile(data);
        try {
          sessionStorage.setItem('schemesathi_user_profile', JSON.stringify(data));
        } catch (e) {}
        const p = data.profile || {};
        if (p.profile_picture || data.profile_picture) {
          setProfilePicture(p.profile_picture || data.profile_picture);
        }
        setFormData(prev => ({
          first_name: data.first_name || user?.first_name || prev.first_name || '',
          last_name: data.last_name || user?.last_name || prev.last_name || '',
          phone: data.phone || user?.phone || prev.phone || '',
          email: data.email || user?.email || prev.email || '',
          date_of_birth: p.date_of_birth || '',
          gender: p.gender || '',
          state: p.state || '',
          district: p.district || '',
          city: p.city || '',
          occupation: p.occupation || '',
          education_level: p.education_level || p.education || '',
          annual_income: (p.annual_income !== null && p.annual_income !== undefined && p.annual_income !== '') 
            ? String(p.annual_income) 
            : (p.income !== null && p.income !== undefined && p.income !== '' ? String(p.income) : ''),
          social_category: p.social_category || '',
          disability_status: p.disability_status || 'NO',
          residence_type: p.residence_type || p.area || '',
          preferred_categories: (Array.isArray(p.preferred_categories))
            ? p.preferred_categories
            : []
        }));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryToggle = (catId) => {
    setFormData(prev => {
      const current = prev.preferred_categories || [];
      const exists = current.includes(catId);
      const updated = exists 
        ? current.filter(id => id !== catId)
        : [...current, catId];
      return { ...prev, preferred_categories: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isMaintenanceMode) {
      showMaintenanceAlert('Profile updates');
      return;
    }
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        state: formData.state || null,
        district: formData.district?.trim() || null,
        city: formData.city?.trim() || formData.district?.trim() || null,
        occupation: formData.occupation || null,
        education_level: formData.education_level || null,
        education: formData.education_level || null,
        annual_income: (formData.annual_income && formData.annual_income !== '') ? Number(formData.annual_income) : null,
        income: (formData.annual_income && formData.annual_income !== '') ? Number(formData.annual_income) : null,
        social_category: formData.social_category || null,
        disability_status: formData.disability_status || 'NO',
        residence_type: formData.residence_type || null,
        area: formData.residence_type || null,
        preferred_categories: Array.isArray(formData.preferred_categories) ? formData.preferred_categories : []
      };

      const res = await apiClient.users.updateProfile(payload);
      if (res.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully! Your scheme recommendations have been updated.' });
        setIsEditing(false);
        fetchProfile();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to update profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error updating profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image file size should be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarPreview(compressed);
        setAvatarError(null);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (isMaintenanceMode) {
      showMaintenanceAlert('Profile picture update');
      return;
    }
    setSavingAvatar(true);
    setAvatarError(null);
    try {
      const res = await apiClient.users.updateProfile({ profile_picture: avatarPreview });
      if (res.success) {
        setProfilePicture(avatarPreview);
        try {
          const cached = JSON.parse(sessionStorage.getItem('schemesathi_user_profile') || '{}');
          if (!cached.profile) cached.profile = {};
          cached.profile.profile_picture = avatarPreview;
          cached.profile_picture = avatarPreview;
          sessionStorage.setItem('schemesathi_user_profile', JSON.stringify(cached));

          const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
          savedUser.profile_picture = avatarPreview;
          if (!savedUser.profile) savedUser.profile = {};
          savedUser.profile.profile_picture = avatarPreview;
          localStorage.setItem('user', JSON.stringify(savedUser));
          window.dispatchEvent(new Event('storage'));
        } catch (e) {}

        setShowAvatarModal(false);
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
      } else {
        setAvatarError(res.message || 'Failed to update profile picture.');
      }
    } catch (err) {
      setAvatarError(err.message || 'Error updating profile picture.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (passwordMessage) setPasswordMessage(null);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isMaintenanceMode) {
      showMaintenanceAlert('Password changes');
      return;
    }

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    if (passwordForm.current_password === passwordForm.new_password) {
      setPasswordMessage({ type: 'error', text: 'New password must be different from current password.' });
      return;
    }

    setChangingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await apiClient.users.changePassword(passwordForm);
      if (res.success) {
        setPasswordMessage({ type: 'success', text: 'Password has been updated successfully!' });
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setPasswordMessage({ type: 'error', text: res.message || 'Failed to update password.' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Error updating password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccountConfirm = async (e) => {
    e.preventDefault();
    if (isMaintenanceMode) {
      showMaintenanceAlert('Account deletion');
      return;
    }

    if (!deletePassword) {
      setDeleteError('Please enter your current password to confirm deletion.');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError('');

    try {
      const res = await apiClient.users.deleteAccount({ password: deletePassword });
      if (res.success) {
        await logout();
        navigate('/', { replace: true });
      } else {
        setDeleteError(res.message || 'Failed to delete account. Please verify your password.');
      }
    } catch (err) {
      setDeleteError(err.message || 'An error occurred while deleting your account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const firstName = formData.first_name || user?.first_name || profile?.first_name || '';
  const lastName = formData.last_name || user?.last_name || profile?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || (user?.email ? user.email.split('@')[0] : 'Citizen Profile');
  const avatarLetter = (firstName || user?.email || 'U').charAt(0).toUpperCase();

  const completionPct = (profile?.profile?.profile_completion_percentage !== undefined && profile?.profile?.profile_completion_percentage !== null)
    ? profile.profile.profile_completion_percentage
    : 0;

  return (
    <DashboardLayout activePage="profile">
      <div className="profile-page-wrapper">
        {/* Profile Hero Banner with 3D Glowing Particle Nebula */}
        <div className="profile-banner">
          <ProfileHeroParticles />
          
          <div className="profile-identity">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-aura"></div>
              <div className="profile-avatar-large">
                {profilePicture ? (
                  <img src={profilePicture} alt={fullName} className="profile-avatar-img" />
                ) : (
                  avatarLetter
                )}
              </div>
              <button
                type="button"
                className="avatar-change-btn"
                onClick={() => {
                  setAvatarPreview(profilePicture);
                  setAvatarError(null);
                  setShowAvatarModal(true);
                }}
                title="Change Profile Picture"
                aria-label="Change Profile Picture"
              >
                <i className="fa fa-camera"></i>
              </button>
            </div>

            <div className="profile-info-header">
              <h2>{fullName}</h2>
            </div>
          </div>

          <div className="profile-header-actions">
            <div className="hero-quick-stat">
              <span className="quick-stat-val">{completionPct}%</span>
              <span className="quick-stat-lbl">{t('profileScore', 'Profile Strength')}</span>
            </div>

            {!isEditing ? (
              <button 
                type="button" 
                className={`edit-profile-btn ${isMaintenanceMode ? 'disabled-maintenance' : ''}`}
                onClick={() => {
                  if (isMaintenanceMode) {
                    showMaintenanceAlert('Profile editing');
                  } else {
                    setIsEditing(true);
                  }
                }}
                style={{
                  opacity: isMaintenanceMode ? 0.6 : 1,
                  cursor: isMaintenanceMode ? 'not-allowed' : 'pointer'
                }}
                title={isMaintenanceMode ? 'Profile editing is disabled during platform maintenance' : t('editProfile', 'Edit Profile')}
              >
                <i className="fa fa-pen"></i> {t('editProfile', 'Edit Profile')}
              </button>
            ) : (
              <button 
                type="button" 
                className="edit-profile-btn btn-cancel-edit"
                onClick={() => setIsEditing(false)}
              >
                <i className="fa fa-times"></i> {t('cancel', 'Cancel Edit')}
              </button>
            )}
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div style={{
            padding: '12px 18px',
            borderRadius: '12px',
            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            animation: 'fadeInModal 0.25s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className={`fa fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              style={{
                background: 'none',
                border: 'none',
                color: message.type === 'success' ? '#15803d' : '#b91c1c',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '13px',
                opacity: 0.75
              }}
              title="Dismiss"
            >
              <i className="fa fa-times"></i>
            </button>
          </div>
        )}

        {/* Profile Completion Card */}
        <div className="completion-card">
          <div className="completion-header">
            <h4>{t('profileTitle', 'Profile Completeness for Scheme Eligibility')}</h4>
            <span className="completion-percentage">{completionPct}% {t('verified', 'Complete')}</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${completionPct}%` }}></div>
          </div>
          <p className="completion-tip">
            <i className="fa fa-lightbulb" style={{ color: '#eab308', marginRight: '6px' }}></i>
            <strong>{t('recommendation', 'Recommendation')}:</strong> {t('completeProfilePrompt', 'Complete your profile to unlock 100% accurate personalized scheme recommendations.')}
          </p>
        </div>

        {/* Profile Form / Display */}
        <form onSubmit={handleSave}>
          <div className="profile-details-grid">
            {/* Section 1: Personal Details */}
            <div className="profile-section-card">
              <div className="section-card-title">
                <i className="fa fa-user"></i>
                <span>{t('personalInfo', 'Personal Information')}</span>
              </div>
              <div className="fields-stack">
                <div className="fields-row">
                  <div className="field-item">
                    <label>{t('fullName', 'First Name')}</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="first_name"
                        className="field-input"
                        value={formData.first_name} 
                        onChange={handleInputChange} 
                        required
                      />
                    ) : (
                      <div className="field-display-value">{formData.first_name || user?.first_name || '—'}</div>
                    )}
                  </div>
                  <div className="field-item">
                    <label>{t('fullName', 'Last Name')}</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="last_name"
                        className="field-input"
                        value={formData.last_name} 
                        onChange={handleInputChange} 
                      />
                    ) : (
                      <div className="field-display-value">{formData.last_name || user?.last_name || '—'}</div>
                    )}
                  </div>
                </div>

                <div className="fields-row">
                  <div className="field-item">
                    <label>{t('dob', 'Date of Birth')}</label>
                    {isEditing ? (
                      <input 
                        type="date" 
                        name="date_of_birth"
                        className="field-input"
                        value={formData.date_of_birth} 
                        onChange={handleInputChange} 
                      />
                    ) : (
                      <div className="field-display-value">{formData.date_of_birth || 'Not Specified'}</div>
                    )}
                  </div>
                  <div className="field-item">
                    <label>{t('gender', 'Gender')}</label>
                    {isEditing ? (
                      <select 
                        name="gender" 
                        className="field-select"
                        value={formData.gender} 
                        onChange={handleInputChange} 
                      >
                        <option value="">-- {t('selectGender', 'Select Gender')} --</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      </select>
                    ) : (
                      <div className="field-display-value">
                        {formData.gender ? (formData.gender === 'MALE' ? 'Male' : formData.gender === 'FEMALE' ? 'Female' : formData.gender === 'OTHER' ? 'Other' : 'Prefer not to say') : 'Not Specified'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="field-item">
                  <label>{t('phone', 'Mobile Number')}</label>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      name="phone"
                      className="field-input"
                      value={formData.phone} 
                      onChange={handleInputChange} 
                    />
                  ) : (
                    <div className="field-display-value">{formData.phone || user?.phone || '—'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Residential Location */}
            <div className="profile-section-card">
              <div className="section-card-title">
                <i className="fa fa-map-marker-alt"></i>
                <span>{t('addressDomicile', 'Location & Residence')}</span>
              </div>
              <div className="fields-stack">
                <div className="field-item">
                  <label>{t('state', 'State / Union Territory')}</label>
                  {isEditing ? (
                    <select 
                      name="state" 
                      className="field-select"
                      value={formData.state} 
                      onChange={handleInputChange}
                    >
                      <option value="">-- {t('selectState', 'Select State / UT')} --</option>
                      {INDIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="field-display-value">{formData.state || 'Not Specified'}</div>
                  )}
                </div>

                <div className="fields-row">
                  <div className="field-item">
                    <label>{t('district', 'District')}</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="district"
                        className="field-input"
                        placeholder="e.g. Pune, Patna..."
                        value={formData.district} 
                        onChange={handleInputChange} 
                      />
                    ) : (
                      <div className="field-display-value">{formData.district || 'Not Specified'}</div>
                    )}
                  </div>
                  <div className="field-item">
                    <label>{t('city', 'City / Taluka')}</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="city"
                        className="field-input"
                        placeholder="e.g. Haveli, Baramati..."
                        value={formData.city} 
                        onChange={handleInputChange} 
                      />
                    ) : (
                      <div className="field-display-value">{formData.city || 'Not Specified'}</div>
                    )}
                  </div>
                </div>

                <div className="field-item">
                  <label>{t('residenceArea', 'Residence Type / Area')}</label>
                  {isEditing ? (
                    <select
                      name="residence_type"
                      className="field-select"
                      value={formData.residence_type}
                      onChange={handleInputChange}
                    >
                      <option value="">-- {t('selectResidence', 'Select Residence Type')} --</option>
                      <option value="RURAL">🌾 {t('residenceRural', 'Rural (Gram Panchayat)')}</option>
                      <option value="URBAN">🏙️ {t('residenceUrban', 'Urban (Municipality/City)')}</option>
                    </select>
                  ) : (
                    <div className="field-display-value">
                      {formData.residence_type === 'URBAN' ? '🏙️ Urban (Municipality/City)' : formData.residence_type === 'RURAL' ? '🌾 Rural (Gram Panchayat Jurisdiction)' : 'Not Specified'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Socio-Economic Profile */}
            <div className="profile-section-card full-width-card">
              <div className="section-card-title">
                <i className="fa fa-id-card"></i>
                <span>{t('financialCategory', 'Socio-Economic & Eligibility Criteria')}</span>
              </div>
              <div className="fields-stack">
                <div className="fields-row">
                  <div className="field-item">
                    <label>{t('occupation', 'Primary Occupation')}</label>
                    {isEditing ? (
                      <select 
                        name="occupation" 
                        className="field-select"
                        value={formData.occupation} 
                        onChange={handleInputChange}
                      >
                        <option value="">-- {t('selectOccupation', 'Select Occupation')} --</option>
                        <option value="Farmer">Farmer / Agriculture</option>
                        <option value="Student">Student / Scholar</option>
                        <option value="Self-Employed">Self Employed / Artisan</option>
                        <option value="Daily Wage Laborer">Daily Wage Laborer / Construction</option>
                        <option value="Salaried">Salaried (Private / Govt)</option>
                        <option value="Homemaker">Homemaker</option>
                        <option value="Unemployed">Unemployed Youth</option>
                      </select>
                    ) : (
                      <div className="field-display-value">{formData.occupation || 'Not Specified'}</div>
                    )}
                  </div>

                  <div className="field-item">
                    <label>{t('socialCategory', 'Social Category / Caste')}</label>
                    {isEditing ? (
                      <select 
                        name="social_category" 
                        className="field-select"
                        value={formData.social_category} 
                        onChange={handleInputChange}
                      >
                        <option value="">-- {t('selectSocialCategory', 'Select Social Category')} --</option>
                        <option value="GENERAL">General / Open</option>
                        <option value="OBC">OBC (Other Backward Class)</option>
                        <option value="SC">SC (Scheduled Caste)</option>
                        <option value="ST">ST (Scheduled Tribe)</option>
                        <option value="EWS">EWS (Economically Weaker Section)</option>
                        <option value="MINORITY">Minority Community</option>
                      </select>
                    ) : (
                      <div className="field-display-value">{formData.social_category || 'Not Specified'}</div>
                    )}
                  </div>
                </div>

                <div className="fields-row">
                  <div className="field-item">
                    <label>{t('annualIncome', 'Annual Family Income (₹)')}</label>
                    {isEditing ? (
                      <input 
                        type="number" 
                        name="annual_income"
                        className="field-input"
                        placeholder="e.g. 150000"
                        value={formData.annual_income} 
                        onChange={handleInputChange} 
                      />
                    ) : (
                      <div className="field-display-value">
                        {formData.annual_income ? `₹${Number(formData.annual_income).toLocaleString('en-IN')}` : 'Not Specified'}
                      </div>
                    )}
                  </div>

                  <div className="field-item">
                    <label>{t('education', 'Education Level')}</label>
                    {isEditing ? (
                      <select 
                        name="education_level" 
                        className="field-select"
                        value={formData.education_level} 
                        onChange={handleInputChange}
                      >
                        <option value="">-- {t('selectEducation', 'Select Education Level')} --</option>
                        <option value="PRIMARY">Primary School (Up to 8th)</option>
                        <option value="SECONDARY">Secondary (10th Pass)</option>
                        <option value="HIGHER_SECONDARY">Higher Secondary (12th Pass)</option>
                        <option value="DIPLOMA">Diploma / ITI</option>
                        <option value="BACHELOR">Bachelor Degree / Graduate</option>
                        <option value="POST_GRADUATE">Post Graduate / Master</option>
                      </select>
                    ) : (
                      <div className="field-display-value">{formData.education_level || 'Not Specified'}</div>
                    )}
                  </div>
                </div>

                <div className="fields-row">
                  <div className="field-item">
                    <label>{t('disability', 'Person with Disability (PwD)')}</label>
                    {isEditing ? (
                      <select 
                        name="disability_status" 
                        className="field-select"
                        value={formData.disability_status} 
                        onChange={handleInputChange} 
                      >
                        <option value="NO">No Disability</option>
                        <option value="YES">Yes (&gt; 40% Disability Certificate)</option>
                      </select>
                    ) : (
                      <div className="field-display-value">{formData.disability_status === 'YES' ? 'Yes (>40%)' : 'No Disability'}</div>
                    )}
                  </div>
                </div>

                {/* Preferred Categories Field */}
                <div className="field-item" style={{ marginTop: '14px' }}>
                  <label>{t('preferredCategoriesTitle', 'Preferred Scheme Categories')}</label>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {[
                        'Agriculture & Farmers', 'Education & Scholarships', 'Healthcare', 
                        'Business & Entrepreneurship', 'Housing', 'Women & Child Welfare', 
                        'Social Welfare & Financial Assistance', 'Employment & Skills'
                      ].map(cat => {
                        const isSelected = (formData.preferred_categories || []).includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoryToggle(cat)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: isSelected ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                              background: isSelected ? '#dcfce7' : '#ffffff',
                              color: isSelected ? '#166534' : '#475569',
                              fontSize: '12.5px',
                              fontWeight: isSelected ? 600 : 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>{cat}</span>
                            {isSelected && <i className="fa fa-check" style={{ fontSize: '11px' }}></i>}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {(formData.preferred_categories || []).length > 0 ? (
                        formData.preferred_categories.map(cat => (
                          <span 
                            key={cat} 
                            style={{ 
                              padding: '4px 12px', 
                              borderRadius: '16px', 
                              background: '#ecfdf5', 
                              color: '#065f46', 
                              fontSize: '12px', 
                              fontWeight: 600, 
                              border: '1px solid #a7f3d0' 
                            }}
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <div className="field-display-value">All Categories</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Bar when editing */}
          {isEditing && (
            <div className="form-action-bar" style={{ marginTop: '20px' }}>
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                {t('cancel', 'Cancel')}
              </button>
              <button 
                type="submit" 
                className="save-changes-btn"
                disabled={saving || isMaintenanceMode}
                title={isMaintenanceMode ? 'Disabled during platform maintenance' : ''}
              >
                {saving ? (
                  <>
                    <i className="fa fa-spinner fa-spin"></i> {t('loading', 'Saving Profile...')}
                  </>
                ) : isMaintenanceMode ? (
                  <>
                    <i className="fa fa-lock"></i> {t('maintenanceLocked', 'Editing Disabled in Maintenance Mode')}
                  </>
                ) : (
                  <>
                    <i className="fa fa-save"></i> {t('saveChanges', 'Save Profile Changes')}
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* 2. Security & Password Section */}
        <div className="profile-security-card">
          <div className="security-card-header">
            <div className="security-header-title">
              <i className="fa fa-shield-halved"></i>
              <div>
                <h3>{t('securityTitle', 'Account Security & Password')}</h3>
                <p className="security-card-tagline">
                  Keep your citizen profile safe by choosing a strong, unique password.
                </p>
              </div>
            </div>
          </div>

          {passwordMessage && (
            <div style={{
              padding: '12px 18px',
              borderRadius: '12px',
              background: passwordMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: passwordMessage.type === 'success' ? '#15803d' : '#b91c1c',
              border: `1px solid ${passwordMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '18px',
              animation: 'fadeInModal 0.25s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={`fa fa-${passwordMessage.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                <span>{passwordMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setPasswordMessage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: passwordMessage.type === 'success' ? '#15803d' : '#b91c1c',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  opacity: 0.75
                }}
                title="Dismiss"
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="password-change-form">
            <div className="password-fields-row">
              <div className="field-item">
                <label>Current Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    name="current_password"
                    className="field-input"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    tabIndex="-1"
                  >
                    <i className={`fa fa-${showCurrentPw ? 'eye-slash' : 'eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="field-item">
                <label>New Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    name="new_password"
                    className="field-input"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    placeholder="Min. 8 characters"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPw(!showNewPw)}
                    tabIndex="-1"
                  >
                    <i className={`fa fa-${showNewPw ? 'eye-slash' : 'eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="field-item">
                <label>Confirm New Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    name="confirm_password"
                    className="field-input"
                    value={passwordForm.confirm_password}
                    onChange={handlePasswordChange}
                    placeholder="Re-enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    tabIndex="-1"
                  >
                    <i className={`fa fa-${showConfirmPw ? 'eye-slash' : 'eye'}`}></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="password-submit-bar">
              <button
                type="submit"
                className="btn-update-password"
                disabled={changingPassword || isMaintenanceMode}
              >
                {changingPassword ? (
                  <><i className="fa fa-spinner fa-spin"></i> Updating Password...</>
                ) : (
                  <><i className="fa fa-key"></i> Update Password</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 3. Danger Zone: Delete Account */}
        <div className="profile-danger-card">
          <div className="danger-badge">
            <i className="fa fa-triangle-exclamation"></i> Danger Zone
          </div>

          <div className="danger-card-header">
            <h4>Delete Citizen Account</h4>
            <p>
              Permanently delete your SchemeSathi account, saved schemes, active notifications, and all profile data. Once deleted, this action cannot be reversed.
            </p>
          </div>

          <button
            type="button"
            className="btn-delete-account-trigger"
            onClick={() => {
              setDeletePassword('');
              setDeleteError('');
              setShowDeleteModal(true);
            }}
          >
            <i className="fa fa-trash-can"></i> Delete My Account
          </button>
        </div>

        {/* Avatar Selection Modal */}
        {showAvatarModal && (
          <div className="profile-modal-overlay" onClick={() => !savingAvatar && setShowAvatarModal(false)}>
            <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-header">
                <h3>Choose Profile Picture</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowAvatarModal(false)}
                  disabled={savingAvatar}
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <div className="profile-modal-body">
                {avatarError && (
                  <div className="avatar-modal-alert">
                    <i className="fa fa-exclamation-circle"></i> {avatarError}
                  </div>
                )}

                {/* Avatar Preview */}
                <div className="avatar-preview-container">
                  <div className="avatar-preview-circle">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="avatar-preview-img" />
                    ) : (
                      <span className="avatar-preview-letter">{avatarLetter}</span>
                    )}
                  </div>
                  <div className="avatar-preview-actions">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarFileUpload}
                    />
                    <button
                      type="button"
                      className="btn-upload-file"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fa fa-upload"></i> Upload Custom Photo
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        className="btn-remove-avatar"
                        onClick={() => setAvatarPreview(null)}
                      >
                        <i className="fa fa-trash-can"></i> Remove Picture
                      </button>
                    )}
                  </div>
                </div>

                <div className="avatar-preset-heading">Or choose a preset avatar:</div>
                <div className="avatar-presets-grid">
                  {PRESET_AVATARS.map((preset) => {
                    const presetData = createPresetDataUrl(preset.icon, preset.bg);
                    const isSelected = avatarPreview === presetData;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`preset-avatar-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setAvatarPreview(presetData);
                          setAvatarError(null);
                        }}
                        title={preset.label}
                      >
                        <span className="preset-emoji">{preset.icon}</span>
                        <span className="preset-label">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="profile-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowAvatarModal(false)}
                  disabled={savingAvatar}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal-save"
                  onClick={handleSaveAvatar}
                  disabled={savingAvatar}
                >
                  {savingAvatar ? (
                    <><i className="fa fa-spinner fa-spin"></i> Saving...</>
                  ) : (
                    <><i className="fa fa-check"></i> Save Avatar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="profile-modal-overlay" onClick={() => !isDeletingAccount && setShowDeleteModal(false)}>
            <div className="profile-modal-card danger-modal" onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-header danger">
                <div className="danger-header-icon">
                  <i className="fa fa-triangle-exclamation"></i>
                </div>
                <h3>Permanently Delete Account?</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeletingAccount}
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleDeleteAccountConfirm}>
                <div className="profile-modal-body">
                  <p className="danger-modal-text">
                    This action is <strong>final and irreversible</strong>. All your citizen profile details, scheme eligibility history, application statuses, and saved schemes will be permanently deleted from SchemeSathi.
                  </p>

                  {deleteError && (
                    <div className="avatar-modal-alert">
                      <i className="fa fa-circle-exclamation"></i> {deleteError}
                    </div>
                  )}

                  <div className="field-item" style={{ marginTop: '16px' }}>
                    <label>Enter your password to confirm:</label>
                    <div className="password-input-wrap">
                      <input
                        type={showDeletePassword ? 'text' : 'password'}
                        className="field-input"
                        placeholder="Your current password"
                        value={deletePassword}
                        onChange={(e) => {
                          setDeletePassword(e.target.value);
                          if (deleteError) setDeleteError('');
                        }}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        tabIndex="-1"
                      >
                        <i className={`fa fa-${showDeletePassword ? 'eye-slash' : 'eye'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="profile-modal-footer">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeletingAccount}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-confirm-delete"
                    disabled={isDeletingAccount || !deletePassword}
                  >
                    {isDeletingAccount ? (
                      <><i className="fa fa-spinner fa-spin"></i> Deleting Account...</>
                    ) : (
                      <><i className="fa fa-trash-can"></i> Yes, Delete Permanently</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
