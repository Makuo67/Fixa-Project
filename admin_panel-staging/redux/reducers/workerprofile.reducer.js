import {
  WORKERPROFILE_ERROR,
  WORKERPROFILE_LOADING,
  WORKERPROFILE_REQUESTED,
  WORKHISTORY_REQUESTED,
  WORKERASSESSMENT_REQUESTED,
  WORKEREDUCATION_REQUESTED
} from "../constants/workerprofile.constants";

const initialState = {
  loading: false,
  error: false,
  worker: null,
  workHistory: null,
  worker_education: null,
  workerAssessment: null,
};

const workerprofileReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case WORKERPROFILE_LOADING:
      return { ...state, loading: true, error: false };
    case WORKERPROFILE_ERROR:
      return { ...state, loading: false, error: payload };
    case WORKERPROFILE_REQUESTED:
      return { ...state, loading: false, error: false, worker: payload };
    case WORKHISTORY_REQUESTED:
      return { ...state, loading: false, error: false, workHistory: payload };
    case  WORKEREDUCATION_REQUESTED:
        return { ...state, loading: false, error: false, worker_education: payload };  
    case WORKERASSESSMENT_REQUESTED:
      return { ...state, loading: false, error: false, workerAssessment: payload };
    default:
      return state;
  }
};

export default workerprofileReducer;
