"use strict";
const { checkAllPaymentTransactionStatus } = require("../../api/payment-transaction-tracks/services/payment-transaction-tracks");
const { momoCheckBalance } = require("../../api/payments/services/payments");
const moment = require("moment");
const { sendSMSToWorker, verifyBulkWorkers } = require("../../api/service-providers/services/service-providers");
const utils = require("../functions/utils");
// const every30second = "*/30 * * * * *";
// const everyWeek = "0 0 * * 0"
// const midnight = "0 0 * * *"; // run every day at midnight 12 AM
// const moment = require("moment");
// const fs = require("fs");
// const everyminute = "* * * * *";
// const everyhour = "0 * * * *";
// const every two hours = "0 */2 * * *";
module.exports = {
  "*/2 * * * *": async () => {
    try {
      // console.log('Running');
      checkAllPaymentTransactionStatus();
    } catch (err) {
      console.log("Error in config->functions->cron.js :: */2 * * * * ", err.message);
    }
  },
  "* * * * *": async () => {
    try {
      const wallet_top_ups = await strapi.query('wallet-top-up-transactions').find();
      const pending_top_ups = wallet_top_ups.find((item) => item.status === "initiated" || item.status === "processing");
      if (pending_top_ups) {
        const recent_wallet_top_up = await strapi.query('wallet-top-up-transactions').findOne({ _sort: "id:desc" });
        const momo_balance = await momoCheckBalance();
        if (momo_balance.status && recent_wallet_top_up.id) {
          const current_balance = parseInt(momo_balance.data.availableBalance);
          const balance_before_is_loaded = parseInt(recent_wallet_top_up.balance_before_is_loaded);
          const knex = strapi.connections.default;
          const successfully_payment = `SELECT 
          t1.id,
          t1.payroll_payout_transaction_id,
          t2.amount AS payout_amount,
          t3.take_home,
          t4.amount AS deduction_amount
          FROM payment_transaction_tracks AS t1
          LEFT JOIN payout_transactions AS t2 ON t1.payroll_payout_transaction_id = t2.id
          LEFT JOIN payroll_transactions AS t3 ON t1.payroll_payout_transaction_id = t3.id
          LEFT JOIN deductions_transactions AS t4 ON t1.payroll_payout_transaction_id = t4.id
          WHERE t1.status='successful' AND t1.payed_time > '${recent_wallet_top_up.submition_date}'`;
          const successfully_payment_rows = await knex.raw(successfully_payment);
          const disbursed_amount = successfully_payment_rows[0].reduce((sum, item) => {
            let payout_amount = (item.payout_amount) ? parseInt(item.payout_amount) : 0;
            let take_home = (item.take_home) ? parseInt(item.take_home) : 0;
            let deduction_amount = (item.deduction_amount) ? parseInt(item.deduction_amount) : 0;
            return sum + parseInt(payout_amount + take_home + deduction_amount);
          }, 0);
          const amount_added = current_balance - (balance_before_is_loaded + disbursed_amount);
          if (current_balance > balance_before_is_loaded) {
            const harareTimeZone = 'Africa/Harare';
            const currentDateInHarare = moment().tz(harareTimeZone);
            const formattedDate = currentDateInHarare.format('YYYY-MM-DD HH:mm:ss');
            const balance_after_is_loaded = current_balance;
            strapi.query('wallet-top-up-transactions').update({ id: recent_wallet_top_up.id }, { status: "completed", balance_loaded_date: formattedDate, balance_after_is_loaded: balance_after_is_loaded, top_up_balance: amount_added }, "loading_balance");
          }
        }
      }
    } catch (err) {
      console.log("Error in config->functions->cron.js :: * * * * * ", err.message);
    }
  },
  "0 * * * *": async () => {
    try {
      const wallet_top_ups = await strapi.query('wallet-top-up-transactions').find();
      const pending_top_ups = wallet_top_ups.find((item) => item.status === "initiated" || item.status === "processing");
      if (pending_top_ups) {
        const message = `Hello, This is a reminder to top up the MOMO wallet of ${pending_top_ups.wallet_id}. From Fixa Limited`;
        let bank_agent_phones = pending_top_ups.top_up_email_recipients.map((item) => {
          return item.phone_number;
        });
        await sendSMSToWorker(bank_agent_phones, message);
      }
    } catch (err) {
      console.log("Error in config->functions->cron.js :: 0 * * * * ", err.message);
    }
  },
  "0 0 * * *": async () => {
    try {
      const workers = await strapi.query('service-providers').find({ _limit: -1 });
      const valid_worker_phone = workers.filter((item) => utils.phoneNumberValidation(item.phone_number));
      const univerified_worker_check_rwandan = valid_worker_phone.filter((item) => !(item.is_rssb_verified === "green" && item.is_momo_verified_and_rssb === "green"));
      const univerified_worker_check_foreigner = univerified_worker_check_rwandan.filter((item) => !(item.is_rssb_verified === "nothing" && item.is_momo_verified_and_rssb === "blue"));
      const failing_verification_worker = univerified_worker_check_foreigner.filter((item) => item.is_momo_verified_and_rssb_desc === "Verification failed. This account is not active.");
      const worker_to_verify = failing_verification_worker.map((item) => {
        item.worker_id = item.id;
        return item;
      });
      const phone_to_remove = ["0799253415", "0794455522", "0792858441", "0792622496", "0792257177", "0791603010", "079154993.", "0791548817", "0790218779", "0790200542", "0789295753", "0789126100", "078898541.", "0788593212", "0786923666", "0786063812", "0784799361", "0784442553", "0782864795", "0781769365", "0781630708", "0781237464", "0780845749", "07806172298", "0726288058", "0780982026"];
      let cleaned_worker_to_verify = [];
      for (let x = 0; x < worker_to_verify.length; x++) {
        const is_phone_found = phone_to_remove.find((z) => z === worker_to_verify[x].phone_number);
        if (!is_phone_found) {
          cleaned_worker_to_verify.push(worker_to_verify[x]);
        }
      }
      verifyBulkWorkers(cleaned_worker_to_verify, "background");
    } catch (err) {
      console.log("Error in config->functions->cron.js :: 0 0 * * *", err.message);
    }
  },
  "0 */2 * * *": async () => {
    global.all_workforces = await strapi.query("workforce").find({ _limit: -1 });
  }
  //we need to call cron job that will verify the worker status.  updateWorker();
};
