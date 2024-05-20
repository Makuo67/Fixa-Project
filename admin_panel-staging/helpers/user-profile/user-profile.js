import { retriveAuthTokenFromLocalStorage, userAccess } from "../auth";
import fixaAPI from "../api";
import { notification } from "antd";
import { hasHtmlTags } from "@/utils/regexes";

export const getUserInfo = async (user_id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(`/user-admin-accesses/user/${user_id}`, {
      headers: { authorization },
    });
    return response.data?.data;
  } catch (e) {
    console.log(e);
  }
};

/* ======= Get user access saas ====== */
export const getUserAccess = async () => {
  let response = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const results = await fixaAPI.get(`/user-admin-accesses/getUserProfile`, {
      headers: { authorization },
    });
    if (results?.data?.data) {
      // storing the user accessess
      if (results.data.data.user_profile) {
        userAccess(results.data.data.user_profile);
      }
      response = results.data
    }
    // return response.data?.data;
  } catch (e) {
    console.log(e);
    response = []
  }
  return response;
};

const ErrorMessage = ({ message }) => {
  return (
    <div dangerouslySetInnerHTML={{ __html: message }} />
  );
};

export const inviteUser = async (user) => {
  let response;
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    response = await fixaAPI.post(`/user-admin-accesses/invite_staff_members`, user, {
      headers: { authorization },
    });
    // console.log(response);
    if (response.data.statusCode == 200) {
      notification.success({
        message: "Success",
        description: response?.data?.message,
      })
    }
  } catch (err) {
    if (err?.response?.data?.statusCode == 400 && err?.response?.data?.message) {
      if (hasHtmlTags(err?.response?.data?.message)) {
        console.log(err?.response?.data?.message);
        notification.error({
          message: "Error",
          description: <ErrorMessage message={err?.response?.data?.message} />
        })

      } else {
        notification.error({
          message: "Error",
          description: err?.response?.data?.message,
        })
      }
    } else {
      notification.error({
        message: "Error",
        description: "Error happened inviting user",
      })
    }
    response = err;
  }
  return response;
};

export const updateProfile = async (user, id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.put(
      `/user-admin-accesses/edit_user/${id}`,
      user,
      {
        headers: { authorization },
      }
    );
    if (response.data.statusCode == 200) {
      notification.success({
        message: "Success",
        description: response?.data?.message,
      })
    }
    return response;
  } catch (err) {
    if (err?.response?.data?.statusCode == 400 && err?.response?.data?.message) {
      notification.error({
        message: "Error",
        description: err?.response?.data?.message,
      })
    } else {
      notification.error({
        message: "Error",
        description: err?.response?.data?.message,
      })
    }
    console.log(err);
  }
};

export const updateAvatar = async (avatar_url, id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.put(
      `user-admin-accesses/edit_user_avatar/${id}`,
      avatar_url,
      {
        headers: { authorization },
      }
    );
    return response;
  } catch (e) {
    console.log(e);
  }
};

export const updateCompanyInfo = async (info, id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.put(`/companies/${id}`, info, {
      headers: { authorization },
    });
    return response;
  } catch (e) {
    console.log(e);
  }
};

export const changePassword = async (credentials) => {
  let response;
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    response = await fixaAPI.post(
      `/user-admin-accesses/change_password`,
      credentials,
      {
        headers: { authorization },
      }
    );
    return response;
  } catch (e) {
    response = e;
    return response?.response;
  }
};
