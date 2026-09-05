import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import PublicCertificateVerification from './pages/PublicCertificateVerification';

// Student imports
import { AuthProvider as StudentAuthProvider } from './context/student/AuthContext';
import StudentProtectedRoute from './routes/student/ProtectedRoute';
import StudentDashboardLayout from './layouts/student/DashboardLayout';
import StudentRegister from './pages/auth/student/Register';
import StudentLogin from './pages/auth/student/Login';
import StudentForgotPassword from './pages/auth/student/ForgotPassword';
import StudentResetPassword from './pages/auth/student/ResetPassword';
import StudentDashboardHome from './pages/dashboard/student/DashboardHome';
import CoursesPage from './pages/dashboard/student/CoursesPage';
import CourseDetailPage from './pages/dashboard/student/CourseDetailPage';
import LearnPage from './pages/dashboard/student/LearnPage';
import MyCoursesPage from './pages/dashboard/student/MyCoursesPage';
import ProgressPage from './pages/dashboard/student/ProgressPage';
import ProfilePage from './pages/dashboard/student/ProfilePage';
import StudentAssignmentsPage from './pages/dashboard/student/AssignmentsPage';
import DailyCodeGame from './pages/dashboard/student/DailyCodeGame';
import PaymentHistory from './pages/dashboard/student/PaymentHistory';

// Tutor imports
import { AuthProvider as TutorAuthProvider } from './context/tutor/AuthContext';
import TutorProtectedRoute from './routes/tutor/ProtectedRoute';
import TutorDashboardLayout from './layouts/tutor/DashboardLayout';
import TutorRegister from './pages/auth/tutor/Register';
import TutorLogin from './pages/auth/tutor/Login';
import TutorForgotPassword from './pages/auth/tutor/ForgotPassword';
import TutorResetPassword from './pages/auth/tutor/ResetPassword';
import TutorDashboardHome from './pages/dashboard/tutor/DashboardHome';
import TutorCoursesPage from './pages/dashboard/tutor/CoursesPage';
import CourseForm from './pages/dashboard/tutor/CourseForm';
import CourseDetail from './pages/dashboard/tutor/CourseDetail';
import SessionsPage from './pages/dashboard/tutor/SessionsPage';
import StudentsPage from './pages/dashboard/tutor/StudentsPage';
import StudentProgressPage from './pages/dashboard/tutor/StudentProgressPage';
import EnrollmentsPage from './pages/dashboard/tutor/EnrollmentsPage';
import TutorProfile from './pages/dashboard/tutor/TutorProfile';
import TutorAssignmentsPage from './pages/dashboard/tutor/AssignmentsPage';

// Admin imports
import { AuthProvider as AdminAuthProvider } from './context/admin/AuthContext';
import AdminProtectedRoute from './routes/admin/ProtectedRoute';
import AdminDashboardLayout from './layouts/admin/DashboardLayout';
import AdminLogin from './pages/auth/admin/Login';
import AdminDashboardHome from './pages/dashboard/admin/DashboardHome';
import AdminPaymentManagement from './pages/dashboard/admin/PaymentManagement';
import AdminComboOffers from './pages/dashboard/admin/ComboOffers';

const toastOpts = {
  position: 'top-right',
  toastOptions: {
    style: { borderRadius: '12px', fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: '14px' },
    success: { style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' } },
    error:   { style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' } },
  }
};

const SDB = c => (
  <StudentProtectedRoute>
    <StudentDashboardLayout>{c}</StudentDashboardLayout>
  </StudentProtectedRoute>
);

const TDB = c => (
  <TutorProtectedRoute>
    <TutorDashboardLayout>{c}</TutorDashboardLayout>
  </TutorProtectedRoute>
);

const ADB = c => (
  <AdminProtectedRoute>
    <AdminDashboardLayout>{c}</AdminDashboardLayout>
  </AdminProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <Toaster {...toastOpts} />
      <Routes>
        <Route path="/verify/:certId" element={<PublicCertificateVerification />} />

        {/* ── Student routes ── */}
        <Route path="/*" element={
          <StudentAuthProvider>
            <Routes>
              <Route path="login"           element={<StudentLogin />} />
              <Route path="register"        element={<StudentRegister />} />
              <Route path="forgot-password" element={<StudentForgotPassword />} />
              <Route path="reset-password"  element={<StudentResetPassword />} />
              <Route path="dashboard"                         element={SDB(<StudentDashboardHome />)} />
              <Route path="dashboard/daily-game"              element={SDB(<DailyCodeGame />)} />
              <Route path="dashboard/courses"                 element={SDB(<CoursesPage />)} />
              <Route path="dashboard/courses/:courseId"       element={SDB(<CourseDetailPage />)} />
              <Route path="dashboard/learn/:sessionId"        element={SDB(<LearnPage />)} />
              <Route path="dashboard/my-courses"              element={SDB(<MyCoursesPage />)} />
              <Route path="dashboard/assignments"             element={SDB(<StudentAssignmentsPage />)} />
              <Route path="dashboard/progress"                element={SDB(<ProgressPage />)} />
              <Route path="dashboard/payments"                element={SDB(<PaymentHistory />)} />
              <Route path="dashboard/profile"                 element={SDB(<ProfilePage />)} />
              <Route path=""                                  element={<Navigate to="/login" replace />} />
              <Route path="*"                                 element={<Navigate to="/login" replace />} />
            </Routes>
          </StudentAuthProvider>
        } />

        {/* ── Tutor routes ── */}
        <Route path="/tutor/*" element={
          <TutorAuthProvider>
            <Routes>
              <Route path="login"           element={<TutorLogin />} />
              <Route path="register"        element={<TutorRegister />} />
              <Route path="forgot-password" element={<TutorForgotPassword />} />
              <Route path="reset-password"  element={<TutorResetPassword />} />
              <Route path="dashboard"                               element={TDB(<TutorDashboardHome />)} />
              <Route path="dashboard/courses"                       element={TDB(<TutorCoursesPage />)} />
              <Route path="dashboard/courses/new"                   element={TDB(<CourseForm />)} />
              <Route path="dashboard/courses/:courseId"             element={TDB(<CourseDetail />)} />
              <Route path="dashboard/courses/:courseId/edit"        element={TDB(<CourseForm />)} />
              <Route path="dashboard/sessions"                      element={TDB(<SessionsPage />)} />
              <Route path="dashboard/students"                      element={TDB(<StudentsPage />)} />
              <Route path="dashboard/student-progress"           element={TDB(<StudentProgressPage />)} />
              <Route path="dashboard/enrollments"                   element={TDB(<EnrollmentsPage />)} />
              <Route path="dashboard/assignments"                   element={TDB(<TutorAssignmentsPage />)} />
              <Route path="dashboard/profile"                       element={TDB(<TutorProfile />)} />
              <Route path=""                                        element={<Navigate to="/tutor/login" replace />} />
              <Route path="*"                                       element={<Navigate to="/tutor/login" replace />} />
            </Routes>
          </TutorAuthProvider>
        } />

        {/* ── Admin routes ── */}
        <Route path="/admin/*" element={
          <AdminAuthProvider>
            <Routes>
              <Route path="login" element={<AdminLogin />} />
              <Route path="dashboard" element={ADB(<AdminDashboardHome />)} />
              <Route path="dashboard/payments" element={ADB(<AdminPaymentManagement />)} />
              <Route path="dashboard/combos" element={ADB(<AdminComboOffers />)} />
              <Route path="" element={<Navigate to="/admin/login" replace />} />
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </AdminAuthProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}
