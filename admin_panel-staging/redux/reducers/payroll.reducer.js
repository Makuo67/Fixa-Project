import {
  PAYROLL_ALL_ERROR,
  PAYROLL_ALL_LOADING,
  PAYROLL_ALL_REQUESTED,
  PUSHER_UPDATE
} from "../constants/payroll.constants";

const initialState = {
  loading: false,
  error: false,
  list: [],
};

const payrollReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case PAYROLL_ALL_LOADING:
      return { ...state, loading: true, error: false };
    case PAYROLL_ALL_ERROR:
      return { ...state, loading: false, error: payload };
    case PAYROLL_ALL_REQUESTED:
      return { ...state, loading: false, error: false, list: payload };
    default:
      return state;
  }
};

export default payrollReducer;
