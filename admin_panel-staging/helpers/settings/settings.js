import { retriveAuthTokenFromLocalStorage } from "../auth";
import fixaAPI from "../api";
import queryString from "query-string";
import { notification } from "antd";

export const getAllUsers = async () => {
  const parsed = queryString.parse(location.search);
  delete parsed.tab;
  const stringified = "&" + queryString.stringify(parsed);

  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(
      `user-admin-accesses/all_users?_limit=-1` + stringified,
      {
        headers: { authorization },
      }
    );
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};
export const getCompanyInfo = async () => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(`companies`, {
      headers: { authorization },
    });
    return response.data;
  } catch (e) {
    console.log(e.message);
  }
};

export const createSupervisor = async (payload) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.post(`auth/local/register`, payload, {
      headers: { authorization },
    });
    notification.success({
      message: "Success",
      description: "Supervisor Created",
    });
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};
export const deleteSettingsSupervisor = async (payload) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.delete(`users/${payload.user_id}`, {
      headers: { authorization },
    });
    return response.data;
  } catch (e) {
    console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};
export const updateSettingsSupervisor = async (payload) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.put(`users/${payload.user_id}`, payload, {
      headers: { authorization },
    });
    notification.success({
      message: "Success",
      description: "Supervisor Updated",
    });
    return response.data;
  } catch (e) {
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};

export const submitJobTitle = async (jobTitle) => {
  if (jobTitle.length == "") {
    return [];
  }

  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.post(`titles`,
      {
        "title_name": jobTitle,
      }
      , {
        headers: { authorization },
      });
    if (response.status == 200) {
      notification.success({
        message: "Success",
        description: "Job position created successfully",
      })
      return response.data;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
};

/* ====================== UPDATE USER ACCESS ======================== */ 
export const updateUserAccess = async (userId,payload) => {
  try {
    const body = {
      "user_access": payload
    }

    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.put(`user-admin-accesses/edit_user_access/${userId}`, body, {
      headers: { authorization },
    });
    notification.success({
      message: "Success",
      description: `${response.data.message}`,
    });
    return response.data;
  } catch (e) {
    // console.log(e);
    notification.error({
      message: `Failed`,
      description: `${e?.message}`,
    });
  }
};

/* ====================== GET ACCESS LEVELS ======================== */ 
export const getAccessLevels = async () => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = await fixaAPI.get(`users-levels/access`,{
      headers: { authorization },
    });
    return response.data.data;
  } catch (e) {
    // console.log(e);
  }
};
