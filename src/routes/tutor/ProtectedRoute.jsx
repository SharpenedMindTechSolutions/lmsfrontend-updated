import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/tutor/AuthContext';

export default function ProtectedRoute({ children }) {
  const { tutor, loading } = useAuth();
  if (loading) return (
    <div className="page-loading">
      <div className="spinner spinner-md" />
      <p>Loading Tutor Portal…</p>
    </div>
  );
  return tutor ? children : <Navigate to="/tutor/login" replace />;
}
