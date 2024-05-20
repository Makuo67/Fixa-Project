import axios from "axios";
import { get } from "idb-keyval";

if (process.browser) {
  // get("token").then((val) => token = val)
  // token = localStorage.getItem("token");
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

class workerProfileService {
  getWorkerProfile({ worker_id, project_id, token }) {
    const authorization = token;
    // console.log(`/worker/app/info/${worker_id} & project_id = {project_id}`);
    return http.get(`/worker/web/info/${worker_id}?project_id=${project_id}`, {
      headers: { authorization },
    });
  }

  getWorkerEducation(worker_id, token) {
    const authorization = token;
    // console.log(`/service-providers/${worker_id}`, "---get edu info");
    return http.get(`/service-providers/${worker_id}`, {
      headers: { authorization },
    });
  }
  getWorkHistory(worker_id, filters, token) {
    const authorization = token;
    if (filters)
      return http.get(`/worker/app/working_history/` + worker_id + filters, {
        headers: { authorization },
      });
    else
      return http.get(`/worker/app/working_history/` + worker_id, {
        headers: { authorization },
      });
  }
  getWorkerAssessement(worker_id, token) {
    const authorization = token;
    return http.get(`/workers-assessments/` + worker_id, {
      headers: { authorization },
    });
  }

  assessWorker(data, token) {
    const authorization = token;
    return http.post(`/workers-assessments/`, data, {
      headers: { authorization },
    });
  }

  editWorker(worker_id, data, token) {
    const authorization = token;
    return http.put(`/app/service-providers/${worker_id}`, data, {
      headers: { authorization },
    });
  }

  assignWorkerToProject(worker_id, project_id, token) {
    const authorization = token;
    return http.post(
      `/worker/app/sms`,
      {
        worker_id: [worker_id],
        project_id: project_id,
      },
      {
        headers: { authorization },
      }
    );
  }

  sendSMS(data, token) {
    const authorization = token;
    return http.post(`/worker/app/sms`, data, {
      headers: { authorization },
    });
  }

  verifyWorker(data, token) {
    const authorization = token;
    return http.post(`/service-providers/app/verify`, data, {
      headers: { authorization },
    });
  }
}

export default new workerProfileService();
