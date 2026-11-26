import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor to add auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor for 401 handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (localStorage.getItem('token')) {
        console.warn('Session expired or unauthorized');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  getMe: () => API.get('/auth/me'),
};

export const campaignAPI = {
  getPublic: (params) => API.get('/campaigns', { params }),
  getStats: () => API.get('/campaigns/stats'),
  getById: (id) => API.get(`/campaigns/${id}`),
  getMyCampaigns: () => API.get('/campaigns/my'),
  create: (formData) => API.post('/campaigns', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => API.put(`/campaigns/${id}`, data),
  report: (id, reportData) => API.post(`/campaigns/${id}/report`, reportData),
};

export const donationAPI = {
  getConfig: () => API.get('/donations/config'),
  createOrder: (orderData) => API.post('/donations/order', orderData),
  verifyPayment: (paymentData) => API.post('/donations/verify', paymentData),
  failPayment: (failData) => API.post('/donations/fail', failData),
  cancelOrder: (cancelData) => API.post('/donations/cancel', cancelData),
  getMyDonations: () => API.get('/donations/my'),
  getCampaignDonations: (campaignId) => API.get(`/donations/campaign/${campaignId}`),
};

export const adminAPI = {
  getCampaigns: (params) => API.get('/admin/campaigns', { params }),
  reviewCampaign: (id, reviewData) => API.put(`/admin/campaigns/${id}/review`, reviewData),
  reassessRisk: (id) => API.post(`/admin/campaigns/${id}/reassess-risk`),
  verifyDocument: (id, docData) => API.put(`/admin/documents/${id}/verify`, docData),
  getUsers: () => API.get('/admin/users'),
  getReports: () => API.get('/admin/reports'),
  updateReport: (id, reportData) => API.put(`/admin/reports/${id}`, reportData),
  getSettlements: () => API.get('/admin/settlements'),
  simulateSettlement: (settlementData) => API.post('/admin/settlements/simulate', settlementData),
  getAnalytics: () => API.get('/admin/analytics'),
};

export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  markRead: (id) => API.put(`/notifications/${id}/read`),
};

export const contactAPI = {
  submit: (contactData) => API.post('/contact', contactData),
  getAll: () => API.get('/contact'),
};

export default API;
