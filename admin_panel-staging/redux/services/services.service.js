import axios from "axios";
var token = null;

if (process.browser) {
  // token = localStorage.getItem('token');
}
const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

class ServicesService {
  getServices(token) {
    const authorization = token;

    return http.get(`services`, { headers: { authorization } });
  }
  postService(token, payload) {
    const authorization = token;

    return http.post(`services`, payload, { headers: { authorization } });
  }
  
  getDistricts(token) {
    const authorization = token;

    return http.get(`districts`, { headers: { authorization } });
  }
}

export default new ServicesService();
