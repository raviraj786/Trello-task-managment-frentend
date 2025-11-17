
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";
// const API_BASE_URL = "https://trello-task-mangment-backend.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },

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
    e.original = error;
   
    if (status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
       
      } catch (err) {
        // ignore storage errors
      }
    }

    return Promise.reject(e);
  }
);


export const authAPI = {
  register: async (userData) => {
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

// Project APIs
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
