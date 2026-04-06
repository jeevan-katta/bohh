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

  return (
    <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'var(--primary-dark)', margin: 0 }}>Call History</h2>
          <X size={24} style={{ cursor: 'pointer', color: 'var(--text-light)' }} onClick={onClose} />
        </div>
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {calls.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>No recent calls</p>
          ) : (
            calls.map(c => {
               const isCaller = c.caller._id === user._id;
               const otherUser = isCaller ? c.receiver : c.caller;
               return (
                 <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: '#f9f9f9' }}>
                    <img src={otherUser.profilePic} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: 'bold', color: c.status === 'missed' ? 'red' : 'inherit' }}>{otherUser.username}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {c.status === 'missed' || c.status === 'rejected' ? <PhoneMissed size={12} color="red"/> : (isCaller ? <Phone size={12} /> : <PhoneCall size={12} />)}
                          {c.type === 'video' ? 'Video' : 'Audio'} Call • <span style={{ fontStyle: 'italic' }}>{c.status}</span>
                       </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>
                       {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                 </div>
               )
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default CallHistoryModal;
