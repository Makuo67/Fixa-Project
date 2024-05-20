import { retriveAuthTokenFromLocalStorage } from "../../helpers/auth";
import {
  PROJECTS_ALL_REQUESTED,
  PROJECTS_ALL_LOADING,
  PROJECTS_ALL_ERROR,
} from "../constants/project.constants";
import projectService from "../services/project.service";

export const getAllProjects = () => async (dispatch) => {
  dispatch({ type: PROJECTS_ALL_LOADING });
  try {
    const token = await retriveAuthTokenFromLocalStorage();
    const res = await projectService.getAll(token);
    dispatch({
      type: PROJECTS_ALL_REQUESTED,
      payload: res.data,
    });
    return Promise.resolve(res.data);
  } catch (err) {
    dispatch({ type: PROJECTS_ALL_ERROR, payload: err?.response?.status });
    return Promise.reject(err);
  }
};
