import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Video, Mic, Shield, Users, Zap, Phone, Sparkles } from 'lucide-react';

function Home() {
  return (
    <div className="home-page">
      {/* Floating orbs */}
      <div className="home-orb home-orb-1"></div>
      <div className="home-orb home-orb-2"></div>
      <div className="home-orb home-orb-3"></div>

      {/* Nav */}
      <nav className="home-nav">
        <div className="home-logo">
          <div className="home-logo-icon">
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>भोः</span>
          </div>
          <span className="home-logo-text">Bhoh</span>
        </div>
        <div className="home-nav-actions">
          <Link to="/login" className="btn btn-ghost" style={{ color: 'var(--text-secondary)', minWidth: 'auto' }}>Sign In</Link>
          <Link to="/register" className="btn btn-primary" style={{ minWidth: 'auto', padding: '10px 24px' }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-badge">
          <Sparkles size={14} /> Chat. Call. Vibe. Repeat.
        </div>
        <h1 className="home-hero-title">
          Say <span className="home-gradient-text">Bhoh.</span><br />
          Say Hello to Everyone.
        </h1>
        <p className="home-hero-subtitle">
          One word. Every language. Your people, your vibe, your call. 🚀
        </p>
        <div className="home-hero-actions">
          <Link to="/register" className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '1rem' }}>
            Start Chatting Free
          </Link>
          <Link to="/login" className="btn" style={{ 
            padding: '14px 36px', fontSize: '1rem',
            background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)',
            border: '1px solid var(--border-glass)'
          }}>
            I Have an Account
          </Link>
        </div>

        {/* Mock UI preview */}
        <div className="home-preview">
          <div className="home-preview-window">
            <div className="home-preview-sidebar">
              <div className="home-preview-chat-item active">
                <div className="home-preview-avatar" style={{background: 'linear-gradient(135deg, #7C3AED, #06B6D4)'}}>A</div>
                <div>
                  <div style={{fontWeight:600, fontSize:'0.8rem'}}>Arun</div>
                  <div style={{fontSize:'0.65rem', color:'var(--text-muted)'}}>Hey! Are you free? 🎉</div>
                </div>
                <div className="home-preview-online"></div>
              </div>
              <div className="home-preview-chat-item">
                <div className="home-preview-avatar" style={{background: 'linear-gradient(135deg, #F59E0B, #EF4444)'}}>S</div>
                <div>
                  <div style={{fontWeight:600, fontSize:'0.8rem'}}>Squad 🔥</div>
                  <div style={{fontSize:'0.65rem', color:'var(--text-muted)'}}>5 members</div>
                </div>
              </div>
              <div className="home-preview-chat-item">
                <div className="home-preview-avatar" style={{background: 'linear-gradient(135deg, #10B981, #06B6D4)'}}>R</div>
                <div>
                  <div style={{fontWeight:600, fontSize:'0.8rem'}}>Rahul</div>
                  <div style={{fontSize:'0.65rem', color:'var(--text-muted)'}}>🎵 Voice Message</div>
                </div>
              </div>
            </div>
            <div className="home-preview-chat">
              <div className="home-preview-msg received">Hey! What's up? 👋</div>
              <div className="home-preview-msg sent">Not much, just vibing ✨</div>
              <div className="home-preview-msg received">Let's hop on a call!</div>
              <div className="home-preview-msg sent">Sure! Starting video call... 📹</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="home-features">
        <h2 className="home-section-title">Everything You Need to Stay Connected</h2>
        <p className="home-section-sub">Built with cutting-edge tech. Designed to feel like magic.</p>
        
        <div className="home-features-grid">
          <div className="home-feature-card">
            <div className="home-feature-icon" style={{background: 'linear-gradient(135deg, #7C3AED, #A855F7)'}}>
              <MessageCircle size={24} color="white" />
            </div>
            <h3>Real-Time Messaging</h3>
            <p>Instant delivery. Typing indicators. Read receipts. Messages that feel alive.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon" style={{background: 'linear-gradient(135deg, #06B6D4, #22C55E)'}}>
              <Video size={24} color="white" />
            </div>
            <h3>HD Video Calls</h3>
            <p>Face-to-face conversations with crystal clear video. One-on-one or group calls.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon" style={{background: 'linear-gradient(135deg, #F59E0B, #EF4444)'}}>
              <Mic size={24} color="white" />
            </div>
            <h3>Voice Messages</h3>
            <p>Record and send ephemeral voice clips that auto-delete after listening.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon" style={{background: 'linear-gradient(135deg, #EC4899, #8B5CF6)'}}>
              <Users size={24} color="white" />
            </div>
            <h3>Group Chats & Calls</h3>
            <p>Create groups, add members, and host group audio or video calls instantly.</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon" style={{background: 'linear-gradient(135deg, #10B981, #059669)'}}>
              <Sparkles size={24} color="white" />
            </div>
            <h3>Custom Avatars</h3>
            <p>Design your unique avatar from 12 styles with full color customization. Stand out!</p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon" style={{background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)'}}>
              <Shield size={24} color="white" />
            </div>
            <h3>Secure & Private</h3>
            <p>HTTP-only cookies, encrypted passwords, and auto-deleting messages. Your data, your control.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="home-stats">
        <div className="home-stat">
          <div className="home-stat-number">12+</div>
          <div className="home-stat-label">Avatar Styles</div>
        </div>
        <div className="home-stat">
          <div className="home-stat-number">HD</div>
          <div className="home-stat-label">Video Quality</div>
        </div>
        <div className="home-stat">
          <div className="home-stat-number">∞</div>
          <div className="home-stat-label">Group Members</div>
        </div>
        <div className="home-stat">
          <div className="home-stat-number">0ms</div>
          <div className="home-stat-label">Real-Time Lag</div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <h2>Ready to say <span className="home-gradient-text">Bhoh</span>?</h2>
        <p>The world's oldest greeting, reimagined for the modern age. Join free!</p>
        <Link to="/register" className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '1.0625rem' }}>
          Create Your Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-logo" style={{ justifyContent: 'center' }}>
          <div className="home-logo-icon" style={{ width: '32px', height: '32px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'white', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>भोः</span>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Bhoh</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '8px' }}>
          © {new Date().getFullYear()} Bhoh (भोः). Built with ❤️
        </p>
      </footer>
    </div>
  );
}

export default Home;
