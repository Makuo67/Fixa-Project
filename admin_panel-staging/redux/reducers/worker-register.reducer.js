import {
    WORKER_REGISTER_REQUESTED,
    WORKER_REGISTER_LOADING,
    WORKER_REGISTER_ERROR,
  } from "../constants/register-worker.constants";
  
  const initialState = {
    loading: false,
    error: false,
    list: [],
  };

const workerReducer = (state = initialState, action) => {
    const { type, payload } = action;
  switch (type) {
    case WORKER_REGISTER_LOADING:
      return { ...state, loading: true, error: false };
    case WORKER_REGISTER_ERROR:
      return { ...state, loading: false, error: payload };
    case WORKER_REGISTER_REQUESTED:
      return { ...state, loading: false, error: false, list: payload };
    default:
      return state;
  }
}
export default workerReducer