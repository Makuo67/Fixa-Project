"use strict";
const MOMO_URL_DISB = process.env.MOMO_URL_DISB;
const MOMO_PRIMARY_KEY = process.env.MOMO_PRIMARY_KEY;
const MOMO_X_TARGET_ENV = process.env.MOMO_X_TARGET_ENV;
const axios = require("axios");
const Pusher = require("pusher");
const { getMomoToken } = require("../../../config/functions/momotoken")
const { checkMtnTransactionStatus } = require("../../../config/functions/make_payment");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async checkAllPaymentTransactionStatus() {
    try {
      let alltransactions = await strapi.query("payment-transaction-tracks").find({ _limit: -1, is_rerun: false });
      let transactions = alltransactions.filter((t) => {
        if (t.status.toLowerCase() != "successful" && t.status.toLowerCase() != "failed") {
          return t;
        }
      });

      let opt_verifications_running = await strapi.query("otp-verification").find({ is_running: true, is_paying: true, _limit: -1 });
      if (opt_verifications_running && opt_verifications_running.length === 0) {
        for (let i = 0; i < transactions.length; i++) {
          let item_transaction = transactions[i];

          let payment = await strapi.query("payments").findOne({ id: item_transaction.payments_id });
          if (payment) {
            let response_momo = "";
            let status_momo = "failed";
            let payment_method = await strapi.query("payment-methods").findOne({ id: item_transaction.payment_method_id });
            if (payment_method) {

              // check transaction status for Mtn
              if (payment_method.code_name.toString().toLowerCase() === 'mtn') {
                let response_payment_status = await checkMtnTransactionStatus(item_transaction);
                if (response_payment_status.status === 'success') {
                  status_momo = response_payment_status.data.status ? getCorrectStatusMomo(response_payment_status.data.status) : "failed";
                  if (response_payment_status.data.status && response_payment_status.data.status.toLowerCase() === "successful") {
                    response_momo = `Phone number (${response_payment_status.data.payee.partyId}) has received ${response_payment_status.data.amount}RWF. For ${response_payment_status.data.payeeNote}. Financial Transaction Id: ${response_payment_status.data.financialTransactionId}.`;
                  } else {
                    response_momo = response_payment_status.data.reason;
                  }
                  let getPaymentType = await strapi.query("payment-types").findOne({ id: payment.payment_types_id });
                  if (getPaymentType) {
                    // update payment methods
                    await strapi.query("payment-transaction-tracks").update({ id: item_transaction.id },
                      {
                        status: response_payment_status.data.status ? response_payment_status.data.status : "not-found",
                        payed_time: Date.now(),
                        momo_msg: response_payment_status.data.status ? response_momo : `No status available ${response_momo}`,
                      }
                    );
                    if (getPaymentType.type_name === "payroll") {
                      await strapi.query("payroll-transactions").update({ id: item_transaction.payroll_payout_transaction_id }, { status: status_momo });
                    }
                    if (getPaymentType.type_name === "payout") {
                      await strapi.query("payout-transactions").update({ id: item_transaction.payroll_payout_transaction_id }, { status: status_momo });
                    }
                    if (getPaymentType.type_name === "deduction") {
                      await strapi.query("deductions-transactions").update({ id: item_transaction.payroll_payout_transaction_id }, { status: status_momo });
                    }
                  }
                } else {
                  let getPaymentType = await strapi.query("payment-types").findOne({ id: payment.payment_types_id });
                  if (getPaymentType) {
                    // update payment methods
                    await strapi.query("payment-transaction-tracks").update({ id: item_transaction.id },
                      {
                        status: "error-catch",
                        payed_time: Date.now(),
                        momo_msg: response_payment_status.message,
                      }
                    );
                    if (getPaymentType.type_name === "payroll") {
                      let transaction_to_update = await strapi.query("payroll-transactions").findOne({id: item_transaction.payroll_payout_transaction_id});
                      if(transaction_to_update){
                        await strapi.query("payroll-transactions").update({ id: item_transaction.payroll_payout_transaction_id }, { status: 'failed' });
                      }
                    }
                    if (getPaymentType.type_name === "payout") {
                      let transaction_to_update = await strapi.query("payout-transactions").findOne({id: item_transaction.payroll_payout_transaction_id});
                      if(transaction_to_update){
                        await strapi.query("payout-transactions").update({ id: item_transaction.payroll_payout_transaction_id }, { status: 'failed' });
                      }
                    }
                    if (getPaymentType.type_name === "deduction") {
                      let transaction_to_update = await strapi.query("deductions-transactions").findOne({id: item_transaction.payroll_payout_transaction_id});
                      if(transaction_to_update){
                        await strapi.query("deductions-transactions").update({ id: item_transaction.payroll_payout_transaction_id }, { status: 'failed' });
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        console.log("WE CAN'T CHECK TRANSACTION STATUS BECAUSE ONE OR MORE PAYMENTS ARE HAPPENING AT THIS TIME!");
      }
    } catch (error) {
      console.log('Error in checkOpenPaymentTransactionStatus()', error);
    }
  },

  // async checkAllPaymentTransactionStatus() {
  //   try {
  //     // get all payment transactions tracks
  //     let alltransactions = await strapi
  //       .query("payment-transaction-tracks")
  //       .find({ _limit: -1, is_rerun: false });
  //     let transactions_status = alltransactions.filter((t) => {
  //       if (t.status.toLowerCase() != "successful" && t.status.toLowerCase() != "failed") {
  //         return t;
  //       }
  //     });
  //     let transactions = transactions_status.filter((t) => {
  //       if (!t.trial || t.trial <= 5) {
  //         return t;
  //       }
  //     });
  //     const pathname = MOMO_URL_DISB + "v1_0/transfer/";
  //     const headers = {
  //       "Content-Length": 0,
  //       Accept: "*/*",
  //       "Accept-Encoding": "gzip, deflate, br",
  //       Connection: "keep-alive",
  //       "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
  //       "X-Target-Environment": MOMO_X_TARGET_ENV,
  //       Authorization: null,
  //     };

  //     let opt_verifications_running = await strapi
  //       .query("otp-verification")
  //       .find({ is_running: true, is_paying: true, _limit: -1 });

  //     if (opt_verifications_running && opt_verifications_running.length === 0) {
  //       for (let i = 0; i < transactions.length; i++) {
  //         let trial_number = getTrialNumber(transactions[i].trial);
  //         let payment = await strapi
  //           .query("payments")
  //           .findOne({ id: transactions[i].payments_id });
  //         // if (payment && payment.status !== "closed") {
  //           let getPaymentType = await strapi
  //             .query("payment-types")
  //             .findOne({ id: payment.payment_types_id });
  //           if (getPaymentType) {
  //             let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB,process.env.MOMO_PRIMARY_KEY);
  //             headers["Authorization"] = `Bearer ${access_token}`;
  //             await axios
  //               .get(pathname + transactions[i].reference_id, {
  //                 headers: headers,
  //               })
  //               .then((resp) => {
  //                 let response_momo = "";
  //                 let status_momo = resp.data.status
  //                   ? getCorrectStatusMomo(resp.data.status)
  //                   : "failed";
  //                 if (
  //                   resp.data.status &&
  //                   resp.data.status.toLowerCase() === "successful"
  //                 ) {
  //                   response_momo = `Phone number (${resp.data.payee.partyId}) has received ${resp.data.amount}RWF. For ${resp.data.payeeNote}. Financial Transaction Id: ${resp.data.financialTransactionId}.`;
  //                 } else {
  //                   response_momo = resp.data.reason;
  //                 }
  //                 strapi
  //                   .query("payment-transaction-tracks")
  //                   .update(
  //                     { id: transactions[i].id },
  //                     {
  //                       status: resp.data.status ? resp.data.status : 'not-found',
  //                       payed_time: Date.now(),
  //                       momo_msg: response_momo,
  //                       trial: trial_number,
  //                     }
  //                   )
  //                   .then((data) => {
  //                     if (transactions[i].is_deduction) {
  //                       strapi.query("deductions-transactions").update(
  //                         { id: transactions[i].payroll_payout_transaction_id },
  //                         {
  //                           status: status_momo,
  //                         }
  //                       );
  //                     } else {
  //                       if (getPaymentType.type_name === "payout") {
  //                         strapi.query("payout-transactions").update(
  //                           { id: transactions[i].payroll_payout_transaction_id },
  //                           {
  //                             status: status_momo,
  //                           }
  //                         );
  //                       } else {
  //                         strapi.query("payroll-transactions").update(
  //                           { id: transactions[i].payroll_payout_transaction_id },
  //                           {
  //                             status: status_momo,
  //                           }
  //                         );
  //                       }
  //                     }

  //                   });
  //               })
  //               .catch((error) => {
  //                 console.log("ERROR:", error.message);
  //                 if (transactions[i].is_deduction) {
  //                   strapi.query("deductions-transactions").update(
  //                     { id: transactions[i].payroll_payout_transaction_id },
  //                     {
  //                       status: "failed",
  //                     }
  //                   );
  //                 } else {
  //                   if (getPaymentType.type_name === "payout") {
  //                     strapi.query("payout-transactions").update(
  //                       { id: transactions[i].payroll_payout_transaction_id },
  //                       {
  //                         status: "failed",
  //                       }
  //                     );
  //                   } else {
  //                     strapi.query("payroll-transactions").update(
  //                       { id: transactions[i].payroll_payout_transaction_id },
  //                       {
  //                         status: "failed",
  //                       }
  //                     );
  //                   }
  //                 }

  //                 strapi.query("payment-transaction-tracks").update(
  //                   { id: transactions[i].id },
  //                   {
  //                     status: "error-catch",
  //                     payed_time: Date.now(),
  //                     momo_msg: error.message,
  //                     trial: trial_number,
  //                   }
  //                 );
  //               });
  //           }
  //         // }
  //       }
  //     } else {
  //       console.log("WE CAN'T CHECK TRANSACTION STATUS BECAUSE ONE OR MORE PAYMENTS ARE HAPPENING AT THIS TIME!");
  //     }
  //   } catch (error) {
  //     console.log(
  //       "Error happened in checkAllPaymentTransactionStatus()",
  //       error
  //     );
  //   }
  // },

  async getWorkersToPay(payment_id, status) {
    const knex = strapi.connections.default;
    let sql_raw = `
        SELECT
        t1.reference_id,
        t2.phone_number,
        t2.status
        FROM payment_transaction_tracks AS t1
        LEFT JOIN payroll_transactions as t2 ON t1.payroll_payout_transaction_id = t2.id
        WHERE payments_id=${payment_id}
        `;
    let workers = await knex.raw(sql_raw);
    return workers[0];
  },
};

// get correct momo status
function getCorrectStatusMomo(status) {
  let status_momo = "failed";
  if (status) {
    if (status.toLowerCase() === "successful") {
      status_momo = "successful";
    } else if (status.toLowerCase() === "pending") {
      status_momo = "pending";
    } else {
      status_momo = "failed";
    }
  }
  return status_momo;
}

function getTrialNumber(trial_number) {
  let trial = 0;

  if (trial_number || trial_number === 0) {
    let trial_str = trial_number.toString();
    trial = parseInt(trial_str) + 1;
  }
  return trial;
}
