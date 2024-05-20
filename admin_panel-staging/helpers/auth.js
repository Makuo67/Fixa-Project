import localforage from "localforage";
import { USER_AUTHENTICATED_TOKEN, USER_AUTH_CACHE_TTL } from "../config";
import fixaAPI from "./api";
import jwt from 'jsonwebtoken';
import { clear } from "idb-keyval";

export const storeAuthTokenInLocalStorage = async (token) => {
  try {
    var now = new Date();
    const item = {
      value: token,
      expiry: now.getTime() + USER_AUTH_CACHE_TTL,
    };
    localforage.setItem(USER_AUTHENTICATED_TOKEN, item);
  } catch (e) {
    console.log(
      "an error happened when trying to storeAuthTokenInLocalStorage()",
      e
    );
  }
};

export const retriveAuthTokenFromLocalStorage = async () => {
  var authToken = "";
  try {
    var tokenData = await localforage.getItem(USER_AUTHENTICATED_TOKEN);
    if (tokenData) {
      var now = new Date();
      if (now.getTime() < tokenData.expiry) {
        authToken = tokenData.value;
      } else {
        /**
         * Delete expired token
         */
        await localforage.removeItem(USER_AUTHENTICATED_TOKEN);
      }
    }
  } catch (e) {
    console.log(
      "an error happened when trying to retriveAuthTokenFromLocalStorage()",
      e
    );
  }
  return authToken;
};

export const storeUser = async (usernames, title, payload) => {
  try {
    var now = new Date();
    const item = {
      value: usernames,
      expiry: now.getTime() + USER_AUTH_CACHE_TTL,
    };
    localforage.setItem("username", item);
    localforage.setItem("user", payload);
    localforage.setItem("title", title);
  } catch (e) {
    console.log("an error happened when trying to store user info", e);
  }
};

export const userAccess = async (payload) => {
  try {
    localforage.setItem("userAccess", payload);
  } catch (e) {
    console.log("an error happened when trying to store user info", e);
  }
};

export const paymentViewAccess = async (payload) => {
  try {
    localforage.setItem("paymentViewAccess", payload);
  } catch (e) {
    console.log("an error happened when trying to store payment access info", e);
  }
}

export const setUserJobTitle = async (title) => {
  try {
    localforage.setItem("title", title);
  } catch (e) {
    console.log(e);
  }
};

export const checkUserAccess = async () => {
  var access = "";
  try {
    access = await localforage.getItem("userAccess");
  } catch (e) {
    console.log("an error happened when trying to retrieve user", e);
  }
  return access;
};
export const retriveUserDataFromLocalStorage = async () => {
  let user = {};
  try {
    user = await localforage.getItem("user");
  } catch (e) {
    console.log("an error happened when trying to retrieve user", e);
  }
  return user;
};

export const retriveUserFromLocalStorage = async () => {
  var user = []
  try {
    var userData = await localforage.getItem("username");
    var title = await localforage.getItem("title");
    if (userData) {
      var now = new Date();
      if (now.getTime() < userData.expiry) {
        user.push(userData.value);
        user.push(title);
      } else {
        /**
         * Delete expired token
         */
        await localforage.removeItem(USER_AUTHENTICATED_TOKEN);
        await localforage.removeItem("username");
        await localforage.removeItem("title");
      }
    }
  } catch (e) {
    console.log(
      "an error happened when trying to retriveAuthTokenFromLocalStorage()",
      e
    );
  }
  return user;
};

export const isUserLoggedIn = async () => {
  var logged = false;
  try {
    var authToken = await retriveAuthTokenFromLocalStorage();
    if (authToken && authToken !== "") {
      logged = true;
    }
  } catch (e) {
    console.log(
      "an error happened when trying to check if user is logged in",
      e
    );
  }
  return logged;
};

export const authUserLogOut = async () => {
  try {
    clear() // Clear idb-keyval
    await localforage.clear();
  } catch (e) {
    console.log("an error happened when logging out user", e);
  }
};

export const storePaymentData = async (payload) => {
  try {
    await localforage.setItem("paymentData", JSON.stringify(payload));
  } catch (e) {
    console.log("an error happened when trying to store user info", e);
  }
};

export const getPaymentData = async () => {
  try {
    return JSON.parse(await localforage.getItem("paymentData"));
  } catch (e) {
    console.log("an error happened when trying to get payment info", e);
  }
};

export const clearPaymentData = async (payload) => {
  try {
    localStorage.removeItem("paymentData");
  } catch (e) {
    console.log("an error happened when trying to store user info", e);
  }
};

export const checkOnboarding = async (payload) => {
  try {
    const companyStatus = await localforage.getItem("companyStatus")
    if(companyStatus && payload){
      await localforage.removeItem("companyStatus")
    } else {
      await localforage.setItem("companyStatus", payload)
    }
  } catch (e) {
    console.log("an error happened when trying to check onboarding info", e);
  }
};

export const createLoginOTP = async (credentials) => {
  try {
    const response = await fixaAPI.post(
      `/otp-verifications/create-otp-login`,
      credentials
    );
    return response?.data;
  } catch (e) {
    return e?.response?.data
  }
};

/**
 * Gets the authenticated user data
 * 
 */
export const getLoggedUserData = async () => {
  var userData = {};
  try {
    var authToken = await retriveAuthTokenFromLocalStorage();
    if (authToken && authToken !== '') {
      const tokenData = jwt.decode(authToken);
      const {
        id,
        client_id,
        first_name,
        last_name,
        position,
      } = tokenData;

      userData = {
        id,
        client_id,
        first_name,
        last_name,
        position,
      };
    }

  } catch (e) {
    userData = {
      id: "",
      client_id: "",
      first_name: "",
      last_name: "",
      position: "",
    };
    console.log('an error happened when trying to get authenticated user data in getLoggedUserData()', e);
  }

  return userData;
}

// change the phone number in indexDB of user
export const changePhoneNumber = async (phoneNumber) => {
  try {
    const userData = await localforage.getItem('user');
    userData.username = phoneNumber;
    await localforage.setItem('user', userData);
  } catch (e) {
    console.log(e);
  }

}
