import axios, { type AxiosError, type AxiosResponse } from "axios";
import { API_BASE_URL } from "../../shared/config/env";

export type ApiOk<T> = { ok: true; data: T; message?: string; status: number };
export type ApiErr = { ok: false; data: any; message: string; status: number };
export type ApiResult<T> = ApiOk<T> | ApiErr;

// -------------------- utils --------------------
function normalizeErrorMessage(payload: any, fallback: string): string {
  if (!payload) return fallback;

  // case: array errors
  if (Array.isArray(payload.detail)) {
    return payload.detail
      .map(
        (e: any) =>
          e.msg || e.message || (typeof e === "string" ? e : JSON.stringify(e))
      )
      .join("\n");
  }

  // case: detail is plain string
  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  // case: detail is object
  if (payload.detail && typeof payload.detail === "object") {
    return (
      payload.detail.message ||
      payload.detail.msg ||
      JSON.stringify(payload.detail) ||
      fallback
    );
  }

  // case: top-level msg / message
  if (payload.msg) return String(payload.msg);
  if (payload.message) return String(payload.message);

  return fallback;
}

function extractMessage(payload: any, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return typeof payload === "string" ? payload : fallback;
  }

  if ("message" in payload && payload.message) return String(payload.message);
  if ("msg" in payload && payload.msg) return String(payload.msg);

  if ("detail" in payload) {
    if (typeof payload.detail === "string") return String(payload.detail);
    if (Array.isArray(payload.detail)) {
      return payload.detail
        .map(
          (e: any) =>
            e.msg || e.message || (typeof e === "string" ? e : JSON.stringify(e))
        )
        .join("\n");
    }
    if (typeof payload.detail === "object" && payload.detail) {
      return (
        payload.detail.message ||
        payload.detail.msg ||
        JSON.stringify(payload.detail) ||
        fallback
      );
    }
  }

  return fallback;
}

function toOk<T>(res: AxiosResponse<T>): ApiOk<T> {
  const anyData = res.data as any;
  const msg = extractMessage(anyData, "");
  return {
    ok: true,
    data: res.data,
    message: msg || undefined,
    status: res.status,
  };
}

function toErr(error: AxiosError): ApiErr {
  const status = error.response?.status ?? 0;
  const payload = error.response?.data as any;
  const msg = normalizeErrorMessage(payload, error.message || "Request failed");
  return { ok: false, data: payload, message: msg, status };
}

// -------------------- axios instance --------------------
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => config);
apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

// -------------------- typed helpers --------------------
export const api = {
  get: async <T>(
    url: string,
    config?: Parameters<typeof apiClient.get>[1]
  ): Promise<ApiResult<T>> => {
    try {
      const res = await apiClient.get<T>(url, config);
      return toOk(res);
    } catch (e) {
      return toErr(e as AxiosError);
    }
  },

  post: async <T>(
    url: string,
    data?: any,
    config?: Parameters<typeof apiClient.post>[2]
  ): Promise<ApiResult<T>> => {
    try {
      const res = await apiClient.post<T>(url, data, config);
      return toOk(res);
    } catch (e) {
      return toErr(e as AxiosError);
    }
  },

  put: async <T>(
    url: string,
    data?: any,
    config?: Parameters<typeof apiClient.put>[2]
  ): Promise<ApiResult<T>> => {
    try {
      const res = await apiClient.put<T>(url, data, config);
      return toOk(res);
    } catch (e) {
      return toErr(e as AxiosError);
    }
  },

  // Allow DELETE requests to carry a body (bulk delete)
  delete: async <T>(
    url: string,
    config?: Parameters<typeof apiClient.delete>[1] & { data?: any }
  ): Promise<ApiResult<T>> => {
    try {
      const res = await apiClient.delete<T>(url, config);
      return toOk(res);
    } catch (e) {
      return toErr(e as AxiosError);
    }
  },

  // PATCH helper supports partial updates
  patch: async <T>(
    url: string,
    data?: any,
    config?: Parameters<typeof apiClient.patch>[2]
  ): Promise<ApiResult<T>> => {
    try {
      const res = await apiClient.patch<T>(url, data, config);
      return toOk(res);
    } catch (e) {
      return toErr(e as AxiosError);
    }
  },
};
