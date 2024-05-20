import { retriveAuthTokenFromLocalStorage } from "../../helpers/auth";
import {
  PAYROLL_ALL_ERROR,
  PAYROLL_ALL_LOADING,
  PAYROLL_ALL_REQUESTED,
  PAYROLL_ONE_REQUESTED,
  PAYROLL_ONE_LOADING,
  PAYROLL_ONE_ERROR,
  POST_DEDUCTIONS_LOADING,
  POST_DEDUCTIONS_REQUESTED,
  POST_DEDUCTIONS_ERROR,
  PAYROLL_DEDUCTION_ADDED,
  RUN_PAYROLL_REQUESTED,
  RUN_PAYROLL_LOADING,
  RUN_PAYROLL_ERROR,
  PAYROLL_SUMMARY_LOADING,
  PAYROLL_SUMMARY_REQUESTED,
  PAYROLL_SUMMARY_ERROR,
  POST_ADDITIONS_REQUESTED,
  POST_ADDITIONS_LOADING,
  POST_ADDITIONS_ERROR,
  UPDATE_DEDUCTIONS_REQUESTED,
  UPDATE_DEDUCTIONS_LOADING,
  UPDATE_DEDUCTIONS_ERROR,
  ROUTINE_PAYROLL_TOTAL_TRANSACTIONS_LOADING,
  ROUTINE_PAYROLL_TOTAL_TRANSACTIONS_REQUESTED,
  ROUTINE_PAYROLL_TOTAL_TRANSACTIONS_ERROR,
} from "../constants/payroll.constants";

import PayrollService from "../services/payroll.service";

export const getAllPayrolls = (project_id, year) => async (dispatch) => {
  dispatch({ type: PAYROLL_ALL_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await PayrollService.getAll(project_id, year, token);
    dispatch({
      type: PAYROLL_ALL_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: PAYROLL_ALL_ERROR, payload: err.response.status });
    return Promise.reject(err);
  }
};

export const getOnePayroll = (payroll_id, filter_query) => async (dispatch) => {
  dispatch({ type: PAYROLL_ONE_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await PayrollService.getOnePayroll({
      payroll_id: payroll_id,
      filters: filter_query,
      token,
    });
    // const tmp_res = await PayrollService.validatePhoneNumbers({
    //   payroll_id: payroll_id,
    //   filters: filter_query,
    // });
    // if (tmp_res.data.status == "success") res.data.table = tmp_res.data.data;
    dispatch({
      type: PAYROLL_ONE_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({
      type: PAYROLL_ONE_ERROR,
      payload: err?.response?.status || 500,
    });
    return Promise.reject(err);
  }
};

export const postDeductions =
  (project_id, payroll_id, worker_id, deductions) => async (dispatch) => {
    dispatch({ type: POST_DEDUCTIONS_LOADING });
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await PayrollService.postDeductions(
        {
          project_id: project_id,
          payroll_id: payroll_id,
          assigned_worker_id: worker_id,
          deductions: deductions,
        },
        token
      );
      dispatch({
        type: POST_DEDUCTIONS_REQUESTED,
        payload: res.data,
      });
      dispatch({
        type: PAYROLL_DEDUCTION_ADDED,
      });
      return Promise.resolve(res.data);
    } catch (err) {
      dispatch({ type: POST_DEDUCTIONS_ERROR, payload: err?.response?.status });
      return Promise.reject(err);
    }
  };

export const updateDeductions =
  (project_id, payroll_id, worker_id, deductions) => async (dispatch) => {
    dispatch({ type: UPDATE_DEDUCTIONS_LOADING });
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await PayrollService.postDeductions(
        {
          project_id: project_id,
          payroll_id: payroll_id,
          assigned_worker_id: worker_id,
          deductions: deductions,
        },
        token
      );
      dispatch({
        type: UPDATE_DEDUCTIONS_REQUESTED,
        payload: res.data,
      });
      dispatch({
        type: PAYROLL_DEDUCTION_ADDED,
      });
      return Promise.resolve(res.data);
    } catch (err) {
      dispatch({
        type: UPDATE_DEDUCTIONS_ERROR,
        payload: err?.response?.status,
      });
      return Promise.reject(err);
    }
  };

export const postAdditions =
  (
    assigned_worker_id,
    payroll_details_id,
    initial_take_home,
    incremented_amount,
    done_by
  ) =>
  async (dispatch) => {
    dispatch({ type: POST_ADDITIONS_LOADING });
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await PayrollService.postAdditions(
        {
          assigned_worker_id: assigned_worker_id,
          payroll_details_id: payroll_details_id,
          initial_take_home: initial_take_home,
          incremented_amount: incremented_amount,
          done_by: done_by,
        },
        token
      );
      dispatch({
        type: POST_ADDITIONS_REQUESTED,
        payload: res.data,
      });
      dispatch({
        type: PAYROLL_DEDUCTION_ADDED,
      });
      return Promise.resolve(res.data);
    } catch (err) {
      dispatch({ type: POST_ADDITIONS_ERROR, payload: err?.response?.status });
      return Promise.reject(err);
    }
  };

export const updateWorkerStatus =
  (payroll_id, worker_id, to_enable, payroll_details_id) =>
  async (dispatch) => {
    try {
      // console.log("actions",payroll_details_id);
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await PayrollService.updateWorkerStatus(
        {
          payroll_id: payroll_id,
          worker_id: worker_id,
          payroll_details_id: payroll_details_id,
        },
        to_enable,
        token
      );

      return Promise.resolve(res.data);
    } catch (err) {
      return Promise.reject(err);
    }
  };

export const runPayroll = (payroll_id) => async (dispatch) => {
  dispatch({ type: RUN_PAYROLL_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await PayrollService.runPayroll(
      {
        payroll_id: payroll_id,
      },
      token
    );
    dispatch({
      type: RUN_PAYROLL_REQUESTED,
      payload: res.data,
    });

    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: RUN_PAYROLL_ERROR, payload: err.response.status });
    return Promise.reject(err);
  }
};

export const getPayrollSummary =
  (payroll_id, filter_query) => async (dispatch) => {
    dispatch({ type: PAYROLL_SUMMARY_LOADING });
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await PayrollService.getPayrollSummary(
        {
          payroll_id: payroll_id,
          filters: filter_query,
        },
        token
      );

      dispatch({
        type: PAYROLL_SUMMARY_REQUESTED,
        payload: res?.data,
      });
      return Promise.resolve(res.data);
    } catch (err) {
      dispatch({
        type: PAYROLL_SUMMARY_ERROR,
        payload: err?.response?.status || 500,
      });
      return Promise.reject(err);
    }
  };

export const getRoutinePayrollStatus = (payout_id) => async (dispatch) => {
  dispatch({ type: ROUTINE_PAYROLL_TOTAL_TRANSACTIONS_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await PayrollService.getRoutinePayrollStatus(
      { payroll_id: payout_id },
      token
    );
    dispatch({
      type: ROUTINE_PAYROLL_TOTAL_TRANSACTIONS_REQUESTED,
      payload: res?.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({
      type: ROUTINE_PAYROLL_TOTAL_TRANSACTIONS_ERROR,
      payload: err?.response?.status,
    });
    return Promise.reject(err);
  }
};
