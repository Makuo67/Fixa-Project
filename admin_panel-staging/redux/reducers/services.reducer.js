import {
    SERVICES_ALL_REQUESTED,
    SERVICES_ALL_ERROR,
    DISTRICTS_ALL_REQUESTED,
    DISTRICTS_ALL_ERROR,
    NEW_SERVICES_REQUESTED,
    NEW_SERVICES_ERROR
} from "../constants/services.constants";

const initialState = {
  error: false,
  list: [],
};

export const servicesReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case SERVICES_ALL_ERROR:
      return { ...state, loading: false, error: payload };
    case SERVICES_ALL_REQUESTED:
      return { ...state, loading: false, error: false, list: payload };
    case NEW_SERVICES_ERROR:
      return { ...state, loading: false, error: payload };
    case NEW_SERVICES_REQUESTED:
      return { ...state, loading: false, error: false, list: payload };
      
    default:
      return state;
  }
};

export const districtsReducer = (state = initialState, action) => {
    const { type, payload } = action;
    switch (type) {
      case DISTRICTS_ALL_ERROR:
        return { ...state, loading: false, error: payload };
      case DISTRICTS_ALL_REQUESTED:
        return { ...state, loading: false, error: false, list: payload };
      default:
        return state;
    }
  };