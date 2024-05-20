import fixaAPI from "../helpers/api";
import Notify from "../components/Error/Toast";
import { retriveAuthTokenFromLocalStorage } from "./auth";
import { notification } from "antd";
const qs = require("qs");

export const capitalize = (string) => {
  const str = string;
  const str2 = str?.charAt(0).toUpperCase() + str?.slice(1);
  return str2;
};

/**
 * Formats a number as a string with commas for thousands separator.
 * @param {number} amount - The number to format.
 * @returns {string} The formatted string.
 */
export const toMoney = (amount) => {
  // const money = new Intl.NumberFormat("en").format(amount);
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const formattedAmount = formatter.format(amount).replace('$', '');

  return formattedAmount;
};

export const cleanData = (tempData, valid) => {
  let newTempData;
  if (valid === "valid") {
    newTempData = tempData.filter(
      (temp) =>
        temp.is_verified === true &&
        temp.phone_number_exist === false &&
        temp.service_available === true &&
        temp?.first_name_error === false &&
        temp?.last_name_error === false &&
        temp?.valid_nid === true &&
        temp?.nid_exist === false &&
        temp?.phone_number_verified === true
    );
    return newTempData;
  } else if (valid === "invalid") {
    newTempData = tempData.filter(
      (temp) =>
        temp.service_available === false ||
        temp.is_verified === false ||
        temp.phone_number_exist == true ||
        temp?.first_name_error === true ||
        temp?.last_name_error === true ||
        temp?.valid_nid === false ||
        temp?.nid_exist === true ||
        temp?.phone_number_verified === false
    );
    return newTempData;
  } else {
    newTempData = tempData;
    return newTempData;
  }
};

/* =================== Count TEMPORARY TABLE =============== */
export const getTotalTemp = async () => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get("temp-workers-tables/count", {
      headers: { authorization },
    });
    return responses?.data;
  } catch (err) {
    Notify("Error happened", "error");
    return responses;
  }
};
/* ===================GET CUSTOM TEMPORARY TABLE =============== */
export const getCutomTemporaryTable = async (currentPage) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(
      `temp-workers-tables/app?_start=${currentPage}&_limit=10`,
      { headers: { authorization } }
    );
    return responses?.data;
  } catch (err) {
    if (err.code === "ERR_NETWORK") console.log("Network Error");

    return responses;
  }
};
/* ===================GET REAL TEMPORARY TABLE =============== */
export const getTemporaryTable = async (currentPage, limit, table) => {
  let responses = {};
  const valid_query = qs.stringify(
    {
      _where: [
        //// { is_verified: true },
        { phone_number_exist: false },
        // { service_available: true },
        { first_name_error: false },
        { last_name_error: false },
        // { valid_nid: true },
        { nid_exist: false },
        // { phone_number_verified: true },
      ],
    },
    { encode: false }
  );

  const invalid_query = qs.stringify(
    {
      _where: {
        _or: [
          //// { is_verified: false },
          { phone_number_exist: true },
          // { service_available: false },
          { first_name_error: true },
          { last_name_error: true },
          // { valid_nid: false },
          { nid_exist: true },
          // { phone_number_verified: false },
        ],
      },
    },
    { encode: false }
  );
  let authorization = await retriveAuthTokenFromLocalStorage();

  try {
    if (table === "valid") {
      // fetch and count all valid
      let data = await fixaAPI.get(
        `temp-workers-tables?_start=${currentPage}&_limit=${limit}&${valid_query}`,
        { headers: { authorization } }
      );

      let count = await fixaAPI.get(
        `temp-workers-tables/count?${valid_query}`,
        { headers: { authorization } }
      );

      responses.data = data?.data;
      responses.count = count?.data;
      return responses;
    } else if (table === "invalid") {
      // fetch and count all invalid
      let data = await fixaAPI.get(
        `temp-workers-tables?_start=${currentPage}&_limit=${limit}&${invalid_query}`,
        { headers: { authorization } }
      );
      let count = await fixaAPI.get(
        `temp-workers-tables/count?${invalid_query}`,
        { headers: { authorization } }
      );

      responses.data = data?.data;
      responses.count = count?.data;
      return responses;
    } else {
      // fetch and count all
      let data = await fixaAPI.get(
        `temp-workers-tables?_start=${currentPage}&_limit=${limit}`,
        { headers: { authorization } }
      );
      let count = await fixaAPI.get("temp-workers-tables/count", {
        headers: { authorization },
      });
      responses.data = data?.data;
      responses.count = count?.data;
      return responses;
    }
  } catch (err) {
    if (err.code === "ERR_NETWORK") console.log("Network Error");

    return responses;
  }
};

/* ======== SAVING TEMPORARY TABLE TO SERVICE-PROVIDERS ========= */
export const saveTempTable = async () => {
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    const responses = await fixaAPI.delete("service-providers/files/app", {
      headers: { authorization },
    });
    return responses.data;
  } catch (err) {
    return err.response.data
  }
};

/* ================= DELETE TEMPORARY TABLE ============= */
export const deleteTempTable = async () => {
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    const responses = await fixaAPI.delete("temp-workers-tables/app", {
      headers: { authorization },
    });
    return responses.data;
  } catch (err) {
    Notify("Error happened deleting the data", "error");
    console.log("ERROR in Getting Temporay data ===>:", err);
  }
};
/* =================== DELETE APISPREADSHEET TABLE =============== */
export const deleteAPITable = async (file_id) => {
  try {
    if (file_id) {
      console.log("FILE ID", file_id);
      /* const responses = await fixaAPI.get('temp-workers-tables/app');
            return responses.data; */
    } else {
      console.log("==== NOFILE ID=====");
      return false;
    }
  } catch (err) {
    console.log("ERROR in Getting Temporay data ===>:", err);
  }
};
/* =================== PERFORM SEARCH ON TEMP TEBLE =============== */
export const searchTempTable = async (searchItem, table, limit) => {
  /*
   * @params searchItem
   */
  let responses = {};
  const valid_query = qs.stringify(
    {
      _where: [
        { is_verified: true },
        { phone_number_exist: false },
        { service_available: true },
        { first_name_error: false },
        { last_name_error: false },
        { valid_nid: true },
        { nid_exist: false },
        { phone_number_verified: true },
      ],
    },
    { encode: false }
  );

  const invalid_query = qs.stringify(
    {
      _where: {
        _or: [
          { is_verified: false },
          { phone_number_exist: true },
          { service_available: false },
          { first_name_error: true },
          { last_name_error: true },
          { valid_nid: false },
          { nid_exist: true },
          { phone_number_verified: false },
        ],
      },
    },
    { encode: false }
  );
  let authorization = await retriveAuthTokenFromLocalStorage();
  console.log("search Item", searchItem, "table:", table);

  try {
    if (table === "valid") {
      // fetch and count all valid
      let data = await fixaAPI.get(
        `temp-workers-tables?_limit=${limit}&${valid_query}&_q=${searchItem}`,
        { headers: { authorization } }
      );

      let count = await fixaAPI.get(
        `temp-workers-tables/count?${valid_query}&_q=${searchItem}`,
        { headers: { authorization } }
      );

      responses.data = data?.data;
      responses.count = count?.data;
      return responses;
    } else if (table === "invalid") {
      // fetch and count all invalid
      let data = await fixaAPI.get(
        `temp-workers-tables?_limit=${limit}&${invalid_query}&_q=${searchItem}`,
        { headers: { authorization } }
      );
      let count = await fixaAPI.get(
        `temp-workers-tables/count?${invalid_query}&_q=${searchItem}`,
        { headers: { authorization } }
      );

      responses.data = data?.data;
      responses.count = count?.data;
      return responses;
    } else {
      // fetch and count all
      let data = await fixaAPI.get(
        `temp-workers-tables?_limit=${limit}&_q=${searchItem}`,
        { headers: { authorization } }
      );
      let count = await fixaAPI.get(
        `temp-workers-tables/count?_q=${searchItem}`,
        { headers: { authorization } }
      );
      responses.data = data?.data;
      responses.count = count?.data;
      return responses;
    }
  } catch (err) {
    if (err.code === "ERR_NETWORK") console.log("Network Error");

    return responses;
  }
};

/* =================== PERFORM SAVE ON TEMP TEBLE =============== */
export const saveTempWorker = async (payload) => {
  const {
    id,
    first_name,
    last_name,
    daily_earnings,
    phone_number,
    nid_number,
    service,
    service_id,
  } = payload;
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    if (id) {
      let workerData = {
        first_name: first_name,
        last_name: last_name,
        daily_earnings: daily_earnings,
        phone_number: phone_number,
        nid_number: nid_number,
        service: service,
        service_id: service_id,
      };
      const responses = await fixaAPI.put(
        `temp-workers-tables/user/${id}`,
        workerData,
        { headers: { authorization } }
      );
      if (responses?.data?.status_code > 300) {
        notification.warning({
          message: `${responses?.data?.data}`,
        })
      } else {
        notification.success({
          message: `${responses?.data?.data}`,
        })
      }
      return responses;
    } else {
      notification.error({
        message: "Worker data can not be saved!",
      })
    }
  } catch (err) {
    console.log(err);
    notification.error({
      message: "Error happened saving the data!",
    })
  }
};

/* =================== PERFORM DELETE ON TEMP TEBLE =============== */
export const deleteTempWorker = async (payload) => {
  const id = payload?.id;
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    if (id) {
      const responses = await fixaAPI.delete(`temp-workers-tables/app/${id}`, {
        headers: { authorization },
      });
      console.log("responses", responses)
      Notify("Worker data has been deleted!", "success");
      return responses;
    } else {
      Notify("Worker data can not be deleted!", "error");
    }
  } catch (err) {
    console.log("Err", err)
    Notify("Error happened deleting the worker!", "error");
  }
};
//function to close the APISpreadsheet Modal
export const closeAPIsheetModal = () => {
  const apimodal = document.getElementById("apiSpreadsheetsImportModal");
  apimodal.style.display = "none";
};

/* ================= GET RECENT UPLOAD FILE =============== */
export const getRecentFile = async () => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`temp-workers-tables/app/recent`, {
      headers: { authorization },
    });
    return responses?.data.data;
  } catch (err) {
    Notify("Error happened getting recent file", "error");
    return responses;
  }
};
/* ================= DELETE RECENT UPLOAD FILE =============== */
export const deleteRecentFile = async (file_id, file_name) => {
  try {
    let body = {
      file_id,
      file_name,
    };
    let authorization = await retriveAuthTokenFromLocalStorage();
    const responses = await fixaAPI.post(`temp-workers-tables/app/recent`, body, {
      headers: { authorization },
    });
    notification.success({
      description: `Successfully Deleted ${file_name}`,
      message: 'Success'
    });
    return responses?.data.data;
  } catch (err) {
    return null;
  }
};
