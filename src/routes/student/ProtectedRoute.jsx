import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/student/AuthContext';

export default function ProtectedRoute({ children }) {
  const { student, loading } = useAuth();
  if (loading) return (
    <div className="page-loading">
      <div className="spinner spinner-md" />
      <p>Loading Learning Management System...</p>
    </div>
  );
  return student ? children : <Navigate to="/login" replace />;
}
