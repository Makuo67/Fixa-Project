import {
  WORKFORCE_ALL_ERROR,
  AGGREGATES_ALL_ERROR,
  WORKFORCE_ALL_LOADING,
  AGGREGATES_ALL_LOADING,
  WORKFORCE_ALL_REQUESTED,
  AGGREGATES_ALL_REQUESTED,
  SERVICES_REQUESTED,
  PROVINCES_REQUESTED,
  DISTRICTS_REQUESTED,
  PROJECTS_REQUESTED,
  FILTERS_LOADING,
} from "../constants/workforce.constants";

const initialState = {
  loading: false,
  error: false,
  list: [],
  exportList: [],
  meta: {
    pagination: {
      count: 0,
    },
  },
  aggregates: {
    loading: false,
    error: false,
    data: [],
  },
  filters: {
    loading: false,
    projects: [],
    trades: [],
    districts: [],
    provinces: [],
  },
};

const workforceReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case WORKFORCE_ALL_LOADING:
      return { ...state, loading: true, error: false };

    case WORKFORCE_ALL_ERROR:
      return { ...state, loading: false, error: payload };

    case WORKFORCE_ALL_REQUESTED:
      return {
        ...state,
        loading: false,
        error: false,
        list: payload.data.list,
        exportList: payload.data.export,
        meta: payload.data.meta,
        aggregatez: payload.data.aggregates,
      };

    case AGGREGATES_ALL_LOADING:
      return {
        ...state,
        aggregates: { ...state.aggregates, loading: true, error: false },
      };

    case AGGREGATES_ALL_ERROR:
      return {
        ...state,
        aggregates: { ...state.aggregates, loading: false, error: payload },
      };

    case AGGREGATES_ALL_REQUESTED:
      return {
        ...state,
        aggregates: {
          ...state.aggregates,
          loading: false,
          data: payload.data.aggregates,
        },
      };

    case FILTERS_LOADING:
      return { ...state, filters: { loading: true } };
    case PROJECTS_REQUESTED:
      return {
        ...state,
        filters: { loading: false, ...state.filters, projects: payload },
      };
    case SERVICES_REQUESTED:
      return {
        ...state,
        filters: { loading: false, ...state.filters, trades: payload },
      };
    case PROVINCES_REQUESTED:
      return {
        ...state,
        filters: { loading: false, ...state.filters, provinces: payload },
      };
    case DISTRICTS_REQUESTED:
      return {
        ...state,
        filters: { loading: false, ...state.filters, districts: payload },
      };
    default:
      return state;
  }
};

export default workforceReducer;
