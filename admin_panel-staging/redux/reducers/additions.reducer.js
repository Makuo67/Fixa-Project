import {  
    POST_ADDITIONS_REQUESTED,
    POST_ADDITIONS_LOADING,
    POST_ADDITIONS_ERROR,
  } from '../constants/payroll.constants';
  
  const initialState = {
    loading: false,
    error: false,
    list: [],
    request: [],
  };
  
  const additionsReducer = (state = initialState, action) => {
    const { type, payload } = action;
    switch (type) {
      case POST_ADDITIONS_LOADING:
        return { ...state, loading: true, error: false };
      case POST_ADDITIONS_ERROR:
        return { ...state, loading: false, error: payload };
      case POST_ADDITIONS_REQUESTED:
        return { ...state, loading: false, error: false, list: payload };
      default:
        return state;
    }
  };
  
  export default additionsReducer;
  