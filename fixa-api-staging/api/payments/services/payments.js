"use strict";
const MOMO_URL_DISB = process.env.MOMO_URL_DISB;
const pusher_env = process.env.PUSHER_ATTENDANCE_CHANNEL;
const MOMO_PRIMARY_KEY = process.env.MOMO_PRIMARY_KEY;
const MOMO_X_TARGET_ENV = process.env.MOMO_X_TARGET_ENV;
const axios = require("axios");
const { getPayrollWorkers } = require("../../payroll-transactions/services/payroll-transactions");
const { getPayoutWorkers } = require("../../payout-transactions/services/payout-transactions");
const { getTransactions } = require("../../deductions-transactions/services/deductions-transactions");
const { getWorkerDays } = require("../../workforce/services/workforce");
const _ = require('underscore');
const { getMomoToken } = require("../../../config/functions/momotoken");
const { getRssbKycs, generateRssbCode } = require("../../../config/functions/third_part_api_functions");
const utils = require("../../../config/functions/utils");
const { makePaymentWithMtn, checkMtnTransactionStatus } = require("../../../config/functions/make_payment");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async makePayment(payment, otp_id, payment_method_id) {
    try {
      let payee_data = [];
      const { id, status } = payment;

      if (payment) {
        // check payment type
        const payment_type = await strapi.query("payment-types").findOne({ id: payment.payment_types_id });
        // payment method 
        const payment_method = await strapi.query("payment-methods").findOne({ id: payment_method_id });

        if (payment_type) {
          if (payment_method) {
            // check if wallet is available
            const wallet_request = await strapi.query('wallet-request').findOne({ payment_method: payment_method_id });
            if (wallet_request && wallet_request.request_status === 'approved') {
              // get workers
              if (payment_type.type_name === "payroll") {
                // payroll transactions
                payee_data = await getPayrollWorkers(id, status, payment_method_id);

                // restaurant transactions
                const deductions_transactions = await getTransactions(id, status, payment_method_id);
                if (deductions_transactions.length > 0) {
                  payee_data = [...payee_data, ...deductions_transactions];
                }

              }
              if (payment_type.type_name === "payout") {
                // payout transactions
                payee_data = await getPayoutWorkers(id, status, payment_method_id);
              }
              // console.log('payee to pay ',payee_data);
              await strapi.query("payments").update({ id: id }, { status: "open" });
              for (let index = 0; index < payee_data.length; index++) {
                const item_transaction = payee_data[index];

                const opt_verification = await strapi.query("otp-verification").findOne({ id: otp_id });

                if (opt_verification) {

                  if (opt_verification.is_running) {
                    if (payment_method.code_name.toString().toLowerCase() === 'mtn') { // run transactions for MTN

                      // make payment
                      let response_payment = await makePaymentWithMtn(item_transaction);

                      let payment_transaction_track = {};
                      // update payroll transaction table (paying)
                      if (item_transaction.payment_type_name === "payroll") {
                        // update payment transaction tracks
                        payment_transaction_track = await strapi.query("payment-transaction-tracks").create({
                          payroll_payout_transaction_id: item_transaction.id,
                          reference_id: item_transaction.reference_id,
                          payments_id: item_transaction.payment_id,
                          is_deduction: false,
                          status: "initiated",
                          payed_time: Date.now(),
                          momo_msg: !item_transaction.account_number ? "Incorrect account number" : "",
                          trial: 0,
                          payment_method_id: payment_method_id,
                          is_rerun: false
                        });
                        await strapi.query("payroll-transactions").update({ id: item_transaction.id }, { status: "initiated" });
                      }
                      // update payout transaction table (paying)
                      if (item_transaction.payment_type_name === "payout") {
                        await strapi.query("payout-transactions").update({ id: item_transaction.id }, { status: "initiated" });
                        // update payment transaction tracks
                        payment_transaction_track = await strapi.query("payment-transaction-tracks").create({
                          payroll_payout_transaction_id: item_transaction.id,
                          reference_id: item_transaction.reference_id,
                          payments_id: item_transaction.payment_id,
                          is_deduction: false,
                          status: "initiated",
                          payed_time: Date.now(),
                          momo_msg: !item_transaction.account_number ? "Incorrect account number" : "",
                          trial: 0,
                          payment_method_id: payment_method_id,
                          is_rerun: false
                        });
                      }
                      // update deduction transaction table (paying)
                      if (item_transaction.payment_type_name === "deduction") {
                        // update payment transaction tracks
                        payment_transaction_track = await strapi.query("payment-transaction-tracks").create({
                          payroll_payout_transaction_id: item_transaction.id,
                          reference_id: item_transaction.reference_id,
                          payments_id: item_transaction.payment_id,
                          is_deduction: true,
                          status: "initiated",
                          payed_time: Date.now(),
                          momo_msg: !item_transaction.account_number ? "Incorrect account number" : "",
                          trial: 0,
                          payment_method_id: payment_method_id,
                          is_rerun: false
                        });
                        await strapi.query("deductions-transactions").update({ id: item_transaction.id }, { status: "initiated" });
                      }
                      // notify using pusher
                      utils.eventPublisher(`transaction-status-${pusher_env}-${id}`, {
                        entity_id: item_transaction.id,
                        status: "initiated",
                      });

                      // check transaction status
                      let response_payment_status = await checkMtnTransactionStatus(payment_transaction_track);
                      let response_momo = "";
                      let status_momo = "failed";
                      if (response_payment_status.status === 'success') {
                        status_momo = response_payment_status.data.status ? getCorrectStatusMomo(response_payment_status.data.status) : "failed";
                        if (response_payment_status.data.status && response_payment_status.data.status.toLowerCase() === "successful") {
                          response_momo = `Phone number (${response_payment_status.data.payee.partyId}) has received ${response_payment_status.data.amount}RWF. For ${response_payment_status.data.payeeNote}. Financial Transaction Id: ${response_payment_status.data.financialTransactionId}.`;
                        } else {
                          response_momo = response_payment_status.data.reason;
                        }

                        // update payment methods
                        await strapi.query("payment-transaction-tracks").update({ id: payment_transaction_track.id },
                          {
                            status: response_payment_status.data.status ? response_payment_status.data.status : "not-found",
                            payed_time: Date.now(),
                            momo_msg: response_payment_status.data.status ? response_momo : `No status available ${response_momo}`,
                          }
                        );
                        // update payroll transaction table (payment_status)
                        if (item_transaction.payment_type_name === "payroll") {
                          await strapi.query("payroll-transactions").update({ id: item_transaction.id }, { status: status_momo });
                        }
                        // update payout transaction table (payment_status)
                        if (item_transaction.payment_type_name === "payout") {
                          await strapi.query("payout-transactions").update({ id: item_transaction.id }, { status: status_momo });
                        }
                        // update deduction transaction table (payment_status)
                        if (item_transaction.payment_type_name === "deduction") {
                          await strapi.query("deductions-transactions").update({ id: item_transaction.id }, { status: status_momo });
                        }
                        // notify using pusher
                        utils.eventPublisher(`transaction-status-${pusher_env}-${id}`, {
                          entity_id: item_transaction.id,
                          status: status_momo,
                        });
                      } else {
                        // update payment methods
                        await strapi.query("payment-transaction-tracks").update({ id: payment_transaction_track.id },
                          {
                            status: "error-catch",
                            payed_time: Date.now(),
                            momo_msg: response_payment_status.message,
                          }
                        );
                        // update payroll transaction table (payment_status)
                        if (item_transaction.payment_type_name === "payroll") {
                          await strapi.query("payroll-transactions").update({ id: item_transaction.id }, { status: 'failed' });
                        }
                        // update payout transaction table (payment_status)
                        if (item_transaction.payment_type_name === "payout") {
                          await strapi.query("payout-transactions").update({ id: item_transaction.id }, { status: 'failed' });
                        }
                        // update deduction transaction table (payment_status)
                        if (item_transaction.payment_type_name === "deduction") {
                          await strapi.query("deductions-transactions").update({ id: item_transaction.id }, { status: 'failed' });
                        }
                        // notify using pusher
                        utils.eventPublisher(`transaction-status-${pusher_env}-${id}`, {
                          entity_id: item_transaction.id,
                          status: 'failed',
                        });
                      }
                    }

                  }
                }

              }

              // set isrunning to false for otp
              await strapi.query("otp-verification").update({ id: otp_id }, { is_running: false });
            }
          }
        }
      }
    } catch (error) {
      console.log('Error in makePayment() ', error);
    }
  },
  async getWorkerNetAmount(declared_month, project_id, user_id, passed_rra_taxes_id, mode) {
    let response = { message: "", rra_taxe: {}, excel_data: [] };
    let is_generate_rssb_code = false;
    try {
      let rra_taxes;
      const taxes_dates = utils.getStartEndDateTaxes(declared_month);
      const getPaymentType = await strapi.query("payment-types").findOne({ type_name: "payroll" });
      if (getPaymentType) {
        let getPayments = [];
        if (parseInt(project_id) >= 1) {
          getPayments = await strapi.query("payments").find({ start_date_gte: taxes_dates.start_date, end_date_lte: taxes_dates.end_date, payment_types_id: getPaymentType.id, project_id: project_id, _limit: -1 });
          if (process.env.RSSB_GENERATE && process.env.RSSB_GENERATE.toString() === 'true') {
            is_generate_rssb_code = true;
          }
        } else {
          getPayments = await strapi.query("payments").find({ start_date_gte: taxes_dates.start_date, end_date_lte: taxes_dates.end_date, payment_types_id: getPaymentType.id, _limit: -1 });
        }

        if (getPayments.length > 0) {
          let payment_ids = getPayments.map(index => index.id);
          let getPayrollTransactions = await strapi.query("payroll-transactions").find({ payment_id: payment_ids, _limit: -1 });
          let payrollTransactionsClean = getPayrollTransactions.map((payrollTransaction) => ({ worker_id: payrollTransaction.worker_id, take_home: payrollTransaction.take_home }));
          let payments_payrolls_claims = await strapi.query("payments").find({ payment_id_claim: payment_ids, is_claim: true, _limit: -1 });
          let payments_payrolls_claims_ids = payments_payrolls_claims.map(item => item.id);
          let payout_transaction_claims = [];
          let payout_transactions_cleaned = [];
          if (payments_payrolls_claims_ids.length > 0) {
            payout_transaction_claims = await strapi.query("payout-transactions").find({ payment_id: payments_payrolls_claims_ids, _limit: -1 });
            payout_transactions_cleaned = payout_transaction_claims.map((payoutTransaction) => ({ worker_id: payoutTransaction.worker_id, take_home: payoutTransaction.amount }));
          }
          let getPayrollTransaction = payrollTransactionsClean.concat(payout_transactions_cleaned);

          if (getPayrollTransaction) {
            const sumByWorker = {};
            for (const item of getPayrollTransaction) {
              const { worker_id, take_home } = item;
              if (worker_id) {
                if (sumByWorker[worker_id]) {
                  sumByWorker[worker_id] += parseInt(take_home);
                } else {
                  sumByWorker[worker_id] = parseInt(take_home);
                }
              }
            }

            const sumsArray = Object.entries(sumByWorker).map(([worker_id, take_home]) => ({ worker_id: parseInt(worker_id), take_home }));
            let workerWithRSSB = [];
            if (mode.includes("_")) {
              workerWithRSSB = { permanent: [], casual: [] };
            } else {
              workerWithRSSB = [];
            }
            console.log(`*********** STARTING CALCULATING TAXES FOR ${sumsArray.length} WORKERS ********************`);
            let sum_workers_rssb = 0;
            if (passed_rra_taxes_id && !mode.includes("_")) {
              await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id }, { status: 'pending' });
            } else {
              await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id.permanent_id }, { status: 'pending' }); //permanent_id
              await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id.casual_id }, { status: 'pending' }); //casual_id
            }
            for (let i = 0; i < sumsArray.length; i++) {
              let worker_info = {};
              let rssb_code = "";
              sum_workers_rssb = sum_workers_rssb + 1;
              if (sumsArray[i].worker_id && parseInt(sumsArray[i].take_home.toString()) >= parseInt(process.env.DEFAULT_WORKING_NET_AMOUNT.toString())) {
                let knex = strapi.connections.default;
                let worker_data_sql_raw = `SELECT id,rssb_code,nid_number,last_name,first_name,gender FROM service_providers WHERE id=${sumsArray[i].worker_id}`;
                let worker_data_sql_data = await knex.raw(worker_data_sql_raw);
                if (worker_data_sql_data && worker_data_sql_data[0].length >= 1) {
                  worker_info = JSON.parse(JSON.stringify(worker_data_sql_data[0][0]));
                  if (mode.includes("_")) { //Two type of taxes
                    if (worker_info && await validatePermanentWorker(worker_info.id, project_id, taxes_dates.end_date)) { //permanent workers
                      rssb_code = worker_info.rssb_code ? worker_info.rssb_code : "";
                      if (is_generate_rssb_code && !utils.rssbCodeValidation(rssb_code)) {
                        let rssb_status = await createRssbCode(worker_info.id, worker_info.nid_number);
                        if (rssb_status.status === true) {
                          rssb_code = rssb_status.code;
                        }
                      }
                      workerWithRSSB.permanent.push(pushIntoWorkerForTaxes(sumsArray[i], "permanent", rssb_code, worker_info));
                    } else { //casual workers
                      rssb_code = worker_info.rssb_code ? worker_info.rssb_code : "";
                      if (is_generate_rssb_code && !utils.rssbCodeValidation(rssb_code)) {
                        let rssb_status = await createRssbCode(worker_info.id, worker_info.nid_number);
                        if (rssb_status.status === true) {
                          rssb_code = rssb_status.code;
                        }
                      }
                      workerWithRSSB.casual.push(pushIntoWorkerForTaxes(sumsArray[i], "casual", rssb_code, worker_info));
                    }
                  } else { //One type of taxes
                    if (mode === "permanent") {
                      if (worker_info && await validatePermanentWorker(worker_info.id, project_id, taxes_dates.end_date)) {
                        rssb_code = worker_info.rssb_code ? worker_info.rssb_code : "";
                        if (is_generate_rssb_code && !utils.rssbCodeValidation(rssb_code)) {
                          let rssb_status = await createRssbCode(worker_info.id, worker_info.nid_number);
                          if (rssb_status.status === true) {
                            rssb_code = rssb_status.code;
                          }
                        }
                        workerWithRSSB.push(pushIntoWorkerForTaxes(sumsArray[i], "permanent", rssb_code, worker_info));
                      }
                    } else {
                      if (worker_info) {
                        rssb_code = worker_info.rssb_code ? worker_info.rssb_code : "";
                        if (is_generate_rssb_code && !utils.rssbCodeValidation(rssb_code)) {
                          let rssb_status = await createRssbCode(worker_info.id, worker_info.nid_number);
                          if (rssb_status.status === true) {
                            rssb_code = rssb_status.code;
                          }
                        }
                        workerWithRSSB.push(pushIntoWorkerForTaxes(sumsArray[i], "casual", rssb_code, worker_info));
                      }
                    }
                  }
                }
              }
              console.log(sum_workers_rssb, ". worker-id: ", sumsArray[i].worker_id, '| RSSB-CODE: ', rssb_code, "| Nid-number:", worker_info.nid_number, `calculate-taxes-${process.env.PUSHER_ATTENDANCE_CHANNEL}-${declared_month}-${project_id}: ${utils.calculatePercentage(sum_workers_rssb, 0, sumsArray.length)}`);

              utils.eventPublisher(`calculate-taxes-${process.env.PUSHER_ATTENDANCE_CHANNEL}-${declared_month}-${project_id}`, {
                entity_id: `${declared_month}-${project_id}`,
                status: utils.calculatePercentage(sum_workers_rssb, 0, sumsArray.length),
              });

            }

            if (!mode.includes("_")) { //One type of taxes
              if (workerWithRSSB.length >= 1) {
                response = await createTaxesTransactions(workerWithRSSB, declared_month, user_id, project_id, passed_rra_taxes_id, rra_taxes, response);
              } else {
                await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id }, { status: 'finished' });
                response.message = "No workers Found for Taxes";
              }
            } else {  //Two type of taxes
              if (workerWithRSSB.permanent.length >= 1 || workerWithRSSB.casual.length >= 1) {
                if (workerWithRSSB.permanent.length >= 1) {
                  response = await createTaxesTransactions(workerWithRSSB.permanent, declared_month, user_id, project_id, passed_rra_taxes_id.permanent_id, rra_taxes, response);
                } else {
                  await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id.permanent_id }, { status: 'finished' });
                }

                if (workerWithRSSB.casual.length >= 1) {
                  response = await createTaxesTransactions(workerWithRSSB.casual, declared_month, user_id, project_id, passed_rra_taxes_id.casual_id, rra_taxes, response);
                } else {
                  await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id.casual_id }, { status: 'finished' });
                }
              } else {
                response.message = "No workers Found for Taxes";
                await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id.permanent_id }, { status: 'finished' });
                await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id.casual_id }, { status: 'finished' });
              }
            }
          } else {
            response.message = "No payroll-transactions found";
          }
        } else {
          response.message = "No payments found";
          if (mode.includes("_")) {
            await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id.permanent_id }, { status: 'finished' }); //permanent
            await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id.casual_id }, { status: 'finished' }); //casual
          } else {
            await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id }, { status: 'finished' });
          }

        }
      }
    } catch (error) {
      console.log("Error in getWorkerNetAmount", error);
    }
    return response;
  },
  async getPayrollTransactions(attendance_ids) {
    const knex = strapi.connections.default;
    let attendance_workers = [];
    const worker_data_sql_raw = `SELECT 
    t5.shift_id,
    t7.name AS shift_name,
    t5.project_id,
    t1.assigned_worker_id,
    t1.working_time,
    t4.name AS service,
    t4.id AS service_id,
    t2.value AS daily_rate,
    t6.id AS worker_id,
    t6.first_name,
    t6.last_name,
    t6.phone_number,
    t6.nid_number,
    t6.is_momo_verified_and_rssb,
    t6.is_momo_verified_and_rssb_desc,
    t1.id as attendance_id
    FROM attendance_details AS t1
    LEFT JOIN worker_rates as t2 ON t2.id = t1.worker_rate_id
    LEFT JOIN new_assigned_workers AS t3 ON t3.id = t1.assigned_worker_id
    LEFT JOIN services as t4 ON t1.worker_service_id = t4.id
    LEFT JOIN new_attendances as t5 ON t5.id = t1.attendance_id
    LEFT JOIN service_providers AS t6 ON t6.id = t3.worker_id
    LEFT JOIN shifts AS t7 ON t7.id = t5.shift_id
    WHERE t1.attendance_id IN (${attendance_ids})`;
    const attendance_workers_data = await knex.raw(worker_data_sql_raw);
    if (attendance_workers) {
      attendance_workers = JSON.stringify(attendance_workers_data[0]);
    }
    return attendance_workers;
  },
  async getPaymentDetails(payment) {
    let transactions = [];
    let total_amount_to_be_payed = 0
    let payment_details = {};
    let getPaymentType = await strapi
      .query("payment-types")
      .findOne({ id: payment.payment_types_id });
    if (getPaymentType.type_name.toLowerCase() === "payout") {
      transactions = await strapi
        .query("payout-transactions")
        .find({ payment_id: payment.id, _limit: -1 });

      total_amount_to_be_payed = transactions.reduce((sum, item) => {
        return sum + parseInt(item.amount);
      }, 0);
    } else {
      transactions = await strapi
        .query("payroll-transactions")
        .find({ payment_id: payment.id, _limit: -1 });

      total_amount_to_be_payed = transactions.reduce((sum, item) => {
        return sum + parseInt(item.take_home);
      }, 0);
    }

    if (payment.status.toLowerCase() === "unpaid") {
      payment_details = {
        done_by_name: payment.done_by_name,
        done_at: payment.added_on,
        total_to_be_disbursed: total_amount_to_be_payed,
      };
    } else {
      let paid_transactions = 0;
      let failed_transactions = 0;
      if (getPaymentType.type_name.toLowerCase() === "payout") {
        paid_transactions = await strapi
          .query("payout-transactions")
          .find({ payment_id: payment.id, status: "successful", _limit: -1 });
        failed_transactions = await strapi
          .query("payout-transactions")
          .find({ payment_id: payment.id, status: "failed", _limit: -1 });
      } else {
        paid_transactions = await strapi
          .query("payroll-transactions")
          .find({ payment_id: payment.id, status: "successful", _limit: -1 });
        failed_transactions = await strapi
          .query("payroll-transactions")
          .find({ payment_id: payment.id, status: "failed", _limit: -1 });
      }
      payment_details = {
        done_by_name: payment.done_by_name,
        done_at: payment.added_on,
        total_to_be_disbursed: total_amount_to_be_payed,
        failed_transactions: failed_transactions.length,
        paid_transactions: paid_transactions.length,
      };
    }
    return payment_details;
  },
  async checkIfPaymentExist(date, project_id, assigned_worker_id) {
    let response;
    let payment_type = await strapi.query("payment-types").findOne({ type_name: "payroll" });

    let payment = await strapi.query("payments").findOne({
      payment_types_id: payment_type.id,
      start_date_lte: date,
      end_date_gte: date,
      project_id: project_id,
    });

    if (payment) {
      let deductions_transactions = await strapi.query("deductions-transactions").find({ payment_id: payment.id });
      let payroll_transaction = await strapi
        .query("payroll-transactions")
        .findOne({
          payment_id: payment.id,
          assigned_worker_id: assigned_worker_id,
        });

      if (payroll_transaction && deductions_transactions.length === 0) {
        response = {
          status: 200,
          payment_id: payment.id,
          payroll_transaction_id: payroll_transaction.id,
          status_payment: payment.status,
        };
      } else {
        response = {
          status: 201,
          payment_id: payment.id,
          payroll_transaction_id: 0,
          status_payment: payment.status,
        };
      }
    } else {
      response = {
        status: 404,
        payment_id: 0,
        payroll_transaction_id: 0,
        status_payment: "",
      };
    }
    return response;
  },
  async checkStatus(payment) {
    try {
      let all_transactions = [];
      let transactions_data = [];
      let count_successful_transaction = 0;
      let getPaymentType = await strapi
        .query("payment-types")
        .findOne({ id: payment.payment_types_id });
      if (getPaymentType.type_name === "payout") {
        all_transactions = await strapi
          .query("payout-transactions")
          .find({ payment_id: payment.id, _limit: -1 });
      } else {
        all_transactions = await strapi
          .query("payroll-transactions")
          .find({ payment_id: payment.id, _limit: -1 });
      }

      let transactions_filtered = all_transactions.filter((item) => {
        if (item.status) {
          if (item.status.toLowerCase() != 'successful') {
            return item;
          }
        }
      });

      // console.log("transactions",transactions);
      for (let index = 0; index < transactions_filtered.length; index++) {
        let item_transaction = transactions_filtered[index];
        let payroll_payout_transaction = await strapi
          .query("payment-transaction-tracks")
          .findOne({
            payroll_payout_transaction_id: item_transaction.id,
            payments_id: item_transaction.payment_id,
            // status: "initiated",
            _sort: "created_at:DESC"
          });
        if (payroll_payout_transaction) {
          item_transaction.reference_id = payroll_payout_transaction.reference_id;
          item_transaction.payment_transaction_id = payroll_payout_transaction.id;
          item_transaction.momo_status = payroll_payout_transaction.status;
          transactions_data.push(item_transaction);
        }

      }
      let transactions = transactions_data.filter((item) => {
        if (item.momo_status) {
          if (item.momo_status.toLowerCase() != 'successful') {
            return item;
          }
        }
      });


      const pathname = MOMO_URL_DISB + "v1_0/transfer/";
      const headers = {
        "Content-Length": 0,
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
        "X-Target-Environment": MOMO_X_TARGET_ENV,
        Authorization: null,
      };


      for (let i = 0; i < transactions.length; i++) {
        if (transactions[i].reference_id) {
          let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
          headers["Authorization"] = `Bearer ${access_token}`;
          await axios
            .get(pathname + transactions[i].reference_id, {
              headers: headers,
            })
            .then(async (resp) => {
              let response_momo = "";
              let status_momo = resp.data.status ? getCorrectStatusMomo(resp.data.status) : "failed";
              if (resp.data.status && resp.data.status.toLowerCase() === "successful") {
                count_successful_transaction++;
                response_momo = `Phone number (${resp.data.payee.partyId}) has received ${resp.data.amount}RWF. For ${resp.data.payeeNote}. Financial Transaction Id: ${resp.data.financialTransactionId}.`;
                //update the phone number payroll
                let phone_to_verify = resp.data.payee.partyId.replace('25', '');
                let workerExist = await strapi.quey("workforce").findOne({ phone_number: phone_to_verify });
                if (workerExist) {
                  strapi
                    .query("workforce")
                    .update(
                      { phone_number: phone_to_verify },
                      {
                        is_phone_number_verified: 1,
                      }
                    )
                    .then((data) => {
                      strapi
                        .query("service-providers")
                        .update(
                          { phone_number: phone_to_verify },
                          {
                            is_verified: 1,
                          }
                        )
                    });
                }

              } else {
                response_momo = resp.data.reason;
              }
              strapi
                .query("payment-transaction-tracks")
                .update(
                  { id: transactions[i].payment_transaction_id },
                  {
                    status: resp.data.status ? resp.data.status : 'not-found',
                    payed_time: Date.now(),
                    momo_msg: resp.data.status ? response_momo : `No status available ${response_momo}`

                  }
                )
                .then((data) => {
                  if (getPaymentType.type_name === "payout") {
                    strapi
                      .query("payout-transactions")
                      .update(
                        { id: transactions[i].id },
                        {
                          status: status_momo,
                        }
                      )
                      .then((data) => {
                        if (i === (transactions.length - 1)) {
                          utils.eventPublisher(`transaction-status-${pusher_env}-${transactions[i].payment_id}`, {
                            entity_id: transactions[i].id,
                            status: status_momo,
                            done: true
                          });
                        } else {
                          utils.eventPublisher(`transaction-status-${pusher_env}-${transactions[i].payment_id}`, {
                            entity_id: transactions[i].id,
                            status: status_momo,
                            done: false
                          });
                        }

                      }

                      );
                  } else {
                    strapi
                      .query("payroll-transactions")
                      .update(
                        { id: transactions[i].id },
                        {
                          status: status_momo,
                        }
                      )
                      .then((data) => {
                        if (i === (transactions.length - 1)) {
                          utils.eventPublisher(`transaction-status-${pusher_env}-${transactions[i].payment_id}`, {
                            entity_id: transactions[i].id,
                            status: status_momo,
                            done: true
                          });
                        } else {
                          utils.eventPublisher(`transaction-status-${pusher_env}-${transactions[i].payment_id}`, {
                            entity_id: transactions[i].id,
                            status: status_momo,
                            done: false
                          });
                        }

                      });
                  }
                });
            })
            .catch((error) => {

              console.log("ERROR checking payment status===>:", error.message);
              if (getPaymentType.type_name === "payout") {
                strapi
                  .query("payout-transactions")
                  .update(
                    { id: transactions[i].id },
                    {
                      status: "failed",
                    }
                  )
                  .then((data) => {
                    if (i === (transactions.length - 1)) {
                      // console.log(i,". Transaction id :: ",transactions[i].id," status :: failed");
                      utils.eventPublisher(`transaction-status-${pusher_env}-${transactions[i].payment_id}`, {
                        entity_id: transactions[i].id,
                        status: "failed",
                        done: true
                      });
                    } else {
                      utils.eventPublisher(`transaction-status-${pusher_env}-${transactions[i].payment_id}`, {
                        entity_id: transactions[i].id,
                        status: "failed",
                        done: false
                      });
                    }

                  });
              } else {
                strapi
                  .query("payroll-transactions")
                  .update(
                    { id: transactions[i].id },
                    {
                      status: "failed",
                    }
                  )
                  .then((data) => {
                    if (i === (transactions.length - 1)) {
                      utils.eventPublisher(`transaction-status-${pusher_env}-${transactions[i].payment_id}`, {
                        entity_id: transactions[i].id,
                        status: "failed",
                        done: true
                      });
                    } else {
                      utils.eventPublisher(`transaction-status-${pusher_env}-${transactions[i].payment_id}`, {
                        entity_id: transactions[i].id,
                        status: "failed",
                        done: false
                      });
                    }

                  });
              }
              strapi
                .query("payment-transaction-tracks")
                .update(
                  { id: transactions[i].payment_transaction_id },
                  {
                    status: 'error-catch',
                    payed_time: Date.now(),
                    momo_msg: error.message

                  }
                )
            });
        }
      }

      //to close the payment status automatically
      if (count_successful_transaction === all_transactions.length) {
        await strapi.services["payments"].update({ id: payment.id }, { status: 'closed' });
      }
    } catch (error) {
      console.log("Error happened in /transaction-cron-logs/find()", error);
    }
  },
  async momoCheckBalance() {
    const response = { status: false, message: '', data: {} };
    try {
      const { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
      const momo_balance = await axios.get(MOMO_URL_DISB + "v1_0/account/balance", {
        headers: {
          "Content-Length": 0,
          Accept: "*/*",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
          "X-Target-Environment": MOMO_X_TARGET_ENV,
          Authorization: `Bearer ${access_token}`,
        },
      });
      if (momo_balance.status === 200) {
        response.status = true;
        response.message = 'success';
        response.data = momo_balance.data;
      } else {
        response.status = false;
        response.message = 'Checking balance failed';
        response.data = momo_balance.data;
      }
    } catch (error) {
      console.log('error in momoCheckBalance()', error.message);
      response.message = error.message;
    }
    return response;
  },
};
// get correct momo status
function getCorrectStatusMomo(status) {
  let status_momo = "failed";
  if (status) {
    if (status.toLowerCase() === 'successful') {
      status_momo = 'successful';
    } else if (status.toLowerCase() === 'pending') {
      status_momo = 'pending';
    } else {
      status_momo = 'failed';
    }
  }
  return status_momo;
}
// generate rssb number
async function createRssbCode(worker_id, nid_number) {
  let rssb_status = { status: false, code: "" };
  try {
    let responseKycs = await getRssbKycs(nid_number);
    if (responseKycs.status) {
      let maskedPhoneNumberId = responseKycs.data.phoneNumbers[0]['id'];
      const rssbPayload = {
        nationalId: nid_number,
        maskedPhoneNumberId
      };
      let responseGenerateCode = await generateRssbCode(rssbPayload);
      if (responseGenerateCode.status) {
        let updateWorker = await strapi.query('service-providers').update({ id: worker_id }, { rssb_code: responseGenerateCode.data.rssbNumber });
        if (updateWorker) {
          await strapi.query('workforce').update({ worker_id: worker_id }, { worker_type: "permanent" });
        }
        rssb_status = { status: true, code: responseGenerateCode.data.rssbNumber };
      }
    } else {
      rssb_status = { status: true, code: "Not-found" }; //kyc not
    }
  } catch (error) {
    console.log('error in createRssbCode()', error.message);
    rssb_status = { status: false, code: "" };
  }
  return rssb_status;
}
// check permanent
async function validatePermanentWorker(worker_id, project_id, end_date) {
  let isPermanent = false;
  let projectId = parseInt(project_id.toString()) > 0 ? project_id : 0;
  let workerForceInfo = await getWorkerDays([worker_id], projectId, end_date);
  if (workerForceInfo.length > 0) {
    if (parseInt(workerForceInfo[0].working_days.toString()) >= parseInt(process.env.DEFAULT_WORKING_DAYS.toString())) { //TODO >=30
      isPermanent = true;
    }
  }
  return isPermanent;
}
// calaculate Gross salary
function calculateGross(take_home, mode) {
  let net_amount = parseInt(take_home);
  if (mode === "permanent") {
    if (net_amount < 57730) {
      return net_amount / 0.962165;
    } else if (net_amount < 92237) {
      return (net_amount - 5970) / 0.862665
    } else if (net_amount < 168553) {
      return (net_amount - 15920) / 0.763165
    } else {
      return (net_amount - 35820) / 0.663665
    }
  } else {
    if (net_amount >= 60000) {
      return (net_amount - 8955) / 0.812915;
    } else {
      return net_amount / 0.962165;
    }
  }
}
// calaculate paye 
function calculatePaye(gross, mode) {
  let paye = 0;
  let gross_amount = parseInt(gross.toString());
  if (mode === "permanent") {
    if (gross_amount >= 200000) {
      paye = ((gross_amount - 200000) * 0.3) + 24000;
    } else if (gross_amount >= 100000) {
      paye = ((gross_amount - 100000) * 0.2) + 4000;
    } else if (gross_amount >= 60000) {
      paye = ((gross_amount - 60000) * 0.1);
    } else {
      paye = (gross_amount * 0);
    }
  } else {
    if (gross_amount >= 60000) {
      paye = (gross_amount - 60000) * 0.15; //(Gross - 60000) * 0.15
    } else {
      paye = (gross_amount * 0);
    }
  }

  return paye;
}
// calaculate employeePension 
function calculateEmployeePension(gross) {
  let employeePension = 0;
  if (gross) {
    employeePension = gross * 0.03;
  }
  return employeePension;
}
// calaculate employeeMaternity 
function calculateEmployeeMaternity(gross) {
  let employeeMaternity = 0;
  if (gross) {
    employeeMaternity = gross * 0.003;
  }
  return employeeMaternity;
}
// calaculate employerPension 
function calculateEmployerPension(gross) {
  let employerPension = 0;
  if (gross) {
    employerPension = gross * 0.05;
  }
  return employerPension;
}
// calaculate employerMaternity 
function calculateEmployerMaternity(gross) {
  let employerMaternity = 0;
  if (gross) {
    employerMaternity = gross * 0.003;
  }
  return employerMaternity;
}
// calaculate cbhi 
function calculateCBHI(amountForCBHI) {
  let cbhi = 0;
  if (amountForCBHI) {
    cbhi = amountForCBHI * 0.005;
  }
  return cbhi;
}

function pushIntoWorkerForTaxes(sumsArray, mode, rssb_code, worker_info) {
  let grossAmount = calculateGross(sumsArray.take_home, mode);
  let payeAmount = calculatePaye(grossAmount, mode);
  let employeePension = calculateEmployeePension(grossAmount);
  let employeeMaternity = calculateEmployeeMaternity(grossAmount);
  let employerPension = calculateEmployerPension(grossAmount);
  let employerMaternity = calculateEmployerMaternity(grossAmount);
  let amountForCBHI = grossAmount - (payeAmount + employeePension + employeeMaternity);
  let cbhi = calculateCBHI(amountForCBHI);
  let verified_net = grossAmount - (payeAmount + employeePension + employeeMaternity + cbhi);
  sumsArray.A = rssb_code; //Employee RSSB No/No d'affiliation de l'employé
  sumsArray.B = worker_info.nid_number; //Employee National ID/ No de la carte d'identité
  sumsArray.C = worker_info.last_name; //Employee Last Name/ Nom de l'employé
  sumsArray.D = worker_info.first_name; //Employee First Name/Prenom de l'employé
  sumsArray.E = (worker_info.gender && worker_info.gender.toLowerCase() === "female") ? "F" : "M"; //Sex M-Male F- Female
  sumsArray.F = "O"; //Return Type/Type de declaration O-Original R- Revised
  sumsArray.G = "N"; //Is the Employer RAMA member ? If Yes put Y or if No put N
  sumsArray.H = grossAmount; //Basic Salary/Salaire de Base
  sumsArray.I = 0; //Benefit in Kind Transport/ Indemnités de transport en nature
  sumsArray.J = 0; //Benefit in Kind House/ Indemnités de logement en nature
  sumsArray.K = 0; //Other Benefits in Kind/ Autre indemnités en nature
  sumsArray.L = 0; //Cash Allowance Transport/Indemnités de transport en numéraire
  sumsArray.M = 0; //Cash Allowance House/ Indemnités de logement en numéraire
  sumsArray.N = 0; //Other cash Allowance/ Autre Indemnités en numéraire
  sumsArray.O = 0; //Terminal Benefits-end contract/ Décomptes finals fin de contrant
  sumsArray.P = 0; //Retirement Benefits / Décomptes finals à retraite
  sumsArray.Q = 0; //Other recognized medical deductions / Autre déductions medicales reconnues
  sumsArray.R = grossAmount; //PAYE Taxable Base/Salaire Brut
  sumsArray.S = payeAmount; //PAYE Due/TPR à payer
  sumsArray.T = grossAmount; //Pension Base/ Assiette des cotisations en Pension
  sumsArray.U = employeePension; //Employee 3% Pension/ Part personnel
  sumsArray.V = employerPension; //Employer 3% Pension/ Part Patronale
  sumsArray.W = 0; //Employer 2% Occupational Hazards(OH)/ Part Patronale aux risques professionels 
  sumsArray.X = 0; //Total PENSION & OH Contributions/ Cotisations Totales en Pension et au RP 
  sumsArray.Y = employeeMaternity; //Employee 0.3% Maternity( (T-O)0.3%) )/Part Personnel des cotisations Maternité
  sumsArray.Z = employerMaternity; //Employer 0.3% Maternity( (T-O)0.3%) )/Part Patronales des Cotisations Maternité
  sumsArray.AA = employeeMaternity + employerMaternity; //Total Maternity leave Contributions(0.6%)/Cotisations Totales Maternité
  sumsArray.AB = 0; //Employee 7.5% RAMA/ Part Personnel RAMA
  sumsArray.AC = 0; //Employer 7.5% RAMA/ Part Patronale RAMA
  sumsArray.AD = 0; //Total RAMA (15%)/ Cotisations Totales en RAMA
  sumsArray.AE = cbhi; //Employee CBHI Subsidies (0.5%)/Subventions au regime des Mutuelles de Santé.
  if (mode === "casual") {
    sumsArray.AF = "C"; //Job Type/Type d'emploi C-Casual Worker/Occassionels
  }
  sumsArray.verified_net = verified_net;
  sumsArray.initial_net = sumsArray.take_home;
  sumsArray.gross_amount = grossAmount;
  sumsArray.worker_id = worker_info.id;
  return sumsArray;
}

async function createTaxesTransactions(workerWithRSSB, declared_month, user_id, project_id, passed_rra_taxes_id, rra_taxes, response) {
  const total_net = workerWithRSSB.reduce((sum, item) => {
    return sum + parseInt(item.initial_net.toString());
  }, 0);
  const total_gross = workerWithRSSB.reduce((sum, item) => {
    return sum + parseInt(item.gross_amount.toString());
  }, 0);

  let rra_body = {
    declared_month: declared_month,
    total_worker: workerWithRSSB.length,
    total_net: total_net,
    total_gross: total_gross,
    added_by: user_id,
    project_id: project_id
  };

  if (passed_rra_taxes_id) {
    let rra_updated = await strapi.query("rra-taxes").update({ id: passed_rra_taxes_id }, { ...rra_body, status: 'finished' });
    if (rra_updated) {
      rra_taxes = await strapi.query("rra-taxes").findOne({ id: passed_rra_taxes_id });
    }
  }
  if (rra_taxes) {
    response.rra_taxe = rra_taxes;
    let taxes_transactions_body = workerWithRSSB.map((item) => {
      item.rra_taxes_id = rra_taxes.id;
      item.S = item.S;
      item.U = item.U;
      item.V = item.V;
      item.H = item.H;
      item.Y = item.Y;
      item.Z = item.Z;
      item.verified_net = item.verified_net;
      item.gross_amount = item.gross_amount;
      return item;
    });

    let taxes_transactions = await strapi.query("new-taxes-transactions").createMany(taxes_transactions_body);
    if (taxes_transactions) {
      if (passed_rra_taxes_id) {
        response.message = "Taxes Generated";
        response.excel_data = workerWithRSSB;
      } else {
        response.message = "Taxes Generated";
        response.excel_data = workerWithRSSB;
      }
    } else {
      response.message = "could not create taxes";
    }
  } else {
    response.message = "could not create rra-taxes";
  }
  return response;
}

