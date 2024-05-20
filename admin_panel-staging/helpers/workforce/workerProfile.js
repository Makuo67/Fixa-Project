import fixaAPI from "../api";
import { retriveAuthTokenFromLocalStorage } from "../auth";
import { notification } from "antd";

/* ============== EDIT WORKER PROFILE  ============== */
export const editWorkerProfile = async (worker_id, payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.put(`/app/service-providers/${worker_id}`, payload, {
      headers: { authorization },
    });

    notification.success({
      message: "SUCCESS",
      description: `${responses?.data?.message}`,
    });

    return responses?.data;
  } catch (err) {
    notification.error({
      message: "Failed",
      description: `${err?.response?.data?.message}`,
    });

    return err?.response?.data;
  }
};