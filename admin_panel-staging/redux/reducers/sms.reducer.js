import {
  SMSLOGS_ERROR,
  SMSLOGS_LOADING,
  SMSLOGS_REQUESTED,
  WEEKLYSMS_REQUESTED,
} from "../constants/sms.constants";

const initialState = {
  loading: false,
  error: false,
  smsLogs: null,
  weeklySMS: "",
};

const smsLogsReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case SMSLOGS_LOADING:
      return { ...state, loading: true, error: false };
    case SMSLOGS_ERROR:
      return { ...state, loading: false, error: payload };
    case SMSLOGS_REQUESTED:
      return { ...state, loading: false, error: false, smsLogs: payload };
    case WEEKLYSMS_REQUESTED:
      return { ...state, loading: false, error: false, weeklySMS: payload };
    default:
      return state;
  }
};

export default smsLogsReducer;
