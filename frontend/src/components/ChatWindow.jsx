import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { Send, Phone, Video, Mic, ArrowLeft, MessageCircle } from 'lucide-react';
import { socket } from '../pages/ChatDashboard';
import api from '../store/authStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? "" : "http://localhost:5000");

function ChatWindow({ onBack }) {
  const { selectedChat, messages, fetchMessages, sendMessage, addMessage, removeMessage, onlineUsers } = useChatStore();
  const user = useAuthStore(state => state.user);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      socket.emit("join chat", selectedChat._id);
    }
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Mark text messages as read
    if (messages.length > 0) {
      messages.forEach(m => {
        if (!m.isAudio && !m.readBy.includes(user._id)) {
          api.put(`/messages/${m._id}/read`).catch(() => {});
        }
      });
    }
  }, [messages, isTyping, user._id]);

  useEffect(() => {
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    return () => {
      socket.off("typing");
      socket.off("stop typing");
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    socket.emit("stop typing", selectedChat._id);
    setTyping(false);

    const content = newMessage;
    setNewMessage("");
    const msg = await sendMessage(content, selectedChat._id);
    if(msg) {
        socket.emit("new message", msg);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", selectedChat._id);
      setTyping(false);
    }, 3000);
  };

  const handleAudioEnd = async (msgId) => {
    try {
      await api.delete(`/messages/${msgId}`);
      removeMessage(msgId);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append("audio", audioBlob, "voice-message.webm");
        formData.append("chatId", selectedChat._id);
        
        try {
           const { data } = await api.post('/messages/audio', formData, {
               headers: { 'Content-Type': 'multipart/form-data' }
           });
           addMessage(data);
           socket.emit("new message", data);
        } catch (error) {
           console.error("Audio post failed", error);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
    }
  };

  const getSenderName = (chat) => {
    if (chat.isGroupChat) return chat.chatName;
    const otherUser = chat.users.find(u => u && u._id !== user._id);
    return otherUser ? otherUser.username : 'Deleted User';
  };

  const getSenderPic = (chat) => {
    if (chat.isGroupChat) return "https://api.dicebear.com/7.x/identicon/svg?seed=" + chat.chatName;
    const otherUser = chat.users.find(u => u && u._id !== user._id);
    return otherUser ? otherUser.profilePic : "https://api.dicebear.com/7.x/avataaars/svg?seed=deleted";
  };
  
  const isOnline = (chat) => {
    if (chat.isGroupChat) return false;
    const otherUser = chat.users.find(u => u && u._id !== user._id);
    return otherUser ? onlineUsers.includes(otherUser._id) : false;
  };

  const formatMsgTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Date separator logic
  const getDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  if (!selectedChat) {
    return (
      <div className="chat-area">
        <div className="chat-area-empty">
          <div className="empty-icon">
            <MessageCircle size={36} color="var(--primary)" />
          </div>
          <h2>Welcome to Bhoh</h2>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  // Group messages by date
  let lastDateLabel = '';

  return (
    <div className="chat-area">
      {/* Header */}
      <div className="chat-header">
        <div className="header-info">
          <button className="btn-ghost mobile-back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <img src={getSenderPic(selectedChat)} alt="" className="header-avatar" />
          <div>
            <div className="header-name">{getSenderName(selectedChat)}</div>
            <div className={`header-status ${isOnline(selectedChat) ? 'online' : 'offline'}`}>
              {selectedChat.isGroupChat 
                ? `${selectedChat.users.length} members` 
                : (isOnline(selectedChat) ? 'Online' : 'Offline')
              }
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn-icon primary"
            onClick={() => {
              if (selectedChat.isGroupChat) {
                  const usersToCall = selectedChat.users.filter(u => u && u._id !== user._id);
                  if(usersToCall.length > 0) window.dispatchEvent(new CustomEvent('initiate-call', { detail: { usersToCall, video: true } }));
              } else {
                  const otherUser = selectedChat.users.find(u => u && u._id !== user._id);
                  if(otherUser) window.dispatchEvent(new CustomEvent('initiate-call', { detail: { userToCall: otherUser, video: true } }));
              }
            }}
            title={selectedChat.isGroupChat ? "Group Video Call" : "Video Call"}
          >
            <Video size={18} />
          </button>
          <button 
            className="btn-icon primary"
            onClick={() => {
              if (selectedChat.isGroupChat) {
                  const usersToCall = selectedChat.users.filter(u => u && u._id !== user._id);
                  if(usersToCall.length > 0) window.dispatchEvent(new CustomEvent('initiate-call', { detail: { usersToCall, video: false } }));
              } else {
                  const otherUser = selectedChat.users.find(u => u && u._id !== user._id);
                  if(otherUser) window.dispatchEvent(new CustomEvent('initiate-call', { detail: { userToCall: otherUser, video: false } }));
              }
            }}
            title={selectedChat.isGroupChat ? "Group Audio Call" : "Audio Call"}
          >
            <Phone size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((m, i) => {
          const isSent = m.sender && m.sender._id === user._id;
          const dateLabel = getDateLabel(m.createdAt);
          let showDateSeparator = false;
          if (dateLabel !== lastDateLabel) {
            showDateSeparator = true;
            lastDateLabel = dateLabel;
          }

          return (
            <React.Fragment key={m._id || i}>
              {showDateSeparator && (
                <div style={{ 
                  textAlign: 'center', margin: '20px 0 12px', 
                  fontSize: '0.6875rem', color: 'var(--text-muted)',
                  fontWeight: 600, letterSpacing: '0.05em'
                }}>
                  {dateLabel}
                </div>
              )}
              <div className={`message ${isSent ? 'sent' : 'received'}`}>
                {!isSent && selectedChat.isGroupChat && (
                  <span className="sender-name">{m.sender.username}</span>
                )}
                <div className={`bubble${m.isAudio ? ' audio-bubble' : ''}`}>
                  {m.isAudio ? (
                    <audio 
                      src={`${BACKEND_URL}${m.content}`} 
                      controls 
                      controlsList="nodownload"
                      onEnded={() => handleAudioEnd(m._id)}
                    />
                  ) : (
                    m.content
                  )}
                </div>
                <span className="time-stamp">{formatMsgTime(m.createdAt)}</span>
              </div>
            </React.Fragment>
          );
        })}
        {isTyping && (
          <div className="typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="message-input-area">
        <form onSubmit={handleSend}>
          <input
            className="input-field"
            type="text"
            placeholder={isRecording ? "Recording..." : "Type a message..."}
            value={newMessage}
            onChange={typingHandler}
            disabled={isRecording}
          />
          <button 
            type="submit" 
            className="btn-icon primary" 
            disabled={isRecording || !newMessage.trim()}
            title="Send"
          >
            <Send size={18} />
          </button>
        </form>
        <div className={`record-btn${isRecording ? ' recording' : ''}`}>
          <button 
            type="button" 
            className={`btn-icon ${isRecording ? 'danger' : 'primary'}`}
            onClick={toggleRecording}
            title={isRecording ? "Stop Recording" : "Record Voice"}
          >
            <Mic size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
