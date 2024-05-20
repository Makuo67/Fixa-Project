import {
  INSTANT_PAYROLL_ALL_ERROR,
  INSTANT_PAYROLL_ALL_REQUESTED,
  INSTANT_PAYROLL_ALL_LOADING,
  CREATE_INSTANT_PAYOUT_REQUESTED,
  CREATE_INSTANT_PAYOUT_LOADING,
  CREATE_INSTANT_PAYOUT_ERROR,
  PUSHER_UPDATE,
} from "../constants/instant-payroll.constants";
const initialState = {
  loading: false,
  error: false,
  list: [],
  change: 0,
};

const instantPayrollReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case INSTANT_PAYROLL_ALL_LOADING:
      return { ...state, loading: true, error: false };
    case INSTANT_PAYROLL_ALL_ERROR:
      return { ...state, loading: false, error: payload };
    case INSTANT_PAYROLL_ALL_REQUESTED:
      return { ...state, loading: false, error: false, list: payload };
    case PUSHER_UPDATE:
      console.log("PUSHER_UPDATE");
      return { ...state, change: state.change + 1 };
    default:
      return state;
  }
};

export default instantPayrollReducer;
