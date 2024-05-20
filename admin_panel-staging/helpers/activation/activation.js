import { retriveAuthTokenFromLocalStorage } from "../auth";
import fixaAPI from "../api";
import queryString from "query-string";
import notification from "../../components/Error/Notification";

export const sendForgetEmail = async (email) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const response = fixaAPI.post(`user-admin-accesses/forgot_password`, {
      "email": `${email}`
    })
    return response;
  }
  catch (error) {
    notification.error({
      message: "Failed",
      description: `Your Email was not sent! due to ${error.message}, Try again`
    })
    return false;
  }
}
/* =================== RESET THE PASSWORD =============== */
export const resetPassword = async (payload) => {
  try {
    const data = {
      "new_password": `${payload.password}`,
      "confirm_password": `${payload.passwordConfirmation}`,
      "token": `${payload.resetPasswordToken}`,
      "email": `${payload.email}`
    }
    const response = fixaAPI.post(`user-admin-accesses/reset_password`,
      data,
    );
    return response;
  }
  catch (error) {
    console.log('error-resetPassword()', error);
    return false;
  }
}
