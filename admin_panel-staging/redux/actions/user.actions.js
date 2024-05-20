import { retriveAuthTokenFromLocalStorage } from "../../helpers/auth";
import {
  USER_LOGIN_LOADING,
  USER_LOGIN_ERROR,
  USER_LOGIN_REQUESTED,
  BALANCE_LOADING,
  BALANCE_REQUESTED,
  BALANCE_ERROR,
  OTP_ERROR,
} from "../constants/user.constants";
import userService from "../services/user.service";

export const login = (credentials) => async (dispatch) => {
  dispatch({ type: USER_LOGIN_LOADING });
  try {
    const res = await userService.login(credentials);
    dispatch({
      type: USER_LOGIN_REQUESTED,
      payload: res.data?.data,
    });
    return Promise.resolve(res.data?.data);
  } catch (err) {
    dispatch({ type: OTP_ERROR, payload: err?.response?.data?.message });
    return Promise.reject(err);
  }
};

export const getBalance = () => async (dispatch) => {
  dispatch({ type: BALANCE_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await userService.getBalance(token);
    dispatch({
      type: BALANCE_REQUESTED,
      payload: res.data.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: BALANCE_ERROR, payload: err?.response?.status });
    return Promise.reject(err);
  }
};
