import axios from "axios";

if (process.browser) {
  // token = localStorage.getItem("token");
}

// console.log("---my toks", token);

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

class smsService {
  getSMSLogs(token) {
    const authorization = token;
    console.log(`/sms-logs/`);
    return http.get(`/sms-logs/`, {
      headers: { authorization },
    });
  }
  getWeeklySMS(token) {
    const authorization = token;
    console.log(`/value-propositions/`);
    return http.get(`/value-propositions?_limit=1`, {
      headers: { authorization },
    });
  }
  editWeeklySMS(id, message, token) {
    const authorization = token;
    console.log(`/value-propositions/${id}`, message);
    return http.put(
      `/value-propositions/${id}`,
      {
        message: message,
      },
      {
        headers: { authorization },
      }
    );
  }
  sendWeeklySMS(token) {
    const authorization = token;
    console.log(`/weekly-sms`, "weekly message send");
    return http.post(`/weekly-sms`, {
      headers: { authorization },
    });
  }
}

export default new smsService();
