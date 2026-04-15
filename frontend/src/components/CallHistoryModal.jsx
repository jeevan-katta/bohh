import React, { useEffect } from 'react';
import { useCallStore } from '../store/callStore';
import { useAuthStore } from '../store/authStore';
import { X, PhoneMissed, Phone, PhoneCall, Video } from 'lucide-react';

function CallHistoryModal({ onClose }) {
  const { calls, fetchCallHistory } = useCallStore();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content card fade-in-scale">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Phone size={18} color="var(--primary)" />
            </div>
            <h2>Call History</h2>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="call-history-list">
          {calls.length === 0 ? (
            <div className="no-results" style={{ padding: '40px 0' }}>
              <Phone size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              No recent calls
            </div>
          ) : (
            calls.map(c => {
              const isCaller = c.caller._id === user._id;
              const otherUser = isCaller ? c.receiver : c.caller;
              const isMissed = c.status === 'missed' || c.status === 'rejected';
              
              return (
                <div key={c._id} className="call-history-item">
                  <img src={otherUser.profilePic} alt="" />
                  <div className="call-info">
                    <div className={`call-name${isMissed ? ' missed' : ''}`}>
                      {otherUser.username}
                    </div>
                    <div className="call-detail">
                      {isMissed 
                        ? <PhoneMissed size={12} color="var(--danger)" /> 
                        : (isCaller ? <Phone size={12} /> : <PhoneCall size={12} />)
                      }
                      {c.type === 'video' ? 'Video' : 'Audio'} Call
                      <span style={{ opacity: 0.6 }}>•</span>
                      <span style={{ fontStyle: 'italic', textTransform: 'capitalize' }}>{c.status}</span>
                    </div>
                  </div>
                  <span className="call-date">{formatDate(c.createdAt)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default CallHistoryModal;
