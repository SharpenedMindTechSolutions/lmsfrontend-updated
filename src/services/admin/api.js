import axios from 'axios';

const api = axios.create({
    baseURL: 'lmsbackend-updated.vercel.app/api',
});

api.interceptors.request.use(config => {
    const token = sessionStorage.getItem('a_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
  r => r,
  e => {
    if (e.response?.status === 401) {
      const msg = e.response?.data?.message || '';
      const isAuthFailure =
        msg === 'authentication is required' ||
        msg === 'Invalid token format' ||
        msg === 'Error in Authentication';
      if (isAuthFailure) {
        sessionStorage.removeItem('a_token');
        sessionStorage.removeItem('a_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(e);
  }
);

export const authAPI = {
    login: (credentials) => api.post('/lms/admin/login', credentials),
};

export const adminAPI = {
    getMetrics: () => api.get('/lms/admin/metrics'),
    getStudents: () => api.get('/lms/admin/students'),
    getTutors: () => api.get('/lms/admin/tutors'),
    getCourses: () => api.get('/lms/admin/courses'),
    getPayments: () => api.get('/lms/admin/payments'),
    approvePayment: (id) => api.put(`/lms/admin/payments/${id}/approve`),
    rejectPayment: (id, reason) => api.put(`/lms/admin/payments/${id}/reject`, { reason }),
    getCoupons: () => api.get('/lms/admin/coupons'),
    createCoupon: (data) => api.post('/lms/admin/coupons', data),
    toggleCoupon: (id) => api.put(`/lms/admin/coupons/${id}/toggle`),
    createComboOffer: (data) => api.post('/lms/admin/combo', data),
    updateComboOffer: (id, data) => api.put(`/lms/admin/combo/${id}`, data),
    deleteComboOffer: (id) => api.delete(`/lms/admin/combo/${id}`),
};

export default api;
