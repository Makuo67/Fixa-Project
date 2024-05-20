import { retriveAuthTokenFromLocalStorage } from "../../helpers/auth";
import {
  SERVICES_ALL_REQUESTED,
  SERVICES_ALL_ERROR,
  DISTRICTS_ALL_REQUESTED,
  DISTRICTS_ALL_ERROR,
  NEW_SERVICES_REQUESTED,
  NEW_SERVICES_ERROR
} from "../constants/services.constants";
import servicesService from "../services/services.service";

export const getAllServices = () => async (dispatch) => {
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await servicesService.getServices(token);
    dispatch({
      type: SERVICES_ALL_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: SERVICES_ALL_ERROR, payload: err?.response?.status });
    return Promise.reject(err);
  }
};
export const addService = (data) => async (dispatch) => {
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await servicesService.postService(token, data);
    dispatch({
      type: NEW_SERVICES_REQUESTED,
      payload: res.data,
    });
    
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: NEW_SERVICES_ERROR, payload: err?.response?.status });
    return Promise.reject(err);
  }
};


export const getAllDistricts = () => async (dispatch) => {
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await servicesService.getDistricts(token);
    dispatch({
      type: DISTRICTS_ALL_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: DISTRICTS_ALL_ERROR, payload: err.response.status });
    return Promise.reject(err);
  }
};
