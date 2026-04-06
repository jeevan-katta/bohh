import { create } from 'zustand';
import api from './authStore';

export const useCallStore = create((set) => ({
  calls: [],
  fetchCallHistory: async () => {
    try {
      const { data } = await api.get('/calls');
      set({ calls: data });
    } catch (error) {
      console.error('Failed to fetch call history', error);
    }
  },
  logCall: async (receiverId, type, status) => {
    try {
      const { data } = await api.post('/calls', { receiverId, type, status });
      set((state) => ({ calls: [data, ...state.calls] }));
    } catch (error) {
      console.error('Failed to log call', error);
    }
  }
}));
