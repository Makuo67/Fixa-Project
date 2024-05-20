import { retriveAuthTokenFromLocalStorage } from "../auth";
import fixaAPI from "../api"
import { notification } from "antd";

export const requestNewWallet = async (payload) => {
    let response = []
    try {
  
      let authorization = await retriveAuthTokenFromLocalStorage();
      response = await fixaAPI.post(`wallet-requests/create-request`, payload, {
        headers: { authorization },
      });
      return response.data;
    } catch (error) {
      if(error?.response){
        return error.response.data
      } else if (error?.code === "ERR_NETWORK") {
        notification.warning({
          message: "NETWORK ERROR",
          description: "Connect to a Network and Try again",
        });
      } else if (error?.response?.data || error?.code === "ERR_BAD_REQUEST") {
        // notification.error({
        //   message: "ERROR",
        //   description: `${error?.response?.data?.message}`,
        // });
      }
      return response;
    }
  }

  export const getWalletrequestStatus = async () => {
    let response = []
    try {
  
      let authorization = await retriveAuthTokenFromLocalStorage();
      response = await fixaAPI.get(`wallet-requests/`, {
        headers: { authorization },
      });
      return response.data;
    } catch (error) {
      if (error?.code === "ERR_NETWORK") {
        notification.warning({
          message: "NETWORK ERROR",
          description: "Connect to a Network and Try again",
        });
      } else if (error?.response?.data || error?.code === "ERR_BAD_REQUEST") {
        notification.error({
          message: "ERROR",
          description: `${error?.response?.data?.message}`,
        });
      }
      return response;
    }
  }