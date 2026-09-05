import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../../services/tutor/api";
import toast from "react-hot-toast";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("t_user");
      const tok = sessionStorage.getItem("t_token");
      if (raw && tok) setTutor(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const login = async (creds) => {
    const { data } = await authAPI.login(creds);
    sessionStorage.setItem("t_token", data.token);
    sessionStorage.setItem("t_user", JSON.stringify(data.tutor));
    setTutor(data.tutor);
    return data.tutor;
  };

  const register = async (form) => (await authAPI.register(form)).data;

  const logout = () => {
    sessionStorage.removeItem("t_token");
    sessionStorage.removeItem("t_user");
    setTutor(null);
    toast.success("Logged out");
  };

  return (
    <Ctx.Provider value={{ tutor, loading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
