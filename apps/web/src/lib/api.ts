import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { getSession } from "next-auth/react";

import config from "@/config/client";

export type RequestConfig<TVariables = unknown> = {
  method:
    | "get"
    | "put"
    | "patch"
    | "post"
    | "delete"
    | "GET"
    | "PUT"
    | "PATCH"
    | "POST"
    | "DELETE";
  responseType?:
    | "arraybuffer"
    | "blob"
    | "document"
    | "json"
    | "text"
    | "stream";
  headers?: AxiosRequestConfig["headers"];
  signal?: AbortSignal;
  data?: TVariables;
  params?: unknown;
  url: string;
};

const apiUrl = config.apiUrl;

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

export const axiosClient = async <
  TData,
  TError = unknown,
  TVariables = unknown,
>(
  config: RequestConfig<TVariables>,
): Promise<AxiosResponse<TData, TError>> => {
  const promise = axiosInstance
    .request<TData>({ ...config })
    .then((res) => res)
    .catch((e: AxiosError<TError>) => {
      throw e;
    });

  return promise;
};
// Add a request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.idToken) {
      config.headers["Authorization"] = `Bearer ${session.idToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosClient;
