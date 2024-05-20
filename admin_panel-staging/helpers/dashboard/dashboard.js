import queryString from "query-string";
import { retriveAuthTokenFromLocalStorage } from "../auth";
import fixaAPI from "../api"

/* ============== GET PROJECTS  ============== */
export const getDashboardProject = async () => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    
    responses = await fixaAPI.get(`projects/list`, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
       // Log metrics
      } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      // Log metrics
    }
    return [];
  }
};

/* ============== GET DASHBOARD METRICS  ============== */
/**
 * Get dashboard metrics data
 * @param {object} body - The body of the request
 * @param {string} token - The authorization token
 * @returns {Promise<object>} The response data
 */
export const getDashboardMetrics = async (body, token) => {
  try {
    let authorization = '';
    if(token){
      authorization =  `Bearer ${token}`;
    } else {
      authorization = await retriveAuthTokenFromLocalStorage();
    }
    const response = await fixaAPI.post(`/admin-dashboard/aggregates`, body, {
      headers: { authorization },
    });
    return response.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      // Log metrics
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      // Log metrics
    }
    return [];
  }
};

export const getActiveProjects = async () => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(`app/projects?progress_status=ongoing`, {
      headers: { authorization },
    });
    return response.data;
  } catch (e) {
    console.log(e);
  }
};
