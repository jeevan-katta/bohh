import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import api from '../store/authStore';
import { X } from 'lucide-react';

function GroupChatModal({ onClose }) {
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const createGroupChat = useChatStore(state => state.createGroupChat);

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearch(term);
    if (!term) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get(`/users?search=${term}`);
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGroup = (userToAdd) => {
    if (selectedUsers.some(u => u._id === userToAdd._id)) return;
    setSelectedUsers([...selectedUsers, userToAdd]);
  };

  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };

  const handleSubmit = async () => {
    if (!groupName || selectedUsers.length === 0) return;
    await createGroupChat(groupName, selectedUsers);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="card fade-in" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'var(--primary-dark)', margin: 0 }}>Create Group Chat</h2>
          <X size={24} style={{ cursor: 'pointer', color: 'var(--text-light)' }} onClick={onClose} />
        </div>
        
        <input 
          className="input-field" 
          placeholder="Group Name" 
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        
        <input 
          className="input-field" 
          placeholder="Add Users (eg: John, Piyush)" 
          value={search}
          onChange={handleSearch}
        />
        
        {/* Selected Users */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {selectedUsers.map(u => (
             <div key={u._id} style={{ 
               backgroundColor: 'var(--primary-light)', padding: '4px 8px', 
               borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' 
             }}>
               {u.username}
               <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleDelete(u)} />
             </div>
          ))}
        </div>

        {/* Search Results */}
        <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {searchResults.slice(0, 4).map(u => (
            <div 
              key={u._id} 
              onClick={() => handleGroup(u)}
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '8px', backgroundColor: '#f9f9f9', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
            >
              <img src={u.profilePic} alt="" style={{ width:'24px', height:'24px', borderRadius:'50%' }} />
              <span>{u.username}</span>
            </div>
          ))}
        </div>

        <button className="btn" onClick={handleSubmit} disabled={!groupName || selectedUsers.length < 1} style={{ opacity: (!groupName || selectedUsers.length < 1) ? 0.5 : 1 }}>
          Create Chat
        </button>
      </div>
    </div>
  );
}

export default GroupChatModal;
