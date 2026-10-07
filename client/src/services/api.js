import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach Admin Token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nostalgeste_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Student & Public Endpoints
export const getEventConfig = async () => {
  const res = await api.get('/attendees/config');
  return res.data;
};

export const getAttendeeByStudentId = async (studentId) => {
  const res = await api.get(`/attendees/${studentId.trim()}`);
  return res.data;
};

export const registerAttendee = async (formData) => {
  const res = await api.post('/attendees/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const submitSecondPayment = async (studentId, formData) => {
  const res = await api.post(`/attendees/${studentId.trim()}/second-payment`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

// Gate Check-in Endpoint
export const checkInAttendee = async (data) => {
  const res = await api.post('/attendees/check-in', data);
  return res.data;
};

// Admin Endpoints
export const adminLogin = async (password) => {
  const res = await api.post('/admin/login', { password });
  if (res.data?.token) {
    localStorage.setItem('nostalgeste_admin_token', res.data.token);
  }
  return res.data;
};

export const adminLogout = () => {
  localStorage.removeItem('nostalgeste_admin_token');
};

export const getAdminMetrics = async () => {
  const res = await api.get('/admin/metrics');
  return res.data;
};

export const getAdminAttendees = async (params = {}) => {
  const res = await api.get('/admin/attendees', { params });
  return res.data;
};

export const updateAttendeeStatus = async (id, data) => {
  const res = await api.put(`/admin/attendees/${id}/status`, data);
  return res.data;
};

export const resendTicketEmail = async (id) => {
  const res = await api.post(`/admin/attendees/${id}/resend-email`);
  return res.data;
};

export const adminManualAddAttendee = async (data) => {
  const isFormData = data instanceof FormData;
  const res = await api.post('/admin/attendees/manual-add', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return res.data;
};

export const adminDeleteAttendee = async (id) => {
  const res = await api.delete(`/admin/attendees/${id}`);
  return res.data;
};

export const exportAttendeesCsvApi = async () => {
  const response = await api.get('/admin/export-csv', {
    responseType: 'blob',
  });
  return response.data;
};

export default api;
