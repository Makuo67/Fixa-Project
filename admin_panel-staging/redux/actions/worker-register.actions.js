import { retriveAuthTokenFromLocalStorage } from "../../helpers/auth";
import {
  WORKER_REGISTER_REQUESTED,
  WORKER_REGISTER_LOADING,
  WORKER_REGISTER_ERROR,
} from "../constants/register-worker.constants";
import workerService from "../services/worker-register.service";

export const postWorkers = (data) => async (dispatch) => {
  dispatch({ type: WORKER_REGISTER_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workerService.postWorker(data, token);
    dispatch({
      type: WORKER_REGISTER_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: WORKER_REGISTER_ERROR, payload: err?.response?.status });
    return Promise.reject(err);
  }
};
