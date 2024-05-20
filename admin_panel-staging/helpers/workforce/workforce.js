import { notification } from "antd";
import * as XLSX from 'xlsx';
import { set } from 'idb-keyval';

import fixaAPI from '../api';
import { retriveAuthTokenFromLocalStorage } from '../auth';
import { verifyFileColumns } from '../payments/payout/payout';
import { capitalize, capitalizeFirstWordOfEachSentence } from "../capitalize";
import { removeLastEmptyObject } from "@/utils/regexes";

/* =============== Read bulk registration Excel File ===============  */
// TODO: change the logic of this 
export const readBulkExcelFile = async (file) => {
  let response = {
    fileData: '',
    fileName: '',
    fileId: '',
    fileColumns: ''

  }

  if (!file || !file.name) {
    return notification.warning({
      message: 'Invalid File',
      description: 'Please select a file.'
    })
  }
  const fileName = file.name;
  const fileId = file.uid;
  const fileExtension = fileName.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
    return notification.warning({
      message: 'Invalid File',
      description: 'Please select an Excel or CSV file.'
    })
  }

  try {

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
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    const sheetColumns = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, blankrows: true })[0];
    let array_data = [];

    if (!sheetColumns || sheetColumns.length === 0) {
      return notification.error({
        message: 'Failed',
        description: `File Error, unable to read columns. Please reformat your file and try again.`
      })
    }

    for (let index = 0; index < sheetData.length; index++) {
      const item = sheetData[index];

      const newObjectKeys = Object.keys(item).reduce((acc, key, index) => {

        if (!key?.toString().toLowerCase().includes("empty") && sheetColumns[index] !== undefined && sheetColumns[index] !== null && sheetColumns[index] !== '') {
          acc[sheetColumns[index]] = item[key];
        }
        return acc;
      }, {})

      // console.log("item 66", sheetColumns, item);
      array_data.push({ "id": index + 1, ...newObjectKeys });
    }

    response = {
      fileData: removeLastEmptyObject(array_data),
      fileName: fileName,
      fileId: fileId,
      fileColumns: sheetColumns
    }
    // set('recent_file', {file_name: fileName, file_id: fileId});
  } catch (err) {
    // console.log("ERROR in readExcelFile ==>", err.message);
    return notification.error({
      message: 'File Error',
      description: `Failed to parse the file.`
    });
  }
  return response;
}

/* =============== Legacy func Read Workers Excel File ===============  */
export const readWorkersExcelFile = async (file) => {
  try {
    if (!file || !file.name) {
      return notification.warning({
        message: 'Invalid File',
        description: 'Please select a file.'
      })
    }
    const fileName = file.name;
    const fileId = file.uid;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      return notification.warning({
        message: 'Invalid File',
        description: 'Please select an Excel or CSV file.'
      })
    }



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
    // workers file columns
    const expectedColumns = ['firstName', 'lastName', 'idNumber', 'phoneNumber', 'district', 'is_verified', 'service', 'date_of_birth', 'gender', 'daily_earnings'];
    if (verifyFileColumns(sheetColumns, expectedColumns) === false) {
      return notification.error({
        message: 'File Columns Error',
        description: 'File columns are not valid!'
      });
    }
    let body = {
      data: sheetData,
      file_name: fileName,
      file_id: fileId
    }
    const results = await fixaAPI.post(`service-providers/files`, body, {
      headers: { authorization },
    });
    set('recent_file', results?.data?.data);
    return results?.data;
  } catch (err) {
    // console.error("ERROR in readExcelFile ==>", err.response);
    const errorMessage = err?.response?.data?.error;
    return notification.error({
      message: 'File Error',
      description: errorMessage ? `${errorMessage}` : `Failed to parse the file.`
    });
  }
}

/* ============== ASSIGN RATES TO WORKERS ============== */
export const assignRatesToWorkers = async (payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(`workforces/activate-rate-type`, payload, {
      headers: { authorization },
    });
    if (responses?.data.status_code === 200) {
      notification.success({
        message: "SUCCESS",
        description: "Rates assigned to Workers Successfully!",
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
        description: "Rates not assigned to Workers!",
      });
    }
    return responses;
  }
};

/* ============== SUBMIT NID TO RSSB ============== */
export const submitNIDToRSSB = async (id) => {
  let responses = [];
  try {
    let payload = { "nid_number": id };

    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(`service-providers/get-nid-information`, payload, {
      headers: { authorization },
    });

    if (responses?.data.status === 200) {
      notification.success({
        message: "Success",
        description: "NID has been verified.",
      });
    } else if (responses?.data.status == 'failed') {
      notification.error({
        message: "ERROR",
        description: `${responses?.data?.error}`,
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
        message: "ERROR",
        description: `${err?.response?.data?.error}`,
      });
    }
    return responses;
  }
};

/* ============== worker-registration ============== */
export const registerWorker = async (payload) => {
  let responses = [];
  try {
    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.post(`service-providers/single-worker-registration`, payload, {
      headers: { authorization },
    });

    if (responses?.data.status == "success") {
      notification.success({
        message: "Success",
        description: "Worker has been successfully registered.",
      });
    }
    return responses?.data;

  } catch (err) {
    if (err?.response?.data?.error && Array.isArray(err?.response?.data?.error)) {
      const errorMessages = err?.response?.data?.error?.join(", ");
      const capitalizedErrorMessages = capitalizeFirstWordOfEachSentence(errorMessages);
      notification.error({
        message: "Registration error",
        description: capitalizedErrorMessages,
      })
    }
    else if (err?.response?.data?.error && typeof err?.response?.data?.error === 'string') {
      notification.error({
        message: "ERROR",
        description: capitalize(err?.response?.data?.error)
      })
    }
    else if (err?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (err?.response?.data || err?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "ERROR",
        description: "Worker registration failed.",
      });
    }
    else {
      notification.error({
        message: "Error",
        description: `Worker registration failed.`,
      });
    }

    return responses;
  }
};

export const registerWorkersBulk = async (payload) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const results = await fixaAPI.post(`worker/bulk-registration`, payload, {
      headers: { authorization },
    });
    set('recent_file', { file_name: payload.file_name, file_id: payload.file_id });
    // notification.success({
    //   message: "Success",
    //   description: `${results?.data?.message}.`,
    // });
    return results?.data;
  } catch (err) {
    console.error("ERROR ERROR ==>", err.response);
    const errorMessage = err?.response?.data?.message;
    notification.error({
      message: 'Failed',
      description: errorMessage,
    });
  }
}


export const registerWorkerContactDetails = async (id, payload) => {
  let responses = []
  try {

    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.put(`service-providers/update-worker/${id}`, payload, {
      headers: { authorization },
    });

    // console.log("Response man", responses?.data)

    if (responses?.data.status === 200 || responses?.data.status === "success") {
      notification.success({
        message: "Success",
        description: "Worker Information Updated.",
      });
    } else if (responses?.data.status == 'failed') {
      notification.error({
        message: "ERROR",
        description: `${responses?.data?.error}`,
      });
    }
    return responses?.data;
  } catch (error) {
    if (error?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (error?.response?.data || error?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "ERROR",
        description: `${error?.response?.data?.error}`,
      });
    }
    return responses;
  }
}

export const getNextOfKinRelations = async () => {
  let responses = []
  try {

    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`next-of-kin-relations?is_active=true`, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (error) {
    if (error?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (error?.response?.data || error?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "ERROR",
        description: `${error?.response?.data?.error}`,
      });
    }
    return responses;
  }
}

export const getDistricts = async (country_id) => {
  let responses = []
  try {

    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`districts?country=${country_id}`, {
      headers: { authorization },
    });
    return responses?.data;
  } catch (error) {
    if (error?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (error?.response?.data || error?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "ERROR",
        description: `${error?.response?.data?.error}`,
      });
    }
    return responses;
  }
}

/* ======= Create new service ====== */
export const createNewService = async (requestBody) => {
  let response = [];
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const results = await fixaAPI.post('services',
      requestBody,
      {
        headers: { authorization },
      }

    );
    response = results.data;
    notification.success({
      message: "SUCCESS",
      description: "Service has been successfully created.",
    })
  } catch (err) {
    // console.log("Error in creating service ===>", err);
    notification.error({
      message: "ERROR",
      description: "Service creation failed.",
    });
    response = []
  }
  return response;
};
/* ============= GET companies payment methods ============ */
export const getCompanyPaymentMethods = async () => {
  let responses = []
  try {

    let authorization = await retriveAuthTokenFromLocalStorage();
    responses = await fixaAPI.get(`companies/payment-methods`, {
      headers: { authorization },
    });
    return responses?.data?.data;
  } catch (error) {
    if (error?.code === "ERR_NETWORK") {
      notification.warning({
        message: "NETWORK ERROR",
        description: "Connect to a Network and Try again",
      });
    } else if (error?.response?.data || error?.code === "ERR_BAD_REQUEST") {
      notification.error({
        message: "ERROR",
        description: `${error?.response?.data?.error}`,
      });
    }
    return responses;
  }
}
