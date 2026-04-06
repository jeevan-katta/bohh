import { create } from 'zustand';
import api from './authStore';

export const useChatStore = create((set, get) => ({
  chats: [],
  selectedChat: null,
  messages: [],
  socketConnected: false,
  onlineUsers: [],

  setSocketConnected: (status) => set({ socketConnected: status }),
  
  fetchChats: async () => {
    try {
      const { data } = await api.get('/chats');
      set({ chats: data });
    } catch (error) {
      console.error('Failed to fetch chats');
    }
  },

  setSelectedChat: (chat) => set({ selectedChat: chat }),

  fetchMessages: async (chatId) => {
    try {
      const { data } = await api.get(`/messages/${chatId}`);
      set({ messages: data });
    } catch (error) {
      console.error('Failed to fetch messages');
    }
  },

  sendMessage: async (content, chatId) => {
    try {
      const { data } = await api.post('/messages', { content, chatId });
      set((state) => ({ messages: [...state.messages, data] }));
      return data;
    } catch (error) {
      console.error('Failed to send message');
      return null;
    }
  },

  addMessage: (message) => {
    set((state) => {
      // Avoid duplicate messages
      if (state.messages.some((m) => m._id === message._id)) return state;
      // Only append if it's for currently selected chat
      if (state.selectedChat && state.selectedChat._id === message.chat._id) {
         return { messages: [...state.messages, message] };
      }
      return state;
    });
  },
  
  removeMessage: (messageId) => {
    set((state) => ({ messages: state.messages.filter((m) => m._id !== messageId) }));
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  addUserOnline: (userId) => set((state) => ({
    onlineUsers: [...new Set([...state.onlineUsers, userId])]
  })),

  removeUserOffline: (userId) => set((state) => ({
    onlineUsers: state.onlineUsers.filter(id => id !== userId)
  })),

  updateChatLatestMessage: (message) => {
    set((state) => {
      const chatIndex = state.chats.findIndex(c => c._id === message.chat._id);
      if (chatIndex > -1) {
        const updatedChat = { ...state.chats[chatIndex], latestMessage: message };
        const newChats = [...state.chats];
        newChats.splice(chatIndex, 1);
        newChats.unshift(updatedChat);
        return { chats: newChats };
      }
      return state;
    });
  },
  
  createGroupChat: async (name, users) => {
    try {
       const userIds = users.map(u => u._id);
       const { data } = await api.post('/chats/group', { name, users: JSON.stringify(userIds) });
       set((state) => ({ chats: [data, ...state.chats] }));
       return data;
    } catch (error) {
       console.error("Failed to create group");
       return null;
    }
  },
  
  accessChat: async (userId) => {
    try {
       const { data } = await api.post('/chats', { userId });
       const currentChats = get().chats;
       if (!currentChats.find((c) => c._id === data._id)) {
           set({ chats: [data, ...currentChats] });
       }
       set({ selectedChat: data });
       return data;
    } catch (error) {
       console.error(error);
       return null;
    }
  }
}));
