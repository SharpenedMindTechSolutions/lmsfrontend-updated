import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../../services/admin/api";
import toast from "react-hot-toast";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("a_user");
      const tok = sessionStorage.getItem("a_token");
      if (raw && tok) setAdmin(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const login = async (creds) => {
    const { data } = await authAPI.login(creds);
    sessionStorage.setItem("a_token", data.token);
    sessionStorage.setItem("a_user", JSON.stringify(data.user));
    setAdmin(data.user);
    return data.user;
  };

  const logout = () => {
    sessionStorage.removeItem("a_token");
    sessionStorage.removeItem("a_user");
    setAdmin(null);
    toast.success("Logged out");
  };

  return (
    <Ctx.Provider value={{ admin, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
