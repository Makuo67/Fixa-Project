import axios from "axios";
import { retriveAuthTokenFromLocalStorage } from "../../helpers/auth";

if (process.browser) {
  // token = localStorage.getItem("token");
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-type": "application/json",
  },
});

class InstantPayrollService {
  getAll(project_id, token) {
    const authorization = token;
    console.log("sent request:", `/instant-payouts?project_id=${project_id}`);
    return http.get(`/instant-payouts?project_id=${project_id}`, {
      headers: { authorization },
    });
  }
  getOne(
    instant_payout_id,
    project_id,
    payroll_type_id,
    _start,
    _limit,
    token
  ) {
    const authorization = token;

    return http.get(
      `/instant-payout-transactions?instant_payout_id=${instant_payout_id}&project_id=${project_id}&payroll_type_id=${payroll_type_id}&_start=${_start}&_limit=${_limit}`,
      {
        headers: { authorization },
      }
    );
  }

  getInstantPayrollTotal(instant_payout_id, token) {
    const authorization = token;

    return http.get(
      `/instant-payout-transactions/count?instant_payout_id=${instant_payout_id}`,
      {
        headers: { authorization },
      }
    );
  }

  getInstantPayrollStatus(instant_payout_id, token) {
    const authorization = token;

    return http.get(`/instant-payouts/status/` + instant_payout_id, {
      headers: { authorization },
    });
  }
  postInstantPayout(data, token) {
    const authorization = token;

    console.log("sent request:", "/instant-payouts", data, {
      headers: { authorization },
    });

    return http.post("/instant-payouts", data, {
      headers: { authorization },
    });
  }
  getInstantPayrollTypes(token) {
    const authorization = token;
    return http.get("/payroll-types", {
      headers: { authorization },
    });
  }
  runInstantPayroll(instant_payroll_id, token) {
    const authorization = token;
    console.log('token', token);

    console.log(`/instant-payouts/run`, instant_payroll_id);
    return http.post(`/instant-payouts/run`, instant_payroll_id, {
      headers: { authorization },
    });
  }
}

export default new InstantPayrollService();
