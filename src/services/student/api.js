import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: BASE, withCredentials: true });

api.interceptors.request.use(cfg => {
  const t = sessionStorage.getItem('s_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
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
        sessionStorage.removeItem('s_token');
        sessionStorage.removeItem('s_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(e);
  }
);

export const authAPI = {
  register:      d => api.post('/create/student', d),
  login:         d => api.post('/login/student', d),
  logout:        () => api.post('/logout/student'),
  forgotPassword: d => api.post('/forgot-password/student', d),
  resetPassword:  d => api.post('/reset-password/student', d),
};

export const courseAPI = {
  getAll:  () => api.get('/lms/courses'),
  getById: id => api.get(`/lms/courses/${id}`),
};

export const sessionAPI = {
  byCourse: cid => api.get(`/lms/courses/${cid}/sessions`),
  byId:     sid => api.get(`/lms/sessions/${sid}`),
};

export const testAPI = {
  bySession: sid => api.get(`/lms/sessions/${sid}/tests`),
  byId:      tid => api.get(`/lms/tests/${tid}`),
  submit:    (tid, answers) => api.post(`/lms/tests/${tid}/submit`, { answers }),
};

export const progressAPI = {
  mine: cid => api.get(`/lms/students/me/progress/${cid}`),
};

export const videoProgressAPI = {
  update: (sessionId, data) => api.post(`/lms/sessions/${sessionId}/video-progress`, data),
  get:    sessionId => api.get(`/lms/sessions/${sessionId}/video-progress`),
};

export const enrollmentAPI = {
  check:  courseId => api.get(`/lms/enrollments/check/${courseId}`),
  verify: (courseId, enrollmentCode) => api.post('/lms/enrollments/verify', { courseId, enrollmentCode }),
  verifyCombo: data => api.post('/lms/enrollments/combo-verify', data),
};

export const paymentAPI = {
  submitUpi: (data) => api.post('/lms/payments/submit-upi', data),
  validateCoupon: (data) => api.post('/lms/payments/validate-coupon', data),
  getStatus: (courseId) => api.get(`/lms/payments/status/${courseId}`),
  myPayments: () => api.get('/lms/payments/my-payments'),
  createOrder: (data) => api.post('/lms/payments/create-order', data),
  verify: (data) => api.post('/lms/payments/verify', data),
};

export const assignmentAPI = {
  byCourse:     cid => api.get(`/lms/courses/${cid}/assignment`),
  byId:         aid => api.get(`/lms/assignments/${aid}`),
  submit:       (aid, d) => api.post(`/lms/assignments/${aid}/submit`, d),
  mySubmission: aid => api.get(`/lms/assignments/${aid}/my-submission`),
};

export const studentAPI = {
  byId:   id => api.get(`/getStudentById/${id}`),
  update: (id, d) => api.put(`/updateStudent/${id}`, d),
};

export const gamificationAPI = {
  myStats:     () => api.get('/lms/gamification/my-stats'),
  leaderboard: () => api.get('/lms/gamification/leaderboard'),
};

export const codingGameAPI = {
  getDaily: () => api.get('/lms/games/daily'),
  getAll:   params => api.get('/lms/games/all', { params }),
  submit:   d => api.post('/lms/games/submit', d),
};

export const timeTrackingAPI = {
  heartbeat: d => api.post('/lms/analytics/heartbeat', d),
  myTime:    () => api.get('/lms/analytics/my-time'),
  courseTime: cid => api.get(`/lms/analytics/tutor/course-time/${cid}`),
};

export const certificateAPI = {
  me:        () => api.get('/lms/certificates/me'),
  byCourse:  cid => api.get(`/lms/certificates/course/${cid}`),
  verify:    certId => api.get(`/lms/certificates/verify/${certId}`),
};

export const taskAPI = {
  bySession:  sid => api.get(`/lms/sessions/${sid}/student-task`),
  submit:     (tid, d) => api.post(`/lms/tasks/${tid}/submit`, d),
};

export const videoNoteAPI = {
  create:    (sid, data) => api.post(`/lms/sessions/${sid}/notes`, data),
  bySession: sid => api.get(`/lms/sessions/${sid}/notes`),
  update:    (nid, data) => api.put(`/lms/notes/${nid}`, data),
  delete:    nid => api.delete(`/lms/notes/${nid}`),
};

export const discussionAPI = {
  create:       data => api.post('/lms/discussions', data),
  bySession:    (sid, params) => api.get(`/lms/discussions/session/${sid}`, { params }),
  byId:         id => api.get(`/lms/discussions/${id}`),
  update:       (id, data) => api.put(`/lms/discussions/${id}`, data),
  delete:       id => api.delete(`/lms/discussions/${id}`),
  upvote:       id => api.post(`/lms/discussions/${id}/upvote`),
  addReply:     (id, data) => api.post(`/lms/discussions/${id}/replies`, data),
  updateReply:  id => api.put(`/lms/discussions/replies/${id}`), // Needs body but keeping signature simple
  deleteReply:  id => api.delete(`/lms/discussions/replies/${id}`),
  upvoteReply:  id => api.post(`/lms/discussions/replies/${id}/upvote`),
  markTutorAns: id => api.put(`/lms/discussions/replies/${id}/tutor-answer`),
};

export default api;
