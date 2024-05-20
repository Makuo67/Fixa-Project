import { retriveAuthTokenFromLocalStorage } from "../auth";
import fixaAPI from "../api"
import { notification } from "antd";

export const updateWorkerPaymentMethods = async (id, payload) => {
    let responses = []
    try {
  
      let authorization = await retriveAuthTokenFromLocalStorage();
      responses = await fixaAPI.put(`service-providers/update-worker/${id}`, payload, {
        headers: { authorization },
      });
  
      // console.log("Response man", responses?.data)
  
      if (responses?.data.status === 200 || responses?.data.status === "success") {
        notification.success({
          message: "Success",
          description: "Worker Information Updated.",
        });
      } else if (responses?.data.status == 'failed') {
        notification.error({
          message: "ERROR",
          description: `${responses?.data?.error}`,
        });
      }
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

  
  export const getCompanyPaymentMethods = async () => {
    let responses = []
    try {
  
      let authorization = await retriveAuthTokenFromLocalStorage();
      responses = await fixaAPI.get(`companies/payment-methods`, {
        headers: { authorization },
      });
      return responses?.data?.data;
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
      return responses;
    }
  }
  export const getAllPaymentMethods = async () => {
    let responses = []
    try {
  
      let authorization = await retriveAuthTokenFromLocalStorage();
      responses = await fixaAPI.get(`payment-methods`, {
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
          description: `${error?.response?.data?.message}`,
        });
      }
      return responses;
    }
  }
