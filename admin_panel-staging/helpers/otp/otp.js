import { retriveAuthTokenFromLocalStorage } from "../auth";
import fixaAPI from "../api"
import { notification } from "antd";

export const getOtpTypes = async () => {
    let responses = []
    try {
  
      let authorization = await retriveAuthTokenFromLocalStorage();
      responses = await fixaAPI.get(`opt-verification-types`, {
        headers: { authorization },
      });
      return responses?.data;
    } catch (error) {
      if (error?.code === "ERR_NETWORK") {
        notification.warning({
          message: "NETWORK ERROR",
          description: "Connect to a Network and Try again",
        });
      } else if (error?.response?.data || error?.code === "ERR_BAD_REQUEST") {
        notification.error({
          message: "ERROR",
          description: `${error?.response?.data?.error}`,
        });
      }
      return responses;
    }
  }