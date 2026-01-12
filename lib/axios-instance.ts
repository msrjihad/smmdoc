import axios from "axios";
import { logger } from "./utils/logger";

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
  }
  return process.env.NEXT_PUBLIC_APP_URL;
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 60000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    logger.apiRequest(
      config.method?.toUpperCase() || 'GET',
      config.url || '',
      { baseURL: config.baseURL }
    );

    config.withCredentials = false;

    if (config.url && config.url.startsWith('/api/')) {
      config.baseURL = getBaseUrl();
    }

    return config;
  },
  (error) => {
    logger.apiError('REQUEST', error.config?.url || 'unknown', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    logger.apiResponse(
      response.status,
      response.config.url || '',
      { method: response.config.method }
    );
    return response;
  },
  (error) => {
    const url = error.config?.url || 'unknown';
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    
    if (error.response) {
      logger.apiError(method, url, error, {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      logger.apiError(method, url, new Error('Network error - no response received'), {
        request: error.request,
      });
    } else {
      logger.apiError(method, url, error, {
        message: error.message,
      });
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
