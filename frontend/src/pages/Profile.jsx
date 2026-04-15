import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AvatarEditor, { buildAvatarUrl } from '../components/AvatarEditor';

const DEFAULT_CONFIG = {
  seed: 'default',
  top: 'shortFlat',
  eyes: 'default',
  eyebrows: 'default',
  mouth: 'smile',
  clothing: 'hoodie',
  facialHair: '',
  accessories: '',
  skinColor: 'edb98a',
  hairColor: '4a2912',
  clothesColor: '3f51b5',
};

function Profile() {
  const user = useAuthStore(state => state.user);
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarConfig, setAvatarConfig] = useState(
    user?.avatarConfig && user.avatarConfig.top 
      ? user.avatarConfig 
      : { ...DEFAULT_CONFIG, seed: user?.username || 'default' }
  );
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const deleteAccount = useAuthStore(state => state.deleteAccount);
  const navigate = useNavigate();

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profilePic = buildAvatarUrl(avatarConfig);
      const res = await api.put('/users/profile', { 
        bio, 
        avatarConfig, 
        profilePic 
      });
      const updatedUser = { 
        ...user, 
        bio: res.data.bio, 
        avatarConfig: res.data.avatarConfig, 
        profilePic: res.data.profilePic 
      };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      useAuthStore.setState({ user: updatedUser });
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true);
      const res = await deleteAccount();
      if (res.success) {
        navigate('/login');
      } else {
        alert(res.message);
        setLoading(false);
      }
    }
  };

  return (
    <div className="profile-page fade-in">
      <div className="profile-card card" style={{ position: 'relative', maxWidth: '520px' }}>
        <button 
          className="btn-ghost"
          onClick={() => navigate('/chat')} 
          style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1 }}
        >
          <ArrowLeft size={22} />
        </button>
        
        <div className="profile-header">
          <h1>Edit Your Avatar</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Customize your look just the way you like
          </p>
        </div>

        {success && <div className="success-message" style={{ marginBottom: '16px' }}>{success}</div>}

        {/* Avatar Editor */}
        <AvatarEditor config={avatarConfig} onChange={setAvatarConfig} />

        <form className="profile-form" onSubmit={handleSave} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Username</label>
            <input
              className="input-field"
              type="text"
              value={user?.username || ''}
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              className="input-field"
              rows="3"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '4px' }} disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Danger Zone</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Permanently delete your account and all data.</p>
          <button 
            type="button" 
            className="btn btn-danger" 
            style={{ width: '100%' }} 
            onClick={handleDeleteAccount} 
            disabled={loading}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
