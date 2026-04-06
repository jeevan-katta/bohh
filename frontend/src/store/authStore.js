import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Make sure proxy isn't needed if full url provided, but CORS must match
  withCredentials: true,
});

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('userInfo')) || null,
  
  login: async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      set({ user: res.data });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  },
  
  register: async (username, email, password) => {
    try {
      const res = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      set({ user: res.data });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('userInfo');
      set({ user: null });
    } catch (error) {
      console.error(error);
    }
  },
}));

export default api;
