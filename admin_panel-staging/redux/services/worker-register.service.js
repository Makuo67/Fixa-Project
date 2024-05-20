import axios from "axios";

if (process.browser) {
  // token = localStorage.getItem("token");
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

class WorkerService {
  postWorker(data, token) {
    const authorization = token;
    return http.post(`/service-providers`, data, {
      headers: { authorization },
    });
  }
}

export default new WorkerService();
