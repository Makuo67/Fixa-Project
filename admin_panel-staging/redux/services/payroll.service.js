import axios from "axios";
import { get } from "idb-keyval";

var token = null;

if (process.browser) {
  token = localStorage.getItem("token");
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

class PayrollService {
  getAll(project_id, year, token) {
    const authorization = token;
    return http.get(`/app/payrolls?project_id=${project_id}&year=${year}`, {
      headers: { authorization },
    });
  }

  getOnePayroll(payroll_id, filters, token) {
    const authorization = token;
    return http.post(`/app/payroll-details/summary`, payroll_id, filters, {
      headers: { authorization },
    });
  }

  postDeductions(deductions, token) {
    const authorization = token;
    return http.post(`/payroll-details-deductions/app`, deductions, {
      headers: { authorization },
    });
  }
  updateDeductions(deductions, token) {
    const authorization = token;
    // return http.post(`/app/payroll-details/deduct/`, deductions);
    return http.put(`/deductions/app/update`, deductions, {
      headers: { authorization },
    });
  }

  updateWorkerStatus(data, to_enable, token) {
    const authorization = token;

    return http.put(
      `/payroll-details/${data.payroll_details_id}`,
      {
        on_hold: to_enable,
      },
      {
        headers: { authorization },
      }
    );
    // if (to_enable) {
    //   return http.post(`/app/payroll-details/enable-worker`, data);
    // } else {
    //   return http.post(`/app/payroll-details/hold-worker`, data);
    // }
  }

  runPayroll(payroll_id, token) {
    const authorization = token;

    // return http.post(`/app/run-payroll/`, payroll_id);
    return http.post(`/app/payroll-details/run-routine-payroll/`, payroll_id, {
      headers: { authorization },
    });
  }

  // getPayrollSummary(payroll_id) {
  //   return http.get(`/app/payroll-summary?payroll_id=${payroll_id}`);
  // }

  getPayrollSummary(payroll_id, filters, token) {
    const authorization = token;

    return http.post(`/app/payroll-details/summary`, payroll_id, filters, {
      headers: { authorization },
    });
  }

  validatePhoneNumbers(payroll_id, token) {
    const authorization = token;

    return http.post(
      `/app/payroll-details/momo/phone/validation/`,
      payroll_id,
      {
        headers: { authorization },
      }
    );
  }

  postAdditions(additions, token) {
    const authorization = token;

    return http.post(`/take-home-increments/app/increment/`, additions, {
      headers: { authorization },
    });
  }

  getRoutinePayrollStatus(payout_id, token) {
    const authorization = token;
    return http.post(
      `/app/payroll-details/check-routine-payroll-transaction-status`,
      payout_id,
      {
        headers: { authorization },
      }
    );
  }
}

export default new PayrollService();
