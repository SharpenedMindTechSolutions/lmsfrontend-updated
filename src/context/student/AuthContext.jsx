import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../../services/student/api';
import toast from 'react-hot-toast';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('s_user');
      const tok = sessionStorage.getItem('s_token');
      if (raw && tok) setStudent(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const login = async creds => {
    const { data } = await authAPI.login(creds);
    sessionStorage.setItem('s_token', data.token);
    sessionStorage.setItem('s_user', JSON.stringify(data.student));
    setStudent(data.student);
    return data.student;
  };

  const register = async form => {
    const { data } = await authAPI.register(form);
    return data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    sessionStorage.removeItem('s_token');
    sessionStorage.removeItem('s_user');
    setStudent(null);
    toast.success('Logged out successfully');
  };

  return (
    <Ctx.Provider value={{ student, loading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
