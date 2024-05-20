import {
  authUserLogOut,
  storeAuthTokenInLocalStorage,
  storeUser,
  userAccess,
} from "../../helpers/auth";
import {
  USER_LOGIN_LOADING,
  USER_LOGIN_ERROR,
  USER_LOGIN_REQUESTED,
  USER_LOGOUT_REQUESTED,
  BALANCE_LOADING,
  BALANCE_ERROR,
  BALANCE_REQUESTED,
  OTP_ERROR,
} from "../constants/user.constants";

const initialState = {
  loading: false,
  error: false,
  profile: null,
  balance: 0,
  balance_loading: false,
  balance_error: false,
};

const userReducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case USER_LOGIN_LOADING:
      return { ...state, loading: true, error: false };
    case OTP_ERROR:
      const otp_error_message = payload;
      return { ...state, loading: false, error: otp_error_message };
    case USER_LOGIN_ERROR:
      const error_message = payload;
      return { ...state, loading: false, error: error_message };
    case USER_LOGIN_REQUESTED:
      storeAuthTokenInLocalStorage(`Bearer ${payload.jwt}`);
      storeUser(
        `${payload.user?.firstname} ${payload.user?.lastname}`,
        payload?.user_access?.title?.title_name,
        payload?.user
      );
      userAccess(`${payload.user_access?.settings}`);

      return { ...state, loading: false, error: false, profile: payload };
    case USER_LOGOUT_REQUESTED:
      // console.log(">>>>>>>>>>>>>>>>>>>user logged out");
      authUserLogOut();
      return {};
    case BALANCE_LOADING:
      return { ...state, balance_loading: true, balance_error: false };
    case BALANCE_ERROR:
      return { ...state, balance_loading: false, balance_error: payload };
    case BALANCE_REQUESTED:
      return {
        ...state,
        balance_loading: false,
        balance_error: false,
        balance: payload,
      };
    default:
      return state;
  }
};

export default userReducer;
