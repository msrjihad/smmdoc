import axios from "axios";

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
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);

    config.withCredentials = false;

    if (config.url && config.url.startsWith('/api/')) {
      config.baseURL = getBaseUrl();
      console.log(`Using base URL: ${config.baseURL} for API request`);
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("Response error:", error);
    if (error.response) {


      console.error("Error data:", error.response.data);
      console.error("Error status:", error.response.status);
      console.error("Error headers:", error.response.headers);
    } else if (error.request) {

      console.error("Error request:", error.request);
    } else {

      console.error("Error message:", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
