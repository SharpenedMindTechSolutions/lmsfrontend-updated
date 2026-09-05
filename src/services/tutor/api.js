import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL;
const api  = axios.create({ baseURL: BASE, withCredentials: true });

api.interceptors.request.use(cfg => {
  const t = sessionStorage.getItem('t_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  e => {
    if (e.response?.status === 401) {
      const msg = e.response?.data?.message || '';
      if (msg === 'authentication is required' || msg === 'Invalid token format' || msg === 'Error in Authentication') {
        sessionStorage.removeItem('t_token');
        sessionStorage.removeItem('t_user');
        window.location.href = '/tutor/login';
      }
    }
    return Promise.reject(e);
  }
);

export const authAPI = {
  register: d => api.post('/create/tutor', d),
  login:    d => api.post('/login/tutor', d),
};

export const courseAPI = {
  create:  d      => api.post('/lms/courses', d),
  getAll:  ()     => api.get('/lms/courses'),
  getById: id     => api.get(`/lms/courses/${id}`),
  update:  (id,d) => api.put(`/lms/courses/${id}`, d),
  delete:  id     => api.delete(`/lms/courses/${id}`),
};

export const sessionAPI = {
  add:      (cid,d) => api.post(`/lms/courses/${cid}/sessions`, d),
  byCourse: cid     => api.get(`/lms/courses/${cid}/sessions`),
  byId:     sid     => api.get(`/lms/sessions/${sid}`),
  update:   (sid,d) => api.put(`/lms/sessions/${sid}`, d),
  delete:   sid     => api.delete(`/lms/sessions/${sid}`),
};

export const testAPI = {
  create:    (sid,d) => api.post(`/lms/sessions/${sid}/tests`, d),
  bySession: sid     => api.get(`/lms/sessions/${sid}/tests`),
  byId:      tid     => api.get(`/lms/tests/${tid}`),
  update:    (tid,d) => api.put(`/lms/tests/${tid}`, d),
  delete:    tid     => api.delete(`/lms/tests/${tid}`),
};

export const enrollmentAPI = {
  createCode: d      => api.post('/lms/enrollments/create-code', d),
  getAll:     ()     => api.get('/lms/enrollments'),
  getById:    id     => api.get(`/lms/enrollments/${id}`),
  update:     (id,d) => api.put(`/lms/enrollments/${id}`, d),
  delete:     id     => api.delete(`/lms/enrollments/${id}`),
};

export const progressAPI = {
  courseStudents: cid => api.get(`/lms/tutor/courses/${cid}/students-progress`),
};

export const assignmentAPI = {
  create:          (cid,d)  => api.post(`/lms/courses/${cid}/assignment`, d),
  byCourse:        cid      => api.get(`/lms/courses/${cid}/assignment`),
  byId:            aid      => api.get(`/lms/assignments/${aid}`),
  update:          (aid,d)  => api.put(`/lms/assignments/${aid}`, d),
  delete:          aid      => api.delete(`/lms/assignments/${aid}`),
  submissions:     aid      => api.get(`/lms/assignments/${aid}/submissions`),
  reviewSubmission:(sid,d)  => api.put(`/lms/submissions/${sid}/review`, d),
};

export const studentAPI = {
  getAll:  () => api.get('/getAll/student'),
  getById: id => api.get(`/getStudentById/${id}`),
  update:  (id,d) => api.put(`/updateStudent/${id}`, d),
  delete:  id => api.delete(`/deleteStudent/${id}`),
};

export const notificationAPI = {
  getAll: () => api.get('/lms/notifications'),
};

export const tutorAPI = {
  getById: id     => api.get(`/gettutorById/${id}`),
  update:  (id,d) => api.put(`/update/${id}`, d),
  delete:  id     => api.delete(`/delete/${id}`),
};

export const timeTrackingAPI = {
  courseTime: cid => api.get(`/lms/analytics/tutor/course-time/${cid}`),
};

export const taskAPI = {
  create:       (sid, d)  => api.post(`/lms/sessions/${sid}/tasks`, d),
  bySession:    sid       => api.get(`/lms/sessions/${sid}/tasks`),
  byCourse:     cid       => api.get(`/lms/courses/${cid}/tasks`),
  delete:       tid       => api.delete(`/lms/tasks/${tid}`),
  submissions:  tid       => api.get(`/lms/tasks/${tid}/submissions`),
  addFeedback:  (sid, d)  => api.post(`/lms/tasks/submissions/${sid}/feedback`, d),
};

export default api;

export const authTutorAPI = {
  forgotPassword: d => api.post('/forgot-password/tutor', d),
  resetPassword:  d => api.post('/reset-password/tutor', d),
};

export const discussionAPI = {
  create:       data => api.post('/lms/discussions', data),
  bySession:    (sid, params) => api.get(`/lms/discussions/session/${sid}`, { params }),
  byId:         id => api.get(`/lms/discussions/${id}`),
  update:       (id, data) => api.put(`/lms/discussions/${id}`, data),
  delete:       id => api.delete(`/lms/discussions/${id}`),
  upvote:       id => api.post(`/lms/discussions/${id}/upvote`),
  addReply:     (id, data) => api.post(`/lms/discussions/${id}/replies`, data),
  updateReply:  id => api.put(`/lms/discussions/replies/${id}`),
  deleteReply:  id => api.delete(`/lms/discussions/replies/${id}`),
  upvoteReply:  id => api.post(`/lms/discussions/replies/${id}/upvote`),
  markTutorAns: id => api.put(`/lms/discussions/replies/${id}/tutor-answer`),
};
