'use strict';
const { v4: uuid } = require("uuid");
const { accountVerification } = require("../../payment-methods/services/payment-methods");
const utils = require("../../../config/functions/utils");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async getPayoutWorkers(payment_id, status, payment_method_id) {
    let all_workers_to_pay = [];
    let workers_to_pay = []
    if (status === "unpaid") {
      all_workers_to_pay = await strapi
        .query("payout-transactions")
        .find({ payment_id: payment_id, payment_method_id: payment_method_id, _limit: -1 });
      workers_to_pay = all_workers_to_pay.filter((worker) => {
        if (worker.status === "unpaid") {
          worker.amount = worker.amount;
          worker.account_number = worker.account_number;
          worker.reference_id = uuid();
          worker.payment_type_name = "payout";
          return worker;
        }
      });
    } else {
      all_workers_to_pay = await strapi
        .query("payout-transactions")
        .find({ payment_id: payment_id, payment_method_id: payment_method_id, _limit: -1, status: "failed" });
      for (let index = 0; index < all_workers_to_pay.length; index++) {
        let payout_transaction = await strapi
          .query("payment-transaction-tracks")
          .findOne({
            payroll_payout_transaction_id: all_workers_to_pay[index].id,
            payments_id: payment_id,
            _sort: "created_at:DESC"
          });
        if (payout_transaction && payout_transaction.status.toLowerCase() === "failed") {
          workers_to_pay.push({
            ...all_workers_to_pay[index],
            amount: all_workers_to_pay[index].amount,
            account_number: all_workers_to_pay[index].account_number,
            reference_id: uuid(),
            payment_type_name: "payout"
          });
          await strapi.query("payment-transaction-tracks").update(
            { id: payout_transaction.id },
            {
              is_rerun: true,
            }
          )
        }
      }
    }
    return workers_to_pay;
  },
  async saveBulkTemporaryPayoutPayee(data, file_name, file_id, payment_method_id, payment_id, type) {
    let response = { status: false, message: '' };
    let total_payees = 0;
    try {
      let temp_payees = [];
      console.log(`*********** STARTING IMPORTING ${data.length} PAYEES ********************`);
      for (let i = 0; i < data.length; i++) {
        const payee_object = { account_name: "", account_number: "", amount: 0, payee_type: "", file_name: "", file_id: "", is_account_verified: "", account_verification_desc: "", payment_method_id: 0, payment_method: "", momo_account_name: "", payment_id: 0, is_account_number_valid: false, is_account_number_exist: false };
        payee_object.account_name = data[i].names;
        payee_object.account_number = utils.validatePhoneNumber(data[i].account_number).phoneNumber;
        payee_object.amount = data[i].amount;
        payee_object.payee_type = "Payee";
        payee_object.file_name = file_name;
        payee_object.file_id = file_id;
        payee_object.payment_method_id = payment_method_id;
        payee_object.payment_id = payment_id;
        const existing_payees_in_temp = await strapi.query("temp-payout-pament").find({ payment_id: payee_object.payment_id });
        if (existing_payees_in_temp && existing_payees_in_temp.length >= 1) {
          const is_account_number_found = existing_payees_in_temp.find((item) => item.account_number === payee_object.account_number);
          if (is_account_number_found) {
            payee_object.is_account_number_exist = true;
          }
        }
        if (type.toLowerCase() === "mtn") {
          payee_object.payment_method = "MTN";
          const momo_verification = await accountVerification(payee_object.payment_method, { account_number: payee_object.account_number, account_name: { first_name: payee_object.account_name, last_name: "name_combined" }, account_belong_to: "MTN" }, true);
          if (momo_verification.status) {
            payee_object.is_account_verified = momo_verification.data.verification_result_boolean;
            payee_object.account_verification_desc = momo_verification.data.verification_result_desc;
            if (payee_object.is_account_verified === "green") {
              payee_object.is_account_number_valid = true;
            }
          }
          payee_object.momo_account_name = momo_verification.data.verification_result_account_name;
        } else if (type.toLowerCase() === "kremit") {
          payee_object.payment_method = "kremit";
          const momo_verification = await accountVerification(payee_object.payment_method, { account_number: payee_object.account_number, account_name: { first_name: payee_object.account_name, last_name: "name_combined" }, account_belong_to: "MTN" }, true);
          if (momo_verification.status) {
            payee_object.is_account_verified = momo_verification.data.verification_result_boolean;
            payee_object.account_verification_desc = momo_verification.data.verification_result_desc;
            if (payee_object.is_account_verified === "green") {
              payee_object.is_account_number_valid = true;
            }
          }
        } else {
          console.log("Another payment method");
        }
        temp_payees.push(payee_object);
        total_payees = total_payees + 1;
        console.log(total_payees, ". Account number", payee_object.account_number, `uploading-status-${process.env.PUSHER_ATTENDANCE_CHANNEL}-${file_id}: ${utils.calculatePercentage(total_payees, 0, data.length)}`);
        utils.eventPublisher(`uploading-status-${process.env.PUSHER_ATTENDANCE_CHANNEL}-${file_id}`, {
          entity_id: file_id,
          status: utils.calculatePercentage(total_payees, 0, data.length),
        });

      }
      const temp_payee = await strapi.query("temp-payout-pament").createMany(temp_payees);
      if (temp_payee) {
        response = {
          status: true,
          message: `Successfully saved ${total_payees} payees in Temporary table.`
        }
      } else {
        response = {
          status: false,
          message: `failed to save ${total_payees} payees`
        }
      }

    } catch (error) {
      console.log('Error in saveBulkTemporaryPayoutPayee', error.message);
      response = {
        status: false,
        message: error.message
      }
    }
    return response;
  },
}
