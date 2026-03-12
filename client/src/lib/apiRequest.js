import axios from "axios";

const apiRequest = axios.create({
  baseURL: process.env.VITE_API_URL || "http://localhost:8800/api",
  withCredentials: true,
});

export default apiRequest;