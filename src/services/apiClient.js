import axios from "axios";
import { setupCache } from "axios-cache-interceptor";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

const apiClient = setupCache(instance);

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("API Error:", error.response || error.message);

    if (
      error.response &&
      error.response.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
