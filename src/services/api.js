import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";
// const API_BASE_URL = "https://trello-task-mangment-backend.onrender.com/api";




const api = axios.create({
  baseURL: API_BASE_URL,
    headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});






api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
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
    return data; 
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
 async getTasks(projectId) {
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("taskAPI.getTasks error:", err?.response?.data || err.message);
      return { success: false, error: err };
    }
  },







async createTask(projectId, task) {
    try {
      const res = await api.post(`/projects/${projectId}/tasks`, { task });
      console.log(res.data,"sssssssssss")
      return { success: true, data: res.data };
    } catch (err) {
      console.error("taskAPI.createTask error:", err?.response?.data || err.message);
      return { success: false, error: err };
    }
  },



   async updateTask(projectId, taskId, fields) {
    try {
      const res = await api.put(`/projects/${projectId}/tasks/${taskId}`, { fields });
      return { success: true, data: res.data };
    } catch (err) {
      console.error("taskAPI.updateTask error:", err?.response?.data || err.message);
      return { success: false, error: err };
    }
  },



  async deleteTask(projectId, taskId) {
    try {
      const res = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("taskAPI.deleteTask error:", err?.response?.data || err.message);
      return { success: false, error: err };
    }
  },



 // bulk update: server expects array of tasks representing whole board
  async bulkUpdateTasks(projectId, tasks) {
    try {
      const res = await api.post(`/projects/${projectId}/tasks/bulk`, { tasks });
      return { success: true, data: res.data };
    } catch (err) {
      console.error("taskAPI.bulkUpdateTasks error:", err?.response?.data || err.message);
      return { success: false, error: err };
    }
  },




};

export default api;
