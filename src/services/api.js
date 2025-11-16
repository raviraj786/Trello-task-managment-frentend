// src/services/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials: false, // enable if using cookies+sessions
});

// Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
// - On success: return response.data directly (simpler for callers).
// - On error: create an Error object carrying status and payload for callers.
api.interceptors.response.use(
  (response) => {
    // Return only response.data so callers get the API payload directly.
    return response.data;
  },
  (error) => {
    // Try to extract useful information
    const status = error?.response?.status;
    const payload = error?.response?.data;
    const serverMessage =
      payload?.message ||
      (payload && typeof payload === "string" ? payload : null);
    const message = serverMessage || error.message || "Something went wrong";

    const e = new Error(message);
    e.status = status;
    e.payload = payload;
    // Optional: keep original axios error for deep debugging
    e.original = error;
    // If unauthorized, clear token and redirect (you already had this behaviour)
    if (status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // avoid forcing redirect in library; let caller handle redirection if needed.
        // But if you want immediate redirect uncomment next line:
        // window.location.href = '/login';
      } catch (err) {
        // ignore storage errors
      }
    }

    return Promise.reject(e);
  }
);

// AUTH APIs (they now receive API payload directly because interceptor returns response.data)
export const authAPI = {
  register: async (userData) => {
    // Let errors bubble up as Error with .status and .payload
    const data = await api.post("/auth/register", userData);
    return data; // data is response.data from server
  },

  login: async (credentials) => {
    const data = await api.post("/auth/login", credentials);
    return data;
  },

  getMe: async () => {
    const data = await api.get("/auth/me");
    return data;
  },
};

// Project APIs (same pattern)
export const projectAPI = {
  getProjects: async () => {
    return await api.get("/projects");
  },
  createProject: async (projectData) => {
    return await api.post("/projects", projectData);
  },
  updateProject: async (id, projectData) => {
    return await api.put(`/projects/${id}`, projectData);
  },
  deleteProject: async (id) => {
    return await api.delete(`/projects/${id}`);
  },
  addMember: async (id, userId) => {
    return await api.post(`/projects/${id}/members`, { userId });
  },
};

// Task APIs
export const taskAPI = {
  getTasks: (projectId) => api.get(`/projects/${projectId}/tasks`),
  createTask: (projectId, data) =>
    api.post(`/projects/${projectId}/tasks`, data),
  deleteTask: (projectId, taskId) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),
  updateTaskPosition: (projectId, taskId, { status, position }) =>
    api.patch(`/projects/${projectId}/tasks/${taskId}/position`, {
      status,
      position,
    }),
  bulkUpdateTasks: (projectId, tasks) =>
    api.post(`/projects/${projectId}/tasks/bulk`, { tasks }),
};

export default api;
