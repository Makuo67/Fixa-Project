import {
  PAYROLL_SUMMARY_LOADING,
  PAYROLL_SUMMARY_REQUESTED,
  PAYROLL_SUMMARY_ERROR,
  PUSHER_UPDATE
} from '../constants/payroll.constants';

const initialState = {
  loading: false,
  error: false,
  list: [],
  meta: {},
  payroll_id: null,
  change: 0,
};

const payrollSummaryReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case PAYROLL_SUMMARY_LOADING:
      return { ...state, loading: true, error: false };
    case PAYROLL_SUMMARY_ERROR:
      return { ...state, loading: false, error: payload };
    case PAYROLL_SUMMARY_REQUESTED:
      return {
        ...state,
        loading: false,
        error: false,
        list: payload.table,
        meta: payload.meta,
        payroll_id: payload.payroll_id,
      };
    case PUSHER_UPDATE:
      // console.log("PUSHER_UPDATE"); by peter and willy
      return { ...state, change: state.change + 1 };
    default:
      return state;
  }
};

export default payrollSummaryReducer;
