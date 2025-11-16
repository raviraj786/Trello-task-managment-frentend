// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Helper: normalize different possible response shapes
const normalizeResponse = (response) => {
  const res = response ?? {};
  const data = res.data ?? res; // axios-like -> res.data else res itself

  return {
    success: !!(
      (data && data.success === true) ||
      data?.token ||
      data?.user ||
      data?._id
    ),
    data,
    message: data?.message || res?.message || "",
    token: data?.token || data?.accessToken || null,
    user:
      data?.user ||
      (data && (data.name || data.email || data._id) ? data : null),
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authAPI.getMe();
      const { data } = normalizeResponse(response);
      const fetchedUser = data?.user ?? data;
      if (fetchedUser) {
        setUser(fetchedUser);
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      localStorage.removeItem("token");
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      const {
        success,
        data,
        message,
        token,
        user: respUser,
      } = normalizeResponse(response);

      if (success) {
        const finalToken = token || data?.token || data?.accessToken || null;
        const finalUser = respUser || data?.user || data;

        if (finalToken) localStorage.setItem("token", finalToken);
        if (finalUser) {
          setUser(finalUser);
          localStorage.setItem("user", JSON.stringify(finalUser));
        }

        toast.success("Login successful!");
        return { success: true, message: message || "Login successful" };
      } else {
        const errMsg = message || "Login failed";
        toast.error(errMsg);
        return { success: false, message: errMsg };
      }
    } catch (err) {
      console.error("Login error:", err);
      const errMsg =
        err?.response?.data?.message || err?.message || "Server error";
      toast.error(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.register({ name, email, password });
      const {
        success,
        data,
        message,
        token,
        user: respUser,
      } = normalizeResponse(response);

      if (success) {
        const finalToken = token || data?.token || data?.accessToken || null;
        const finalUser = respUser || data?.user || data;

        if (finalToken) localStorage.setItem("token", finalToken);
        if (finalUser) {
          setUser(finalUser);
          localStorage.setItem("user", JSON.stringify(finalUser));
        }

        toast.success("Registration successful!");
        return { success: true, message: message || "Registration successful" };
      } else {
        const errMsg = message || "Registration failed";
        toast.error(errMsg);
        return { success: false, message: errMsg };
      }
    } catch (err) {
      console.error("Register error:", err);
      const errMsg =
        err?.response?.data?.message || err?.message || "Server error";
      toast.error(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully");
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
