import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import api from '../store/authStore';
import { LogOut, Search, Settings, Plus, History, MessageCircle } from 'lucide-react';
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
    const otherUser = chat.users.find(u => u && u._id !== user._id);
    return otherUser ? otherUser.username : 'Deleted User';
  };
  
  const isOnline = (chat) => {
    if (chat.isGroupChat) return false;
    const otherUser = chat.users.find(u => u && u._id !== user._id);
    return otherUser ? onlineUsers.includes(otherUser._id) : false;
  };
  
  const getSenderPic = (chat) => {
    if (chat.isGroupChat) return "https://api.dicebear.com/7.x/identicon/svg?seed=" + chat.chatName;
    const otherUser = chat.users.find(u => u && u._id !== user._id);
    return otherUser ? otherUser.profilePic : "https://api.dicebear.com/7.x/avataaars/svg?seed=deleted";
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="user-info">
          <img src={user?.profilePic} alt="profile" className="user-avatar" />
          <span className="user-name">{user?.username}</span>
        </div>
        <div className="header-actions">
          <button className="btn-ghost" onClick={() => setIsHistoryOpen(true)} title="Call History">
            <History size={18} />
          </button>
          <button className="btn-ghost" onClick={() => setIsGroupModalOpen(true)} title="New Group">
            <Plus size={18} />
          </button>
          <button className="btn-ghost" onClick={() => navigate('/profile')} title="Settings">
            <Settings size={18} />
          </button>
          <button className="btn-ghost" onClick={logout} title="Logout" style={{ color: 'var(--danger)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Search users..."
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="sidebar-chats">
        {isSearching ? (
          <div>
            <div className="sidebar-section-label">Search Results</div>
            {searchResults.map(u => (
              <div 
                key={u._id} 
                className="search-result-item"
                onClick={() => handleAccessChat(u._id)}
              >
                <img src={u.profilePic} alt="avatar" />
                <span>{u.username}</span>
              </div>
            ))}
            {searchResults.length === 0 && (
              <div className="no-results">No users found</div>
            )}
          </div>
        ) : (
          <div>
            <div className="sidebar-section-label">Messages</div>
            {chats.length === 0 && (
              <div className="no-results" style={{ padding: '40px 20px' }}>
                <MessageCircle size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                No conversations yet.<br/>Search for a user to start chatting.
              </div>
            )}
            {chats.map(chat => {
              const isUnread = chat.latestMessage?.readBy 
                && !chat.latestMessage.readBy.includes(user._id) 
                && chat.latestMessage.sender._id !== user._id;

              return (
                <div 
                  key={chat._id} 
                  className={`chat-item${selectedChat?._id === chat._id ? ' active' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="avatar-wrapper">
                    <img src={getSenderPic(chat)} alt="avatar" />
                    {isOnline(chat) && <div className="online-dot"></div>}
                  </div>
                  <div className="chat-meta">
                    <div className="chat-name">{getSenderName(chat)}</div>
                    {chat.latestMessage && (
                      <div className={`chat-preview${isUnread ? ' unread' : ''}`}>
                        {chat.latestMessage.isAudio 
                          ? '🎵 Voice Message' 
                          : `${chat.latestMessage.sender.username}: ${chat.latestMessage.content}`
                        }
                      </div>
                    )}
                  </div>
                  {chat.latestMessage && (
                    <span className="chat-time">
                      {formatTime(chat.latestMessage.createdAt || chat.updatedAt)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {isGroupModalOpen && <GroupChatModal onClose={() => setIsGroupModalOpen(false)} />}
      {isHistoryOpen && <CallHistoryModal onClose={() => setIsHistoryOpen(false)} />}
    </div>
  );
}

export default Sidebar;
