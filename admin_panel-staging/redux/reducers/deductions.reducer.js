import {
  POST_DEDUCTIONS_LOADING,
  POST_DEDUCTIONS_REQUESTED,
  POST_DEDUCTIONS_ERROR,
} from '../constants/payroll.constants';

const initialState = {
  loading: false,
  error: false,
  list: [],
  request: [],
};

const deductionsReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case POST_DEDUCTIONS_LOADING:
      return { ...state, loading: true, error: false };
    case POST_DEDUCTIONS_ERROR:
      return { ...state, loading: false, error: payload };
    case POST_DEDUCTIONS_REQUESTED:
      return { ...state, loading: false, error: false, list: payload };
    default:
      return state;
  }
};

export default deductionsReducer;
