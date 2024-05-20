import { notification } from "antd";
import { retriveAuthTokenFromLocalStorage } from "../../helpers/auth";
import {
  SMSLOGS_ERROR,
  SMSLOGS_LOADING,
  SMSLOGS_REQUESTED,
  WEEKLYSMS_REQUESTED,
} from "../constants/sms.constants";
import smsService from "../services/sms.service";

export const GetSMSLogs = () => async (dispatch) => {
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await smsService.getSMSLogs(token);
    dispatch({
      type: SMSLOGS_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    return Promise.reject(err);
  }
};

export const GetWeeklySMS = () => async (dispatch) => {
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await smsService.getWeeklySMS(token);
    dispatch({
      type: WEEKLYSMS_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    return Promise.reject(err);
  }
};

export const editWeeklySMS = (id, message) => async (dispatch) => {
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await smsService.editWeeklySMS(id, message, token);
    dispatch({
      type: SMSLOGS_LOADING,
      payload: res.data,
    });
    notification.success({
      message: "Success",
      description: `Weekly message edited`,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    notification.error({
      message: "Error",
      description: `Weekly message could not be edited`,
    });
    return Promise.reject(err);
  }
};

export const sendWeeklySMS = () => async (dispatch) => {
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await smsService.sendWeeklySMS(token);
    dispatch({
      type: SMSLOGS_LOADING,
      payload: res.data,
    });
    notification.success({
      message: "Success",
      description: `Weekly message sent!!`,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    notification.error({
      message: "Error",
      description: `Weekly message not sent!!`,
    });
    return Promise.reject(err);
  }
};
