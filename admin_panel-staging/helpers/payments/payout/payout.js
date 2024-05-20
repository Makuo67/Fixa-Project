import fixaAPI from "../../api";
import { retriveAuthTokenFromLocalStorage } from "../../auth";
import { notification } from "antd";
import { get, set } from "idb-keyval";
import queryString from "query-string";
import * as XLSX from 'xlsx';
import Notification from "../../../components/Error/Notification";
import { decodeJSONBase64 } from "@/utils/decodeBase";

/* SEARCH Function custom */
export const onSearch = (query, array) => {
  /**
   * @query string to search
   * @array array of objects to search from
   */
  let results = [];
  for (var i = 0; i < array.length; i++) {
    // Looping in the array
    if (array[i] && query.length > 0) {
      // Normalize both query and data in the array & push results into the results.
      if (
        array[i].payee_name.toLowerCase().includes(query.toLowerCase()) ||
        array[i].phone_number.includes(query)
      ) {
        results.push(array[i]);
      }
    } else {
      return results;
    }
  }
  return results;
};

/* ============== CREATE PAYOUT PAYMENT ============== */
export const createPayout = async (payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(`payments/payout`, payload, {
      headers: { authorization },
    });
    if (responses?.data.status_code === 200) {
      notification.success({
        message: "SUCCESS",
        description: "New Payout Created Successfully!",
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: "Payout Creation Failed!",
      });
    }
    return responses;
  }
};
/* ============== GET PAYEE TYPES ============== */
export const getPayeeType = async () => {
  let responses = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`payees`, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return [];
  }
};

/* ============== GET PAYOUT TRANSACTIONS ============== */
export const getPayoutList = async (id, query) => {
  const newQuery = { ...query };
  delete newQuery.payment;
  delete newQuery.name;
  if (newQuery._limit) {
    delete newQuery._limit;
  }

  try {
    const query_string = queryString.stringify(newQuery, { encode: false }).length > 1 ? "&" + queryString.stringify(newQuery, { encode: false }) : '';
    const authorization = await retriveAuthTokenFromLocalStorage();
    const responses = await fixaAPI.get(
      `payout-transactions?payment_id=${id}&_limit=-1` + query_string,
      {
        headers: { authorization },
      }
    );
    if (queryString.stringify(newQuery, { encode: false }).length == 0) set("payout", responses?.data?.data?.transactions);

    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return [];
  }
};
/* ============== GET PAYOUT DETAILS ============== */
export const getPayoutDetails = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const responses = await fixaAPI.get(
      `payout-transactions/payment_details/${id}?_limit=-1`,
      {
        headers: { authorization },
      }
    );

    return responses?.data?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return [];
  }
};
/* ============== SEARCH PAYOUT TRANSACTIONS ============== */
export const searchPayoutList = async (query) => {
  let searchData = [];
  await get("payout")
    .then((response) => {
      // search using custom function
      searchData = onSearch(query, response);
    })
    .catch((err) => {
      console.log("ERROR In searching", err);
    });
  return searchData;
};

/* ============== ADDING PAYEE IN PAYOUT ============== */
export const createSinglePayee = async (payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(`one/payout-transactions`, payload, {
      headers: { authorization },
    });
    if (responses?.data.statusCode === 200) {
      notification.success({
        message: "SUCCESS",
        description: responses?.data?.message,
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: err?.response?.data?.message,
      });
    } else {
      notification.error({
        message: "ERROR",
        description: err?.response?.data?.message,
      });
    }
    return responses;
  }
};

/* ============== EDIT PAYEE IN PAYOUT ============== */
export const editSinglePayee = async (payment_id, payee_id, payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.put(
      `one/payout-transactions/${payee_id}`,
      payload,
      {
        headers: { authorization },
      }
    );
    if (responses?.data.status_code === 200) {
      notification.success({
        message: "SUCCESS",
        description: "Supplier Edited Successfully!",
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: "Supplier Edit Failed!",
      });
    }
    return responses;
  }
};

/* ============== DELETE PAYEE IN PAYOUT ============== */
export const deleteSinglePayee = async (id) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.delete(`/payout-transactions/delete/${id}`, {
      headers: { authorization },
    });
    if (
      responses?.data.status_code === 200 ||
      responses?.status === "success"
    ) {
      notification.success({
        message: "SUCCESS",
        description: "Supplier Deleted Successfully!",
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: "Supplier Deletion Failed!",
      });
    }
    return responses;
  }
};

/* ============== GET WORKFORCE ============== */
export const getWorkforce = async (project_id) => {
  let responses = [];
  let params = project_id ? `&project_id=${project_id}`: '';
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`workforces/get_workers?_limit=-1${params}`, {
      headers: { authorization },
    });
    set("workers", responses?.data);
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return responses;
  }
};

/* ============== GET PAYEES NAMES ============== */
export const getPayeeNames = async () => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`payee-names?_limit=-1`, {
      headers: { authorization },
    });
    return set("payee_names", responses?.data);
    //return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return responses;
  }
};

/* ============== ADDING PAYEE IN PAYEES ============== */
export const AddingNewPayeeName = async (payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(`payee-names`, payload, {
      headers: { authorization },
    });
    if (responses?.data.status_code === 200) {
      notification.success({
        message: "SUCCESS",
        description: "Supplier Created Successfully!",
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: "Supplier Addition Failed!",
      });
    }
    return responses;
  }
};
/* ============== VALIDATE EXCEL ============== */
export const validateExcel = async () => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(`integration/payout-transactions/validate`, {
      headers: { authorization },
    });
    if (responses?.data.status_code === 200) {
      //TODO: TO be removed after testing
      notification.success({
        message: "SUCCESS",
        description: "Excel validated Successfully!",
      });
    }
    return responses?.data;
  } catch (err) {
    console.log("responses validate err ==>", err);
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: "Excel validation Failed!",
      });
    }
    return responses;
  }
};
/* ============== DELETE EXCEL TEMP ============== */
export const deleteExcelTemp = async () => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.delete(`payout-transactions/temp/delete`, {
      headers: { authorization },
    });
    if (responses?.data.status === 200) {
      notification.success({
        message: "SUCCESS",
        description: "Excel File Deleted Successfully!",
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: "Deleting Excel Failed!",
      });
    }
    return responses;
  }
};
/* ============== Saving EXCEL ============== */
export const excelNext = async (payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(
      `integration/payout-transactions/validate/next`,
      payload,
      {
        headers: { authorization },
      }
    );
    if (responses?.data.status_code === 200) {
      /* notification.success({
        message: "SUCCESS",
        description: "Excel Saved Successfully!",
      }); */
    }
    return responses?.data;
  } catch (err) {
    console.log("responses saving err ==>", err);
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: "Excel Saving Failed!",
      });
    }
    return responses;
  }
};

/* ============== GET All PAYOUT TRANSACTIONS ============== */
/* export const getAllPayoutList = async (id) => {
  let responses = [];

  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(
      `payout-transactions?payment_id=${id}&_limit=${-1}`,
      {
        headers: { authorization },
      }
    );
    set("payout", responses?.data?.data?.transactions);

    return responses.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return responses;
  }
}; */
/* ============== GET All PAYOUT TRANSACTIONS ============== */
export const getTransactionDetails = async (id) => {
  let responses = [];

  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(
      `payout-transactions/payout_transactions_details/${id}`,
      {
        headers: { authorization },
      }
    );
    return responses?.data.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return responses;
  }
};

/* ============== CLOSE PAYOUT TRANSACTIONS ============== */
export const closeTransaction = async (id, payout) => {
  let responses = [];

  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`payments/closing/${id}`, {
      headers: { authorization },
    });
    if (responses?.data.status_code === 200) {
      if (!payout) {
        notification.success({
          message: "SUCCESS",
          description: "Payroll Closed Successfully!",
        });
      } else {
        notification.success({
          message: "SUCCESS",
          description: "Payout Closed Successfully!",
        });
      }
    }
    return responses?.data.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: err?.response?.data.error ?? "Failed",
        description: err?.response?.data.message ?? "An error occured",
      });
    }
    return responses;
  }
};

/* ====== Fetch from IndexDB ===== */
export const getWorkersDb = async () => {
  let workers = [];
  await get("workers")
    .then((response) => {
      workers = response;
    })
    .catch((err) => {
      console.log("ERROR In getWorkersDb", err);
    });
  return workers;
};
export const getPayeesDb = async () => {
  let workers = [];
  await get("payee_names")
    .then((response) => {
      workers = response;
    })
    .catch((err) => {
      console.log("ERROR In getPayeesDb", err);
    });
  return workers;
};


/* =============== Read Excel File ===============  */
export const readExcelFile = async (file, payoutInfo) => {
  if (!file || !file.name) {
    return notification.warning({
      message: 'Invalid File',
      description: 'Please select a file.'
    })
  }
  const fileName = file.name;
  const fileExtension = fileName.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
    return notification.warning({
      message: 'Invalid File',
      description: 'Please select an Excel or CSV file.'
    })
  }

  if (!payoutInfo.meta_data?.payment) {
    console.log("Payout Info metadata error ==>", payoutInfo?.meta_data?.payment);
    return notification.warning({
      message: 'Payout Error',
      description: 'Error happened while processing payout.'
    })
  }
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const fileReader = new FileReader();
    const fileContent = await new Promise((resolve, reject) => {
      fileReader.onerror = () => {
        fileReader.abort();
        reject(new DOMException("Problem parsing input file."));
      };
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.readAsBinaryString(file);
    });

    const workbook = XLSX.read(fileContent, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const sheetColumns = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })[0];
    // payout file columns
    const expectedColumns = ['first_name', 'last_name', 'momo_account', 'total_earnings'];
    if (verifyFileColumns(sheetColumns, expectedColumns) === false) {
      return notification.error({
        message: 'File Columns Error',
        description: 'File columns are not valid!'
      });
    }
    let body = {
      data: sheetData,
      payout_id: payoutInfo.meta_data?.payment?.id,
      file_name: fileName,
    }
    const results = await fixaAPI.post(`integration/payout-transactions`, body, {
      headers: { authorization },
    });
    return results;
  } catch (err) {
    console.error("ERROR in readExcelFile ==>", err.response);
    const errorMessage = err?.response?.data?.error;
    return notification.error({
      message: 'File Error',
      description: errorMessage ? `${errorMessage}` : `Error happened while processing payout.`
    });
  }
}

// Function to verify file columns
export const verifyFileColumns = (sheetColumns, expectedCols) => {

  if (sheetColumns.length !== expectedCols.length) {
    return false;
  }

  for (let i = 0; i < sheetColumns.length; i++) {
    if (sheetColumns[i] !== expectedCols[i]) {
      return false;
    }
  }

  return true;
}

/* ============== CREATE PAYOUT PAYMENT ============== */
export const createClaim = async (payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(`payments/payout-claim`, payload, {
      headers: { authorization },
    });
    if (responses?.data.status_code === 200) {
      notification.success({
        message: "SUCCESS",
        description: "New Claim Created Successfully!",
      });
    }
    return responses?.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "BAD REQUEST",
        description: "Claim Creation Failed!",
      });
    }
    return responses;
  }
};

/* ============== FETCH CLAIMS ============== */
export const getClaims = async (id) => {
  // Verify the ID
  if (!id || typeof id !== "number") {
    console.log("Invalid Claim ID");
  }

  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(
      `payments?payment_id_claim=${id}&is_claim=true&_sort=id:DESC`,
      {
        headers: { authorization },
      }
    );
    return responses.data;
  } catch (err) {
    if (err?.code === "ERR_NETWORK") {
      console.log("NETWORK ERROR");
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      console.log("BAD REQUEST");
    }
    return responses;
  }
};

// ADD BULK WORKERS IN PAYOUT
export const payoutAddBulkTemp = async (payload) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const results = await fixaAPI.post(`bulk/payout/payout-transactions`, payload, {
      headers: { authorization },
    });
    set('recent_file_payout', { file_name: payload.file_name, file_id: payload.file_id });
    notification.success({
      message: "Success",
      description: `${results?.data?.data} Payees have been successfully registered.`,
    });
    return results?.data;
  } catch (err) {
    // console.error("ERROR ERROR ==>", err.response);
    const errorMessage = err?.response?.data?.error;
    return notification.error({
      message: 'File Error',
      description: errorMessage ? `${errorMessage}` : `Error happened while registering workers try again.`
    });
  }
}

// GET BULK PAYOUT WORKERS IN TEMP TABLE
export const payoutGetBulkTemp = async (payload) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const results = await fixaAPI.get(`custom/temp-payout-paments?payment_id=${payload.payment_id}&_start=${payload.start}&_limit=${payload.limit}&table=${payload.table}`, {
      headers: { authorization },
    });

    return results?.data;
  } catch (err) {
    // console.error("ERROR ERROR ==>", err.response);
    const errorMessage = err?.response?.data?.error;
    return notification.error({
      message: 'File Error',
      description: errorMessage ? `${errorMessage}` : `Error happened while fetching payees try again.`
    });
  }
}

// Save BULK WORKERS IN PAYOUT
export const payoutSaveBulk = async (payment_id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const results = await fixaAPI.delete(`custom/temp-payout-paments/${payment_id}`, {
      headers: { authorization },
    });
    notification.success({
      description: `Payees have been saved successfully`,
      message: 'Success'
    });
    return results?.data;
  } catch (err) {
    // console.error("ERROR ERROR ==>", err.response);
    const error = err?.response?.data?.error;
    const errorMessage = err?.response?.data?.message;

    // console.log("data error", err?.response?.data)
    return notification.error({
      message: 'Failed',
      description: error ? `${errorMessage}` : `Error happened while adding payees to payout please try again.`
    });
  }
}

export const deletePayeePayoutTemp = async (payee_id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const results = await fixaAPI.delete(`temp-payout-paments/${payee_id}`, {
      headers: { authorization },
    });
    notification.success({
      message: "Success",
      description: `Payee have been removed successfully from a payout.`,
    });
    return results?.data;
  } catch (err) {
    // console.error("ERROR ERROR ==>", err.response);
    const errorMessage = err?.response?.data?.error;
    return notification.error({
      message: 'File Error',
      description: errorMessage ? `${errorMessage}` : `Error happened while deleting payee from payout please try again.`
    });
  }
}

export const deletePayoutTemp = async (payment_id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const results = await fixaAPI.delete(`custom/temp-payout-paments/all/${payment_id}`, {
      headers: { authorization },
    });
    notification.success({
      message: "Success",
      description: `Payees have been deleted successfully from a payout.`,
    });
    return results?.data;
  } catch (err) {
    // console.error("ERROR ERROR ==>", err.response);
    const errorMessage = err?.response?.data?.error;
    return notification.error({
      message: 'File Error',
      description: errorMessage ? `${errorMessage}` : `Error happened while deleting payees from payout please try again.`
    });
  }
}

export const searchPayoutTemplList = async (query, payment_id, payout_count) => {
  let searchData = [];
  await get(`payoutTemp_${payment_id}_${payout_count}`)
    .then((response) => {
      // search using custom function
      searchData = onSearchPayoutTemp(query, decodeJSONBase64(response));
    })
    .catch((err) => {
      console.log("ERROR In searching", err);
    });
  return searchData;
};

export const onSearchPayoutTemp = (query, array) => {
  /**
   * @query string to search
   * @array array of objects to search from
   */
  let results = [];
  for (var i = 0; i < array.length; i++) {
    // Looping in the array
    if (array[i] && query.length > 0) {
      // Normalize both query and data in the array & push results into the results.
      if (
        array[i].account_name?.toLowerCase()?.includes(query?.toString().toLowerCase()) ||
        array[i].account_number.includes(query)
      ) {
        results.push(array[i]);
      }
    } else {
      return results;
    }
  }
  return results;
};