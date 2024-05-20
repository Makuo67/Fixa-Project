import { PROJECTS_ALL_REQUESTED, PROJECTS_ALL_LOADING, PROJECTS_ALL_ERROR } from "../constants/project.constants";

const initialState = {
  loading: false,
  error: false,
  list: [],
};

const projectReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case PROJECTS_ALL_LOADING:
      return { ...state, loading: true, error: false };
    case PROJECTS_ALL_ERROR:
      return { ...state, loading: false, error: payload };
    case PROJECTS_ALL_REQUESTED:
      return { ...state, loading: false, error: false, list: payload };
    default:
      return state;
  }
};

export default projectReducer;
