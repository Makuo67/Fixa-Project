import axios from "axios";

if (process.browser) {
  // get("token").then((val) => (token = val));
  // token = localStorage.getItem("token");
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

class UserService {
  login(credentials) {
    return http.post(`/otp-verifications/verify-otp-login`, credentials);
  }

  getBalance(token) {
    const authorization = token;

    return http.get(`/app/payroll-details/momo/balance`, {
      headers: { authorization },
    });
  }
}

export default new UserService();
