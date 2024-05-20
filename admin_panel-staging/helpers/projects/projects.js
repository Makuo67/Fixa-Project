import fixaAPI from "../api";
import { retriveAuthTokenFromLocalStorage } from "../auth";
import { notification } from "antd";

/* ============== GET PROJECTS Page  ============== */
export const getProjectsDetails = async () => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`projects/all`, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return [];
  }
};
/* ====================== CLIENTS ===================================== */
/* ============== GET CLIENTS  ============== */
export const getClients = async () => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    var dataResponse = await fixaAPI.get(`custom/clients`, {
      headers: { authorization },
    });
    if (dataResponse?.data?.data) {
      responses = dataResponse?.data?.data;
    }
    return responses;
  } catch (err) {
    // if (err?.code === "ERR_NETWORK") {
    //   console.log("NETWORK ERROR");
    // } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
    //   console.log("BAD REQUEST");
    // }
    return [];
  }
};

/* ============== GET Active CLIENTS  ============== */
export const getActiveClients = async () => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    var dataResponse = await fixaAPI.get(`custom/clients?isActive=true`, {
      headers: { authorization },
    });
    if (dataResponse?.data?.data) {
      responses = dataResponse?.data?.data.filter((item) => item.isActive === true);
    }
    return responses;
  } catch (err) {
    console.log("error in getActiveClients", err.message);
    return [];
  }
};
/* ============== GET CLIENTS USERS  ============== */
export const getClientsUsers = async () => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`client-users`, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return [];
  }
};

/* ======================= CREATE CLIENT ================================ */
export const createClient = async (payload) => {
  let result = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    result = await fixaAPI.post(`clients`, payload, {
      headers: { authorization },
    });
    notification.success({
      message: "Success",
      description: `Client registered successfully.`,
    });
    return result?.data;
  } catch (err) {
    // console.log(err);
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};

/* ======================= EDIT CLIENT ================================ */
export const editClient = async (clientId, payload) => {
  let result = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    result = await fixaAPI.put(`clients/${clientId}`, payload, {
      headers: { authorization },
    });
    notification.success({
      message: "Success",
      description: `Client updated successfully.`,
    });
    return result?.data;
  } catch (err) {
    console.log(err);
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};
/* ======================= DELETE CLIENT ================================ */
export const deleteClient = async (clientId) => {
  let result = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    result = await fixaAPI.delete(`custom/clients/${clientId}`, {
      headers: { authorization },
    });
    notification.success({
      message: "Success",
      description: result?.data?.message,
    });
    return result?.data;
  } catch (err) {
    console.log(err);
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};

/* ======================= CHANGE CLIENT STATUS ================================ */
export const clientStatus = async (clientId, status) => {
  let result = [];
  let payload = {
    status: status
  }
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    result = await fixaAPI.put(`custom/clients/${clientId}`, payload, {
      headers: { authorization },
    });
    notification.success({
      message: "Success",
      description: result?.data?.message,
    });
    return result?.data;
  } catch (err) {
    console.log(err);
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};


/* ====================== END CLIENTS ===================================== */

/* ============== GET FIXA MANAGERS  ============== */
export const getFixaManagers = async () => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`user-admin-accesses/all_users`, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return [];
  }
};


/* ================= SEARCH PROJECT ================ */
export const searchProject = (query, array) => {
  /**
   * @query string to search
   * @array array of objects to search from
   */
  let results = [];
  for (var i = 0; i < array.length; i++) {
    // Looping in the array
    if (array[i] && query.length > 0) {
      // Normalize both query and data in the array & push results into the results.
      if (array[i].name.toLowerCase().includes(query.toLowerCase())) {
        results.push(array[i]);
      }
    } else {
      return results;
    }
  }
  return results;
};

/* ============== ADD PROJECT ============== */
export const createProject = async (payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(`projects/create-project`, payload, {
      headers: { authorization },
    });
    if (responses?.data) {
      notification.success({
        message: "SUCCESS",
        description: "New Project Created Successfully!",
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: "Project Addition Failed!",
      });
    }
    return responses;
  }
};
/* ============== EDIT PROJECT ============== */
export const editProject = async (id, payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.put(`projects/update-project/${id}`, payload, {
      headers: { authorization },
    });
    if (responses?.data) {
      notification.success({
        message: "SUCCESS",
        description: "Project Edited Successfully!",
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: "Project Editing Failed!",
      });
    }
    return responses;
  }
};

export const getSingleProjectDetails = async (project_id) => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`app/projects/${project_id}`, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};
export const getRatesServices = async (project_id) => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`app/services/${project_id}/rates`, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};
export const getEarningsServices = async (project_id) => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`app/services/${project_id}/earnings`, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};
export const createRate = async (project_id, rates_body) => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(
      `app/${project_id}/rates/initial`,
      rates_body,
      {
        headers: { authorization },
      }
    );
    if (responses?.data) {
      notification.success({
        message: `Success`,
        description: `Rate Added`,
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.response?.status === 400 || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `Failed`,
        description: `Enter Service name and value to add rate`,
      });
    } else if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};
export const createEarnings = async (project_id, rates_body) => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(
      `app/${project_id}/rates/earnings`,
      rates_body,
      {
        headers: { authorization },
      }
    );
    if (responses?.data) {
      notification.success({
        message: `Success`,
        description: `Earnings Added`,
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.response?.status === 400 || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `Failed`,
        description: `${err?.response?.data?.message}`,
      });
    } else if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};

export const deleteRate = async (rate_id) => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.delete(`rates/${rate_id}`, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};

export const transformRatesObject = (input) => {
  const output = [];
  for (let i = 0; i < Object.keys(input).length / 2; i++) {
    output.push({
      service_id: input[`service_id_${i}`],
      maximum_rate: input[`maximum_rate_${i}`],
    });
  }
  return output;
};

export const transformEarningsObject = (input) => {
  const output = [];
  for (let i = 0; i < Object.keys(input).length / 4; i++) {
    output.push({
      service_id: input[`service_id_${i}`],
      beginner_rate: input[`beginner_rate_${i}`],
      intermediate_rate: input[`intermediate_rate_${i}`],
      advanced_rate: input[`advanced_rate_${i}`],
    });
  }
  return output;
};

/* ============ Exctract Shift Ids from array of objects ============= */
export const extractShiftIds = (arr) => {
  if (!arr) {
    return [];
  } else if (Array.isArray(arr)) {
    return arr.map((obj) => parseInt(obj.id.toString()));
  } else {
    const arr1 = arr.split(",");
    return arr1.map((obj) => parseInt(obj));
  }
};

/* ============== ADD NEW CLIENT ============== */

export const getIndustryTypes = async () => {
  let result = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    result = await fixaAPI.get(`industry-types`, {
      headers: { authorization },
    });
    return result?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return [];
  }
};

export const getCountries = async () => {
  let result = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    result = await fixaAPI.get(`countries?show=true&_limit=-1`, {
      headers: { authorization },
    });
    return result?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return [];
  }
};

/**
 * Fetches all countries from the API.
 * @returns {Promise<Array>} Array of countries
 */
export const getAllCountries = async () => {
  let result = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    result = await fixaAPI.get(`countries?_limit=-1`, {
      headers: { authorization },
    });
    return result?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return [];
  }
};

/* ============== GET PROVINCES  ============== */
export const getProvinces = async (country) => {
  let result = [];
  let params = country ? `?country=${country}` : "";
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    result = await fixaAPI.get(`provinces${params}`, {
      headers: { authorization },
    });
    return result?.data;
  } catch (err) {
    // if (err?.code === "ERR_NETWORK") {
    //   console.log("NETWORK ERROR");
    // } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
    //   console.log("BAD REQUEST");
    // }
    return [];
  }
};

export const saveClient = async (payload) => {
  console.log(payload);
  let result = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    result = await fixaAPI.post(`clients/app`, payload, {
      headers: { authorization },
    });
    notification.success({
      message: "Success",
      description: "Client Added successfuly",
    });
    return result?.data;
  } catch (err) {
    console.log(err);
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};

export const updateProjectStatus = async (project_id, payload) => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.put(`projects/${project_id}`, payload, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
};

export const getProjectAttendances = async (filters) => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    responses = await fixaAPI.get(`attendance-pages/new_attendance_list` + filters, {
      headers: { authorization },
    });

    return responses?.data?.data;
  } catch (err) {
    console.log("err", err);
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
}
export const getAttendanceDetails = async (id) => {
  let responses = [];

  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`attendance-pages/new_app/${id}`, {
      headers: { authorization },
    });
    return responses?.data?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
  return responses;
}
export const ApproveDeclineAttendance = async (id, payload) => {
  let responses = [];

  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.put(`attendance-statuses/app/${id} `, payload, {
      headers: { authorization },
    });
    return responses?.data?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.error({
        message: `NETWORK ERROR`,
        description: `${err?.message}`,
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: `BAD REQUEST`,
        description: `${err?.message}`,
      });
    }
    return [];
  }
  return responses;
}
