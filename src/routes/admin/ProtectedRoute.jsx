import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/admin/AuthContext';

export default function ProtectedRoute({ children }) {
    const { admin, loading } = useAuth();

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    
    if (!admin) {
        return <Navigate to="/admin/login" replace />;
    }

    if (admin.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return children;
}
