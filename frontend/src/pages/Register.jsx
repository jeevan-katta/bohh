import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const register = useAuthStore((state) => state.register);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) return setError("Please fill all fields");
    
    const res = await register(username, email, password);
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="auth-container fade-in">
      <div className="card" style={{ width: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '24px', color: 'var(--primary-color)' }}>Create Account</h2>
        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            className="input-field"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="input-field"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn">Sign Up</button>
        </form>
        <div style={{ marginTop: '20px', color: 'var(--text-light)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Log In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
