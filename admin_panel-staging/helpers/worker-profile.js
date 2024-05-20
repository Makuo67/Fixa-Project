import fixaAPI from "../helpers/api";
import { retriveAuthTokenFromLocalStorage } from "./auth";

export const getWorkerServices = (workerServices, downloadData) => {
  const filteredServices = [];
  const checkForMatch = (service) => {
    for (var i = 0; i < downloadData?.length; i++) {
      if (
        downloadData[i]?.service?.name?.toUpperCase()?.substring(0, 4) ===
        service?.name?.toUpperCase().substring(0, 4)
      ) {
        filteredServices.push(service);
      }
    }
  };
  var i, j;
  for (i = 0; i < workerServices?.length; i++) {
    checkForMatch(workerServices[i]);
  }
  const uniqueService = filteredServices.filter((element) => {
    const isDuplicate = filteredServices.includes(element?.id);

    if (!isDuplicate) {
      filteredServices.push(element?.id);

      return true;
    }

    return false;
  });

  return uniqueService;
};

export const buildColumns = (antdColumns) => {
  // let headers = [];
  // for (let index = 0; index < antdColumns.length; index++) {
  //     let json_data = {};
  //     json_data['label'] = antdColumns[index];
  //     json_data['key'] = antdColumns[index];
  //     headers.push(json_data);
  // }
  // return headers;
};
export const fetchWorkHistory = async (worker_id, pageStrt, project_id) => {
  try {
    if (pageStrt) {
      if (project_id) {
        const authorization = await retriveAuthTokenFromLocalStorage();
        // console.log(authorization, "--show token");
        const response = await fixaAPI.get(
          `worker/app/working_history/` +
          worker_id +
          `?_start=${pageStrt}&_limit=-1&project_id=${project_id}`,
          { headers: { authorization } }
        );
        return response.data.data;
      }
    }
    if (project_id) {
      const authorization = await retriveAuthTokenFromLocalStorage();
      // console.log(authorization, "--show token");

      const response = await fixaAPI.get(
        `worker/app/working_history/` +
        worker_id +
        `?_limit=-1&project_id=${project_id}`,
        { headers: { authorization } }
      );

      return response.data.data;
    }
    const authorization = await retriveAuthTokenFromLocalStorage();
    // console.log("((((((", authorization);
    const response = await fixaAPI.get(
      `worker/app/working_history/` + worker_id + `?_limit=-1`,
      { headers: { authorization } }
    );

    return response.data.data;
  } catch (error) {
    let message;
    message = error.message;
    // Log metric;
  }
};

export const fetchWorkHistoryWithProjectFilter = async ({
  worker_id,
  filter,
  pageStrt,
  limitSize,
}) => {
  try {
    if (filter?.length !== 0 && typeof filter !== "undefined") {
      // console.log("filters in dispatch", filter);
    }

    if (filter?.length !== 0 && typeof filter !== "undefined") {
      const authorization = await retriveAuthTokenFromLocalStorage();
      const response = await fixaAPI.get(
        `worker/app/working_history/` +
        worker_id +
        `?_limit=${limitSize}` +
        filter,
        { headers: { authorization } }
      );
      const req =
        `worker/app/working_history/` +
        worker_id +
        `?_limit=${limitSize}` +
        filter;

      return response.data.data;
    }

    const response = await fixaAPI.get(
      `worker/app/working_history/` + worker_id + `?_limit=${limitSize}`,
      { headers: { authorization } }
    );
    const req =
      `worker/app/working_history/` + worker_id + `?_limit=${limitSize}`;

    return response.data.data;
  } catch (error) {
    let message;
    message = error.message;
  }
};

export const fetchTotalWorkHistory = async (worker_id, filter) => {
  try {
    if (filter?.length !== 0 && typeof filter !== "undefined") {
      const authorization = await retriveAuthTokenFromLocalStorage();
      const response = await fixaAPI.get(
        `worker/app/working_history/` + worker_id + `?_limit=-1` + filter,
        { headers: { authorization } }
      );
      return response.data.data;
    }
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `worker/app/working_history/` + worker_id,
      { headers: { authorization } }
    );

    return response.data.data;
  } catch (error) {
    let message;
    message = error.message;
  }
};

export const fetchProfile = async (worker_id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `/worker/web/info/${worker_id}`,
      { headers: { authorization } }
    );
    return response.data.data;
  } catch (error) {
    let message;
    message = error.message;
  }
};

export const getTotalRate = (skill_rate, knowledge_rate, attitude_rate) => {
  let total_rate;
  if (
    skill_rate === "Beginner" &&
    knowledge_rate === "Beginner" &&
    (attitude_rate === "Beginner" ||
      attitude_rate === "Intermediate" ||
      attitude_rate === "Advanced")
  )
    total_rate = "Beginner";
  if (
    skill_rate === "Beginner" &&
    (knowledge_rate === "Intermediate" || knowledge_rate === "Advanced") &&
    attitude_rate === "Beginner"
  )
    total_rate = "Beginner";
  if (
    (skill_rate === "Intermediate" || skill_rate === "Advanced") &&
    knowledge_rate === "Beginner" &&
    attitude_rate === "Beginner"
  )
    total_rate = "Beginner";

  //Intermediate
  if (
    skill_rate === "Intermediate" &&
    knowledge_rate === "Intermediate" &&
    (attitude_rate === "Intermediate" ||
      attitude_rate === "Beginner" ||
      attitude_rate === "Advanced")
  )
    total_rate = "Intermediate";
  if (
    skill_rate === "Intermediate" &&
    (knowledge_rate === "Beginner" || knowledge_rate === "Advanced") &&
    attitude_rate === "Intermediate"
  )
    total_rate = "Intermediate";
  if (
    (skill_rate === "Beginner" || skill_rate === "Advanced") &&
    knowledge_rate === "Intermediate" &&
    attitude_rate === "Intermediate"
  )
    total_rate = "Intermediate";

  //Advanced
  if (
    skill_rate === "Advanced" &&
    knowledge_rate === "Advanced" &&
    (attitude_rate === "Advanced" ||
      attitude_rate === "Beginner" ||
      attitude_rate === "Intermediate")
  )
    total_rate = "Advanced";
  if (
    skill_rate === "Advanced" &&
    (knowledge_rate === "Beginner" || knowledge_rate === "Intermediate") &&
    attitude_rate === "Advanced"
  )
    total_rate = "Advanced";
  if (
    (skill_rate === "Beginner" || skill_rate === "Intermediate") &&
    knowledge_rate === "Advanced" &&
    attitude_rate === "Advanced"
  )
    total_rate = "Advanced";

  return total_rate;
};

/* ============== GET worker history ============== */
export const getWorkerHistory = async (worker_id, params) => {
  let responses = [];

  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    let url = `worker/app/working_history/${worker_id}?_limit=-1`;
    if (params && params.length > 0) {
      url += `${params}`;
    }
    responses = await fixaAPI.get(url, {
      headers: { authorization },
    });
    console.log(responses, "responses history");
    return responses.data.data;
  } catch (err) {
    console.log("ERROR IN GETTING WORKER HISTORY", err);
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return responses;
  }
};

/* ============ GET Worker payment methods */
export const getWorkerPaymentMethod = async (worker_id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `service-providers/${worker_id}`,
      { headers: { authorization } }
    );

    return response.data;
  } catch (error) {
    let message;
    message = error.message;
  }
};
