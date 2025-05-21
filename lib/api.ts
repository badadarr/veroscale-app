import axios from 'axios';

// API client that automatically includes the authorization token
const apiClient = {
  get: async (url: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    return axios.get(url, config);
  },
  
  post: async (url: string, data: any) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    return axios.post(url, data, config);
  },
  
  put: async (url: string, data: any) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    return axios.put(url, data, config);
  },
  
  delete: async (url: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    return axios.delete(url, config);
  }
};

export default apiClient;
