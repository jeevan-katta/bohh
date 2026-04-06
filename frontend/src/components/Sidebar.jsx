import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import api from '../store/authStore'; // For the generic axios instance
import { LogOut, Search, Settings, Plus, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GroupChatModal from './GroupChatModal';
import CallHistoryModal from './CallHistoryModal';

function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { chats, fetchChats, accessChat, selectedChat, setSelectedChat, onlineUsers } = useChatStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearch(term);
    if (!term) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const { data } = await api.get(`/users?search=${term}`);
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAccessChat = async (userId) => {
    await accessChat(userId);
    setSearch('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const getSenderName = (chat) => {
    if (chat.isGroupChat) return chat.chatName;
    return chat.users[0]._id === user._id ? chat.users[1]?.username : chat.users[0]?.username;
  };
  
  const isOnline = (chat) => {
    if (chat.isGroupChat) return false;
    const otherUser = chat.users.find(u => u._id !== user._id);
    return otherUser ? onlineUsers.includes(otherUser._id) : false;
  };
  
  const getSenderPic = (chat) => {
    if (chat.isGroupChat) return "https://api.dicebear.com/7.x/identicon/svg?seed=" + chat.chatName;
    return chat.users[0]._id === user._id ? chat.users[1]?.profilePic : chat.users[0]?.profilePic;
  };

  return (
    <div className="sidebar">
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={user?.profilePic} alt="profile" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
          <strong style={{ color: 'var(--primary-dark)' }}>{user?.username}</strong>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <History size={20} style={{ cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => setIsHistoryOpen(true)} />
          <Plus size={20} style={{ cursor: 'pointer', color: 'var(--primary-dark)' }} onClick={() => setIsGroupModalOpen(true)} />
          <Settings size={20} style={{ cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => navigate('/profile')} />
          <LogOut size={20} style={{ cursor: 'pointer', color: 'var(--danger-color)' }} onClick={logout} />
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-light)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search users..."
            style={{ paddingLeft: '40px' }}
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isSearching ? (
          <div>
            {searchResults.map(u => (
              <div 
                key={u._id} 
                onClick={() => handleAccessChat(u._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
              >
                <img src={u.profilePic} style={{ width: '36px', height: '36px', borderRadius: '50%' }} alt="avatar" />
                <span>{u.username}</span>
              </div>
            ))}
            {searchResults.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>No users found</div>}
          </div>
        ) : (
          <div>
            <div style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>Recent Chats</div>
            {chats.map(chat => (
              <div 
                key={chat._id} 
                onClick={() => setSelectedChat(chat)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', cursor: 'pointer', 
                  backgroundColor: selectedChat?._id === chat._id ? 'var(--primary-light)' : 'transparent',
                  transition: 'background 0.2s',
                  borderBottom: '1px solid #f9f9f9'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img src={getSenderPic(chat)} style={{ width: '45px', height: '45px', borderRadius: '50%' }} alt="avatar" />
                  {isOnline(chat) && (
                    <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', backgroundColor: '#4CAF50', border: '2px solid white', borderRadius: '50%' }}></div>
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{getSenderName(chat)}</div>
                    {chat.latestMessage && (
                        <div style={{ 
                            fontSize: '0.8rem', 
                            color: chat.latestMessage.readBy && !chat.latestMessage.readBy.includes(user._id) && chat.latestMessage.sender._id !== user._id ? 'var(--primary-dark)' : 'var(--text-light)', 
                            fontWeight: chat.latestMessage.readBy && !chat.latestMessage.readBy.includes(user._id) && chat.latestMessage.sender._id !== user._id ? 'bold' : 'normal',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                        }}>
                            {chat.latestMessage.sender.username}: {chat.latestMessage.isAudio ? "🎵 Audio Message" : chat.latestMessage.content}
                        </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {isGroupModalOpen && <GroupChatModal onClose={() => setIsGroupModalOpen(false)} />}
      {isHistoryOpen && <CallHistoryModal onClose={() => setIsHistoryOpen(false)} />}
    </div>
  );
}

export default Sidebar;
