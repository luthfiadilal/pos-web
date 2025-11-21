import { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginRequest,
  logout as logoutRequest,
} from "../services/auth";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [bizType, setBizType] = useState(() => {
    const saved = localStorage.getItem("bizType");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("bizType", JSON.stringify(bizType));
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("bizType");
    }
  }, [user, bizType]);

  const login = async (username, password) => {
    const res = await loginRequest(username, password);

    // Ambil biz_type dari respons
    const userBizType = res.data.compBizType.comp_biz_type;

    // Set state
    setUser(res.data);
    setBizType(userBizType);

    return res;
  };

  const logout = () => {
    logoutRequest(); 
    setUser(null);
    setBizType(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, bizType, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
