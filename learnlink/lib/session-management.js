// lib/session-management.js
import jwt_decode  from "jwt-decode";

const TOKEN_KEY = "auth_token";

const sessionManagement = {
  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),

  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  getUser: () => {
    const token = sessionManagement.getToken();
    if (!token) return null;
    try {
      const decoded = jwt_decode(token);
      if (decoded.exp * 1000 < Date.now()) {  // Check expiry
        console.warn("Token expired, clearing...");
        sessionManagement.clearToken();
        return null;
      }
      return decoded;
    } catch (err) {
      console.error("Invalid token:", err);
      sessionManagement.clearToken();
      return null;
    }
  },

  isAuthenticated: () => {
    const user = sessionManagement.getUser();
    return !!user;
  },
};

export default sessionManagement;