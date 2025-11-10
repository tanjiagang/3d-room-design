import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { setupInterceptors } from "./intersecptors";

// custom extended interface
interface GenshinRequestConfig extends AxiosRequestConfig {
  showLoading?: boolean;
  mockFallback?: boolean;
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 10000,
  headers: {
    'X-Client-Type': '-editor'
  },
});

setupInterceptors(service);

export default service;
export type { GenshinRequestConfig };