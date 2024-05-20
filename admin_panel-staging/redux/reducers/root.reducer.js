import { combineReducers } from "redux";
import payrollReducer from "./payroll.reducer";
import projectReducer from "./project.reducer";
import runPayrollReducer from "./run-payroll.reducer";
import payrollSummaryReducer from "./payroll-summary.reducer";
import deductionsReducer from "./deductions.reducer";
import additionsReducer from "./additions.reducer";
import userReducer from "./user.reducer";
import instantPayrollReducer from "./instant-payroll.reducer";
import instantPayrollTransactionsReducer from "./instant-payroll-transactions";
import workforceReducer from "./workforce.reducer";
import workerprofileReducer from "./workerprofile.reducer";
import smsLogsReducer from "./sms.reducer";

export const rootReducer = combineReducers({
  project: projectReducer,
  payroll: payrollReducer,
  deductions: deductionsReducer,
  run_payroll: runPayrollReducer,
  payroll_summary: payrollSummaryReducer,
  instant_payroll: instantPayrollReducer,
  instant_payroll_transactions: instantPayrollTransactionsReducer,
  instant_payroll_total_transactions: instantPayrollTransactionsReducer,
  workforce: workforceReducer,
  user: userReducer,
  worker_profile: workerprofileReducer,
  additions: additionsReducer,
  smsLogs: smsLogsReducer,
});
