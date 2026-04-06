import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function Profile() {
  const user = useAuthStore(state => state.user);
  const login = useAuthStore(state => state.login); // We just need to update user in store, we'll manually set it or fetch profile
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarSeed, setAvatarSeed] = useState(user?.avatarConfig?.seed || user?.username || "default");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', { bio, avatarConfig: { seed: avatarSeed } });
      // Update local storage and store
      const updatedUser = { ...user, bio: res.data.bio, avatarConfig: res.data.avatarConfig, profilePic: res.data.profilePic };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      useAuthStore.setState({ user: updatedUser });
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="auth-container fade-in">
      <div className="card" style={{ width: '500px', position: 'relative' }}>
        <button 
          onClick={() => navigate('/chat')} 
          style={{ position: 'absolute', top: '24px', left: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
        >
          <ArrowLeft size={24} />
        </button>
        
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--primary-color)' }}>Edit Profile</h2>
        
        {success && <div style={{ color: 'var(--primary-color)', textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>{success}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <img 
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`} 
            alt="avatar" 
            style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--primary-light)' }}
          />
          
          <form style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSave}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-light)', fontSize: '0.9rem' }}>Avatar Seed (Type to change avatar)</label>
              <input
                className="input-field"
                type="text"
                value={avatarSeed}
                onChange={(e) => setAvatarSeed(e.target.value)}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-light)', fontSize: '0.9rem' }}>Bio</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <button type="submit" className="btn" style={{ marginTop: '10px' }}>Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
