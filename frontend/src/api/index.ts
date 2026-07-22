import axios from "axios";
import { ElMessage } from "element-plus";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// A 401 means the backend re-validated the session against the DB and rejected it — the
// account was deactivated/deleted, its password changed, or the cookie is gone/expired. Log
// the user out and surface the server's reason. Skipped for /auth/login (its form shows its
// own error) and /auth/profile (the router guard already handles the initial-load case), so
// we don't double-handle or fight the guard.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? "";

    if (status === 401 && !url.includes("/auth/login") && !url.includes("/auth/profile")) {
      const { default: AuthStore } = await import("@/modules/auth/store");
      const store = AuthStore();
      if (store.isAuthed !== false) {
        store.logout();
        ElMessage.error(error?.response?.data?.detail?.message || "Your session has expired, please log in again");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
