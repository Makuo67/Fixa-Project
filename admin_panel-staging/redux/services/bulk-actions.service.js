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

class BulkActionsService {
  sendSMS(payload, token) {
    const authorization = token;
    return http.post(`/worker/app/sms`, payload, {
      headers: { authorization },
    });
  }
  assignToProject(payload, token) {
    const authorization = token;
    return http.post(`/worker/app/assign`, payload, {
      headers: { authorization },
    });
  }
  unassignFromProject(payload, token) {
    const authorization = token;
    return http.post(`/worker/app/unassign`, payload, {
      headers: { authorization },
    });
  }
  discardWorkers(payload) {
    const authorization = token;
    return http.post(`/temp-workers-tables/discard`, payload, {
      headers: { authorization },
    });
  }
}

export default new BulkActionsService();
