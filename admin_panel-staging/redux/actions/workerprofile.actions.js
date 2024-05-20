import {
  WORKERPROFILE_ERROR,
  WORKERPROFILE_LOADING,
  WORKERPROFILE_REQUESTED,
  WORKHISTORY_REQUESTED,
  WORKERASSESSMENT_REQUESTED,
  WORKEREDUCATION_REQUESTED,
} from "../constants/workerprofile.constants";
import workerprofileService from "../services/workerprofile.service";
import { notification } from "antd";
import { retriveAuthTokenFromLocalStorage } from "../../helpers/auth";

export const GetWorkerProfile = (worker_id, project_id) => async (dispatch) => {
  dispatch({ type: WORKERPROFILE_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workerprofileService.getWorkerProfile({
      worker_id,
      project_id,
      token,
    });
    dispatch({
      type: WORKERPROFILE_REQUESTED,
      payload: res.data.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: WORKERPROFILE_ERROR, payload: err.response.status });
    return Promise.reject(err);
  }
};

export const GetWorkerEduInfo = (worker_id) => async (dispatch) => {
  dispatch({ type: WORKERPROFILE_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workerprofileService.getWorkerEducation(worker_id, token);
    dispatch({
      type: WORKEREDUCATION_REQUESTED,
      payload: res.data,
    });
    // console.log(res.data, "--my edu--information--");
    return Promise.resolve(res.data.data);
  } catch (err) {
    dispatch({ type: WORKERPROFILE_ERROR, payload: err.response?.status });
    return Promise.reject(err);
  }
};

export const GetWorkHistory = (worker_id, filters) => async (dispatch) => {
  dispatch({ type: WORKERPROFILE_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workerprofileService.getWorkHistory(
      worker_id,
      filters,
      token
    );
    dispatch({
      type: WORKHISTORY_REQUESTED,
      payload: res.data.data,
    });
    // console.log(res.data.data, "---am i getting worker hist--");
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: WORKERPROFILE_ERROR, payload: err.response?.status });
    return Promise.reject(err);
  }
};

export const GetWorkerAssessment = (worker_id) => async (dispatch) => {
  dispatch({ type: WORKERPROFILE_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workerprofileService.getWorkerAssessement(
      worker_id,
      token
    );
    dispatch({
      type: WORKERASSESSMENT_REQUESTED,
      payload: res.data,
    });
    // console.log(res.data, "---am i getting worker assess--");
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: WORKERPROFILE_ERROR, payload: err.response.status });
    return Promise.reject(err);
  }
};

export const assessWorker = (data) => async (dispatch) => {
  dispatch({ type: WORKERPROFILE_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workerprofileService.assessWorker(data, token);
    dispatch({
      type: WORKERPROFILE_REQUESTED,
      payload: res.data,
    });
    notification.success({
      message: "Success",
      description: `Worker assessed`,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: WORKERPROFILE_ERROR, payload: err?.response?.status });
    notification.error({
      message: "Error",
      description: `Worker not assessed`,
    });
    return Promise.reject(err);
  }
};

export const editWorker = (worker_id, data) => async (dispatch) => {
  // dispatch({ type: WORKERPROFILE_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workerprofileService.editWorker(worker_id, data, token);
    dispatch({
      type: WORKERPROFILE_LOADING,
      payload: res.data,
    });
    notification.success({
      message: "Success",
      description: `Worker Info Edited`,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: WORKERPROFILE_ERROR, payload: err?.response?.status });
    notification.error({
      message: "Error",
      description: `Error: worker info not edited`,
    });
    return Promise.reject(err);
  }
};

export const assignWorkerToProject =
  (worker_id, project_id) => async (dispatch) => {
    dispatch({ type: WORKERPROFILE_LOADING });
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await workerprofileService.assignWorkerToProject(
        worker_id,
        project_id,
        token
      );
      dispatch({
        type: WORKERPROFILE_REQUESTED,
        payload: res.data,
      });
      // console.log(res.data, "---did i assign worker--");
      return Promise.resolve(res.data);
    } catch (err) {
      dispatch({ type: WORKERPROFILE_ERROR, payload: err?.response?.status });
      return Promise.reject(err);
    }
  };

export const sendSMS = (data) => async (dispatch) => {
  dispatch({ type: WORKERPROFILE_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workerprofileService.sendSMS(data, token);
    dispatch({
      type: WORKERPROFILE_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: WORKERPROFILE_ERROR, payload: err?.response?.status });
    return Promise.reject(err);
  }
};

export const verifyWorker = (data) => async (dispatch) => {
  dispatch({ type: WORKERPROFILE_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workerprofileService.verifyWorker(data, token);
    dispatch({
      type: WORKERPROFILE_REQUESTED,
      payload: res.data,
    });
    notification.success({
      message: "Success",
      description: `Worker has been verified`,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: WORKERPROFILE_ERROR, payload: err?.response?.status });
    notification.error({
      message: "Error",
      description: `Error happened in Worker verification`,
    });
    return Promise.reject(err);
  }
};
