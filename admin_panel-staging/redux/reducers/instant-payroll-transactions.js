import {
  INSTANT_PAYROLL_ONE_LOADING,
  INSTANT_PAYROLL_ONE_REQUESTED,
  INSTANT_PAYROLL_ONE_ERROR,
  INSTANT_PAYROLL_TOTAL_TRANSACTIONS_LOADING,
  INSTANT_PAYROLL_TOTAL_TRANSACTIONS_REQUESTED,
  INSTANT_PAYROLL_TOTAL_TRANSACTIONS_ERROR,
  INSTANT_PAYROLL_STATUS__REQUESTED,
  INSTANT_PAYROLL_STATUS_LOADING,
  INSTANT_PAYROLL_STATUS_ERROR,
} from "../constants/instant-payroll.constants";

const initialState = {
  loading: false,
  error: false,
  list: [],
  instant_payroll_total_transactions: 0,
};

const instantPayrollTransactionsReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case INSTANT_PAYROLL_ONE_LOADING:
      return { ...state, loading: true, error: false };
    case INSTANT_PAYROLL_ONE_ERROR:
      return { ...state, loading: false, error: payload };
    case INSTANT_PAYROLL_ONE_REQUESTED:
      return { ...state, loading: false, error: false, list: payload };
    case INSTANT_PAYROLL_TOTAL_TRANSACTIONS_REQUESTED:
      return {
        ...state,
        loading: false,
        error: false,
        instant_payroll_total_transactions: payload,
      };
    default:
      return state;
  }
};

export default instantPayrollTransactionsReducer;
