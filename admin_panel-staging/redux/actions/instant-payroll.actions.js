import {
  INSTANT_PAYROLL_ALL_ERROR,
  INSTANT_PAYROLL_ALL_REQUESTED,
  INSTANT_PAYROLL_ALL_LOADING,
  INSTANT_PAYROLL_ONE_LOADING,
  INSTANT_PAYROLL_ONE_REQUESTED,
  INSTANT_PAYROLL_ONE_ERROR,
  CREATE_INSTANT_PAYOUT_REQUESTED,
  CREATE_INSTANT_PAYOUT_LOADING,
  CREATE_INSTANT_PAYOUT_ERROR,
  INSTANT_PAYROLL_STATUS_ERROR,
  INSTANT_PAYROLL_STATUS_REQUESTED,
  INSTANT_PAYROLL_STATUS_LOADING,
  RUN_INSTANT_PAYOUT_LOADING,
  RUN_INSTANT_PAYOUT_REQUESTED,
  RUN_INSTANT_PAYOUT_ERROR,
  INSTANT_PAYROLL_TOTAL_TRANSACTIONS_LOADING,
  INSTANT_PAYROLL_TOTAL_TRANSACTIONS_REQUESTED,
  INSTANT_PAYROLL_TOTAL_TRANSACTIONS_ERROR,
} from "../constants/instant-payroll.constants";
import instantPayrollService from "../services/instant-payroll.service";
import { notification } from "antd";
import { retriveAuthTokenFromLocalStorage } from "../../helpers/auth";

export const getAllInstantPayrolls = (project_id) => async (dispatch) => {
  dispatch({ type: INSTANT_PAYROLL_ALL_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await instantPayrollService.getAll(project_id, token);
    dispatch({
      type: INSTANT_PAYROLL_ALL_REQUESTED,
      payload: res.data.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: INSTANT_PAYROLL_ALL_ERROR, payload: err.response.status });
    return Promise.reject(err);
  }
};
export const getOneInstantPayroll =
  (instant_payout_id, project_id, payroll_type_id, _start, _limit) =>
  async (dispatch) => {
    dispatch({ type: INSTANT_PAYROLL_ONE_LOADING });
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await instantPayrollService.getOne(
        instant_payout_id,
        project_id,
        payroll_type_id,
        _start,
        _limit,
        token
      );
      // console.log(res.data.data);
      dispatch({
        type: INSTANT_PAYROLL_ONE_REQUESTED,
        payload: res.data.data.transactions,
      });
      return Promise.resolve(res.data);
    } catch (err) {
      dispatch({
        type: INSTANT_PAYROLL_ONE_ERROR,
        payload: err.response.status,
      });
      return Promise.reject(err);
    }
  };

export const getInstantPayrollTotal =
  (instant_payout_id) => async (dispatch) => {
    dispatch({ type: INSTANT_PAYROLL_TOTAL_TRANSACTIONS_LOADING });
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await instantPayrollService.getInstantPayrollTotal(
        instant_payout_id,
        token
      );
      dispatch({
        type: INSTANT_PAYROLL_TOTAL_TRANSACTIONS_REQUESTED,
        payload: res.data,
      });
      return Promise.resolve(res.data);
    } catch (err) {
      dispatch({
        type: INSTANT_PAYROLL_TOTAL_TRANSACTIONS_ERROR,
        payload: err.response.status,
      });
      return Promise.reject(err);
    }
  };

export const getInstantPayrollStatus =
  (instant_payout_id) => async (dispatch) => {
    dispatch({ type: INSTANT_PAYROLL_STATUS_LOADING });
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await instantPayrollService.getInstantPayrollStatus(
        instant_payout_id,
        token
      );
      dispatch({
        type: INSTANT_PAYROLL_STATUS_REQUESTED,
        payload: res.data.data.transactions,
      });
      return Promise.resolve(res.data);
    } catch (err) {
      dispatch({
        type: INSTANT_PAYROLL_STATUS_ERROR,
        payload: err.response.status,
      });
      return Promise.reject(err);
    }
  };

export const postInstantPayout =
  (project_id, payroll_type_id) => async (dispatch) => {
    dispatch({ type: CREATE_INSTANT_PAYOUT_LOADING });
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await instantPayrollService.postInstantPayout(
        {
          project_id,
          payroll_type_id,
        },
        token
      );
      console.log({ project_id, payroll_type_id });
      dispatch({
        type: CREATE_INSTANT_PAYOUT_REQUESTED,
        payload: res.data.data.transactions,
      });
      return Promise.resolve(res.data);
    } catch (err) {
      dispatch({
        type: CREATE_INSTANT_PAYOUT_ERROR,
        payload: err.response.status,
      });
      return Promise.reject(err);
    }
  };
