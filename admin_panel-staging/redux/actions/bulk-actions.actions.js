import { retriveAuthTokenFromLocalStorage } from "../../helpers/auth";
import bulkActionsService from "../services/bulk-actions.service";

export const sendSMS = (workers, message) => async (dispatch) => {
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await bulkActionsService.sendSMS(
      { worker_phones: workers, message: message },
      token
    );
    return Promise.resolve(res.data);
  } catch (err) {
    if (err?.response?.status === 403) {
      notification.error({
        message: "Failed",
        description: `Insufficient funds`,
      });
    }
    return Promise.reject(err);
  }
};
export const assignToProject =
  (worker_ids, project_id, start_date, end_date, shift_type) =>
  async (dispatch) => {
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await bulkActionsService.assignToProject(
        {
          worker_ids,
          project_id,
          start_date,
          end_date,
          shift_type,
        },
        token
      );
      return Promise.resolve(res.data);
    } catch (err) {
      return Promise.reject(err);
    }
  };
export const unassignFromProject =
  (worker_ids, project_id) => async (dispatch) => {
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await bulkActionsService.unassignFromProject(
        {
          worker_ids,
          project_id,
        },
        token
      );
      return Promise.resolve(res.data);
    } catch (err) {
      return Promise.reject(err);
    }
  };
export const discardWorkers = (data) => async (dispatch) => {
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await bulkActionsService.discardWorkers(data, token);
    return Promise.resolve(res.data);
  } catch (err) {
    return Promise.reject(err);
  }
};
