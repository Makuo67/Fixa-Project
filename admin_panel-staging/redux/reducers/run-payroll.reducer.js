import {
  PAYROLL_ONE_REQUESTED,
  PAYROLL_ONE_LOADING,
  PAYROLL_ONE_ERROR,
  PAYROLL_DEDUCTION_ADDED,
  RUN_PAYROLL_REQUESTED,
  RUN_PAYROLL_LOADING,
  RUN_PAYROLL_ERROR,
} from "../constants/payroll.constants";

const initialState = {
  loading: false,
  error: false,
  list: [],
  meta: {},
  payroll_id: null,
  change: false, // needed to update the deductions table
};

const runPayrollReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case PAYROLL_ONE_LOADING:
      return { ...state, loading: true, error: false };
    case PAYROLL_ONE_ERROR:
      return { ...state, loading: false, error: payload };
    case PAYROLL_ONE_REQUESTED:
      return {
        ...state,
        loading: false,
        error: false,
        list: payload.table,
        meta: payload.meta,
        payroll_id: payload.payroll_id,
      };
    case PAYROLL_DEDUCTION_ADDED:
      // initialState.list[payload.index] = payload.workerData;
      // change state to update deductions table
      return { ...state, change: !initialState.change };
    // RUN PAYROLL
    case RUN_PAYROLL_LOADING:
      return { ...state, loading: true, error: false };
    case RUN_PAYROLL_ERROR:
      return { ...state, loading: false, error: payload };
    case RUN_PAYROLL_REQUESTED:
      return {
        ...state,
        loading: false,
        error: false,
        status: payload.status,
      };
    default:
      return state;
  }
};

export default runPayrollReducer;
