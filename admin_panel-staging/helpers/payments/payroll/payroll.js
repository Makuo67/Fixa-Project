import { retriveAuthTokenFromLocalStorage } from "../../auth";
import fixaAPI from "../../api";
import queryString from "query-string";
import { get, set } from "idb-keyval";

export const getPayroll = async (payroll_id, queries) => {
  const newQuery = queries;
  delete newQuery.current_page;
  delete newQuery.name;
  delete newQuery._sort;

  try {
    let query_string = "&" + queryString.stringify(newQuery, { encode: false });

    // console.log("get all queries after", query_string);

    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(
      `/payroll-transactions/payroll_transactions/${payroll_id}?payment_id=${payroll_id}` +
      query_string,
      {
        headers: { authorization },
      }
    );
    return response.data.data;
  } catch (e) {
    console.log(e);
  }
};

export const getWorkerShifts = async (worker_id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(
      `/payroll-transactions/attendance_shifts/${worker_id}`,
      {
        headers: { authorization },
      }
    );
    return response.data.data;
  } catch (e) {
    console.log(e);
  }
};

export const getWorkerDeductions = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(
      `/deductions/payroll_deduction/${id}`,
      {
        headers: { authorization },
      }
    );
    return response.data.data;
  } catch (e) {
    console.log(e);
  }
};

export const getPayrollTransactionDetails = async (worker_payroll_id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(
      `/payroll-transactions/payroll_transactions_details/${worker_payroll_id}`,
      {
        headers: { authorization },
      }
    );
    return response.data.data;
  } catch (e) {
    console.log(e);
  }
};

export const addAttendance = async (shifts) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.post(
      `/app/new-attendances/do_multiple_days`,
      shifts,
      {
        headers: { authorization },
      }
    );
    return response.data;
  } catch (e) {
    if (e.response.status === 400 || e.code === 'ERR_BAD_REQUEST') {
      return e.response
    } else {
      return e.response
    }
  }
};

//function to update the attendance of a worker in payroll
export const updateAttendance = async (attendances) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.delete(
      `/app/new-attendances/remove`,

      {
        headers: { authorization },
      }
    );
    return response.data.data;
  } catch (e) {
    if (e.response.status === 400 || e.code === 'ERR_BAD_REQUEST') {
      return e.response
    } else {
      return e.response
    }
  }
};

export const deleteAttendance = async (shift) => {
  // console.log('About to delete shift ',shift);
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.post(`/app/new-attendances/remove`, shift, {
      headers: { authorization },
    });
    // console.log('response deleting shift --> ',response.data);
    return response.data;
  } catch (e) {
    if (e.response.status === 400 || e.code === 'ERR_BAD_REQUEST') {
      return e.response
    } else {
      return e.response
    }
  }
};

export const addDeductions = async (data) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.post(`/deductions/payroll-internal-deduction`, data, {
      headers: { authorization },
    });
    return response.data;
  } catch (e) {
    if (e.response.status === 400 || e.code === 'ERR_BAD_REQUEST') {
      return e.response
    } else {
      return e.response
    }
  }
};

export const deleteDeduction = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.delete(`/deductions/${id}`, {
      headers: { authorization },
    });
    return response.data;
  } catch (e) {
    if (e.response.status === 400 || e.code === 'ERR_BAD_REQUEST') {
      return e.response
    } else {
      return e.response
    }
  }
};

export const removeWorkerFromPayroll = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.delete(
      `/payroll-transactions/delete/${id}`,
      {
        headers: { authorization },
      }
    );
    return response.data;
  } catch (e) {
    console.log(e);
  }
};

export const sendOTP = async (otp) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.post(`/otp-verifications/create-otp`, otp, {
      headers: { authorization },
    });
    return response.data;
  } catch (e) {
    console.log(e);
  }
};

export const sendPaymentOTP = async (otp) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.post(`/otp-verifications/create-otp-payment`, otp, {
      headers: { authorization },
    });
    return response.data;
  } catch (e) {
    // console.log(e.response);
    return e.response
  }
};

export const verifyOTP = async (otp) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.post(`/otp-verifications/verify-otp`, otp, {
      headers: { authorization },
    });
    return response;
  } catch (e) {
    console.log(e);
  }
};

export const verifyPaymentOTP = async (otp) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.post(`/otp-verifications/verify-otp-payment`, otp, {
      headers: { authorization },
    });
    return response;
  } catch (e) {
    console.log(e);
    return e.response
  }
};

export const getPayrollStatus = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(`/payments/all_payments/?_limit=-1`, {
      headers: { authorization },
    });
    const res = response?.data?.data?.find((payment) => payment.id == id);
    return res;
  } catch (e) {
    console.log(e);
  }
};

export const searchPayrollList = async (query) => {
  let searchData = [];
  await get("payroll")
    .then((response) => {
      // search using custom function
      searchData = onSearchPayroll(query, response);
    })
    .catch((err) => {
      console.log("ERROR In searching", err);
    });
  return searchData;
};
export const getPayrollSearchList = async (payroll_id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();

    const response = await fixaAPI.get(
      `/payroll-transactions/payroll_transactions/${payroll_id}?payment_id=${payroll_id}&_limit=-1`,
      {
        headers: { authorization },
      }
    );

    return set("payroll", response.data.data[0]?.workers);
  } catch (e) {
    console.log(e);
  }
};
export const onSearchPayroll = (query, array) => {
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
        array[i].worker_name.toLowerCase().includes(query.toLowerCase()) ||
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
/* ============== GET PAYROLL DEDUCTION DETAILS ============== */
export const getPayrollDeductionDetails = async (id) => {
  try {
    const authorization = await retriveAuthTokenFromLocalStorage();
    const responses = await fixaAPI.get(
      `payroll-transactions/deduction_details/${id}?_limit=-1`,
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