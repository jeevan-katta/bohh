import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import api from '../store/authStore';
import { X, Users } from 'lucide-react';

function GroupChatModal({ onClose }) {
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    await createGroupChat(groupName, selectedUsers);
    setLoading(false);
    onClose();
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
              <Users size={18} color="var(--primary)" />
            </div>
            <h2>New Group</h2>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <input 
            className="input-field" 
            placeholder="Group name" 
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          
          <input 
            className="input-field" 
            placeholder="Search people to add..." 
            value={search}
            onChange={handleSearch}
          />
          
          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="tag-list">
              {selectedUsers.map(u => (
                <div key={u._id} className="tag">
                  {u.username}
                  <span className="tag-remove" onClick={() => handleDelete(u)}>
                    <X size={12} />
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {searchResults.slice(0, 5).map(u => (
                <div 
                  key={u._id} 
                  className="search-result-item"
                  onClick={() => handleGroup(u)}
                >
                  <img src={u.profilePic} alt="" />
                  <span>{u.username}</span>
                </div>
              ))}
            </div>
          )}

          <button 
            className="btn btn-primary" 
            onClick={handleSubmit} 
            disabled={!groupName || selectedUsers.length < 1 || loading} 
            style={{ width: '100%' }}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupChatModal;
