import { retriveAuthTokenFromLocalStorage } from "../../helpers/auth";
import {
  AGGREGATES_ALL_ERROR,
  AGGREGATES_ALL_LOADING,
  AGGREGATES_ALL_REQUESTED,
  WORKFORCE_ALL_ERROR,
  WORKFORCE_ALL_LOADING,
  WORKFORCE_ALL_REQUESTED,
  SERVICES_REQUESTED,
  PROVINCES_REQUESTED,
  DISTRICTS_REQUESTED,
  FILTERS_LOADING,
  PROJECTS_REQUESTED,
} from "../constants/workforce.constants";
import workforceService from "../services/workforce.service";

export const getAllWorkforce =
  (filters, page, pageSize) => async (dispatch) => {
    dispatch({ type: WORKFORCE_ALL_LOADING });
    try {
      const token = await retriveAuthTokenFromLocalStorage();
      const res = await workforceService.getAll(filters, page, pageSize, token);
      dispatch({
        type: WORKFORCE_ALL_REQUESTED,
        payload: res.data,
      });
      return Promise.resolve(res.data);
    } catch (err) {
      dispatch({ type: WORKFORCE_ALL_ERROR, payload: err.response?.status });
      return Promise.reject(err);
    }
  };
export const getWorkforceList = (filters) => async (dispatch) => {
  dispatch({ type: WORKFORCE_ALL_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workforceService.getCustomWorkforceList(filters, token);
    dispatch({
      type: WORKFORCE_ALL_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: WORKFORCE_ALL_ERROR, payload: err.response?.error });
    return Promise.reject(err);
  }
};

export const getWorkforceAggregates = () => async (dispatch) => {
  dispatch({ type: AGGREGATES_ALL_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workforceService.getCustomWorkforceAggregates(token);
    dispatch({
      type: AGGREGATES_ALL_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: AGGREGATES_ALL_ERROR, payload: err.response?.error });
    return Promise.reject(err);
  }
};
export const getProjects = () => async (dispatch) => {
  // dispatch({ type: FILTERS_LOADING });

  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workforceService.getProjects(token);
    dispatch({
      type: PROJECTS_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    return Promise.reject(err);
  }
};
export const getServices = () => async (dispatch) => {
  // dispatch({ type: FILTERS_LOADING });

  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workforceService.getServices(token);
    dispatch({
      type: SERVICES_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    return Promise.reject(err);
  }
};
export const getProvinces = () => async (dispatch) => {
  // dispatch({ type: FILTERS_LOADING });

  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workforceService.getProvinces(token);
    dispatch({
      type: PROVINCES_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    return Promise.reject(err);
  }
};
export const getDistricts = () => async (dispatch) => {
  // dispatch({ type: FILTERS_LOADING });

  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await workforceService.getDistricts(token);
    dispatch({
      type: DISTRICTS_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    return Promise.reject(err);
  }
};
