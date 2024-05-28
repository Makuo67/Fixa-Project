import axios from "axios";

if (process.browser) {
  // get("token").then((val) => (token = val));
  // console.log("---my token", token);
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

class WorkforceService {
  getAll(filters, page, pageSize, token) {
    const authorization = token;

    // console.log(`/workforce/list` + filters);
    if (filters)
      return http.get(`/workforce/list` + filters, {
        headers: { authorization },
      });
    else
      return http.get(`/workforce/list`, {
        headers: { authorization },
      });
  }
  getCustomWorkforceList(filters, token) {
    const authorization = token;

    return http.get(`/custom/workforce/list` + filters, {
      headers: { authorization },
    });
  }
  getCustomWorkforceAggregates(token) {
    const authorization = token;

    return http.get(`/custom/workforce/aggregate`, {
      headers: { authorization },
    });
  }
  getProjects(token) {
    const authorization = token;

    return http.get(`/projects/list`, {
      headers: { authorization },
    });
  }
  getServices(token) {
    const authorization = token;
    return http.get(`/services`, {
      headers: { authorization },
    });
  }
  getDistricts(token) {
    const authorization = token;
    return http.get(`/districts`, {
      headers: { authorization },
    });
  }
  getProvinces(token) {
    const authorization = token;

    return http.get(`/provinces`, {
      headers: { authorization },
    });
  }
  getWorkersWithNames(token) {
    const authorization = token;
    return http.get(`/workforces/get_workers`, {
      headers: { authorization },
    });
  }
}

export default new WorkforceService();
