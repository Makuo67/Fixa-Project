"use strict";
let Validator = require("validatorjs");
const utils = require("../../../config/functions/utils");
const Format = require('response-format');
const kremit_banks = require('../../../config/ressources/kremit_banks.json');
const { accountVerification } = require("../../payment-methods/services/payment-methods");
const { saveBulkTemporaryPayoutPayee } = require("../services/payout-transactions");

module.exports = {
  async payoutTransactionDetails(ctx) {
    let response;
    let payees_data = [];
    try {
      const { id } = ctx.params;
      let queries = ctx.query;
      if (id) {
        let payment = await strapi.query("payments").findOne({ id: id });
        if (payment) {
          queries.payment_id = id;
          // get payees
          let payees = await strapi.query("payees").find({ _limit: -1 });
          // get payout transactions
          let worker_payout_transactions = await strapi.query("payout-transactions").find({ ...queries });
          for (let index = 0; index < payees.length; index++) {
            const element = payees[index];
            // get payee total
            let payees_filtered = worker_payout_transactions.filter((item) => {
              if (parseInt(item.payee_type_id) === element.id) {
                return item;
              }
            });

            // get total payees filtered
            const total_payees_filtered = payees_filtered.reduce((sum, item) => {
              return sum + parseInt(item.amount);
            }, 0);
            payees_data.push({
              "payee_type": element.payee_type,
              "amount": total_payees_filtered
            })
          }
          ctx.response.status = 200;

          response = {
            status: "success",
            data: payees_data,
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 401;
          response = {
            status: "failed",
            data: "",
            error: `Payment with ID ${id} not found`,
            meta: "",
          };
        }
      } else {
        ctx.response.status = 401;
        response = {
          status: "failed",
          data: "",
          error: "ID Not found",
          meta: "",
        };
      }
    } catch (error) {
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async uploadBulkPayee(ctx) {
    let response;
    try {
      let rules = {
        file_id: "required|string",
        file_name: "required|string",
        payment_method_id: "required|integer",
        payment_id: "required|integer",
        data: "required|array"
      };
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        const { data, file_name, file_id, payment_method_id, payment_id } = request_body;
        const is_payment_method = await strapi.query("payment-methods").findOne({ id: payment_method_id });
        if (is_payment_method && is_payment_method.id) {
          const payment = await strapi.query("payments").findOne({ id: payment_id });
          if (payment && payment.id) {
            saveBulkTemporaryPayoutPayee(data, file_name, file_id, payment_method_id, payment_id, is_payment_method.code_name);
            ctx.response.status = 200;
            response = Format.success("Uploading multiple payees started", []);
          } else {
            ctx.response.status = 400;
            response = Format.badRequest(`We can't find payment with id ${payment_id}`, []);
          }
        } else {
          ctx.response.status = 400;
          response = Format.badRequest(`We can't find payment method with id ${payment_method_id}`, []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }

    } catch (error) {
      console.log('error in uploadBulkPayee', error.message);
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  async find(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: {
        transactions: [],
        aggregates: {
          total_transactions: 0,
          total_payout: 0,
          total_disbursed: 0,
          failed: 0,
          successful: 0,
        },
      },
      errors: [],
      meta: {},
    };

    let queries = ctx.query;
    let payment = await strapi.query("payments").findOne({ id: queries.payment_id });

    let payout_transactions = await strapi.query("payout-transactions").find(queries);

    const payout_total_amount = payout_transactions.reduce((sum, item) => {
      return sum + parseInt(item.amount);
    }, 0);

    const successfull_payout = payout_transactions.filter((payment_passed) => {
      if (payment_passed.status === "successful") {
        return payment_passed;
      };
    });

    const failed_payout = payout_transactions.filter((payment_not_passed) => {
      if (payment_not_passed.status === "failed") {
        return payment_not_passed;
      };
    });

    const payout_successfull_total_amount = successfull_payout.reduce((sum, item) => {
      return sum + parseInt(item.amount);
    }, 0);

    response.meta.payment = payment;
    response.data.transactions = payout_transactions;
    response.data.aggregates.total_transactions = payout_transactions.length;
    response.data.aggregates.successful = successfull_payout.length;
    response.data.aggregates.failed = failed_payout.length;
    response.data.aggregates.total_payout = payout_total_amount;
    response.data.aggregates.total_disbursed = payout_successfull_total_amount;
    return response;
  },
  async addPayee(ctx) {
    let response;
    try {
      let rules = {
        payee_type_id: "required|integer",
        payee_names: "required|string",
        payee_names_id: "required|integer",
        payee_amount: "required|integer",
        payment_id: "required|integer",
        to_be_saved: "required|boolean",
        payee_payment_method_id: "required|integer",
        payee_payment_provider: "required|string",
        payee_account_number: "required|string",
      };
      let is_payment_method = "";
      let payment_method_verification_desc = "";
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const passed_body = ctx.request.body;
        const payment = await strapi.services["payments"].findOne({ id: passed_body.payment_id });
        const payee = await strapi.services["payees"].findOne({ id: passed_body.payee_type_id });
        const payment_method = await strapi.services["payment-methods"].findOne({ id: passed_body.payee_payment_method_id });
        let service_name = "";
        let is_bank = false;
        let kremit_bankid = "";
        if (payee) {
          if (payment_method) {
            if (payment_method.name.toLowerCase() === "kremit") {
              kremit_bankid = passed_body.payee_payment_provider;
              passed_body.payee_payment_provider = kremit_banks.find((item) => item.bankid === kremit_bankid).short_name;
              is_bank = true;
            }
            if (payment) {
              let worker_id = 0;
              if (payment.parent_claim && payment.parent_claim.toLowerCase() === 'payroll' && passed_body.payee_names_id) {
                const worker = await strapi.query("service-providers").findOne({ id: passed_body.payee_names_id });
                if (worker) {
                  worker_id = worker.id;
                  let worker_assigned = await strapi.query("new-assigned-workers").findOne({ project_id: payment.project_id, worker_id: worker.id });
                  if (worker_assigned) {
                    let worker_rate = await strapi.query("worker-rates").findOne({ assigned_worker_id: worker_assigned.id, _sort: "created_at:DESC" });
                    if (worker_rate) {
                      let service_worker = await strapi.query('services').findOne({ id: worker_rate.service_id });
                      service_name = service_worker.name;
                    }
                  }
                }
              }

              if (passed_body.to_be_saved && passed_body.payee_names_id === 0) {
                if (passed_body.payee_account_number.startsWith('078') || passed_body.payee_account_number.startsWith('079')) { // check for MTN
                  passed_body.payee_payment_provider = 'MTN';
                  const momo_verification = await accountVerification("MTN", { account_number: passed_body.payee_account_number, account_name: { first_name: passed_body.payee_names, last_name: "name_combined" }, account_belong_to: "MTN" }, true);
                  if (momo_verification.status) {
                    is_payment_method = momo_verification.data.verification_result_boolean;
                    payment_method_verification_desc = momo_verification.data.verification_result_desc;
                  }
                } else if (passed_body.payee_account_number.startsWith('073') || passed_body.payee_account_number.startsWith('072')) {  // check for airtel
                  passed_body.payee_payment_provider = 'AIRTEL';
                } else { // any number here is taken as bank account
                  if (kremit_bankid) {
                    const kremit_verification = await accountVerification("kremit", { account_number: passed_body.payee_account_number, account_name: { first_name: passed_body.payee_names, last_name: "name_combined" }, account_belong_to: kremit_bankid }, true);
                    if (kremit_verification.status) {
                      is_payment_method = kremit_verification.data.verification_result_boolean;
                      payment_method_verification_desc = kremit_verification.data.verification_result_desc;
                    }
                  }
                }
              } else {
                if (payee.payee_type.toLowerCase() === "worker") {
                  const worker = await strapi.query("service-providers").findOne({ id: passed_body.payee_names_id });
                  if (worker) {
                    let is_rwandan = false;
                    if (utils.nidValidation(worker.nid_number)) {
                      is_rwandan = (worker.is_rssb_verified === "green") ? true : false;
                    }
                    const default_payment_for_worker = worker.payment_methods.find((item) => item.is_active);
                    if (default_payment_for_worker) {
                      is_payment_method = default_payment_for_worker.is_verified;
                      payment_method_verification_desc = default_payment_for_worker.account_verified_desc;
                    } else {
                      if (passed_body.payee_account_number.startsWith('078') || passed_body.payee_account_number.startsWith('079')) { // check for MTN
                        passed_body.payee_payment_provider = 'MTN';
                        const momo_verification = await accountVerification("MTN", { account_number: passed_body.payee_account_number, account_name: { first_name: passed_body.payee_names, last_name: "name_combined" }, account_belong_to: "MTN" }, is_rwandan);
                        if (momo_verification.status) {
                          is_payment_method = momo_verification.data.verification_result_boolean;
                          payment_method_verification_desc = momo_verification.data.verification_result_desc;
                        }
                      } else if (passed_body.payee_account_number.startsWith('073') || passed_body.payee_account_number.startsWith('072')) {  // check for airtel
                        passed_body.payee_payment_provider = 'AIRTEL';
                      } else { // any number here is taken as bank account
                        if (kremit_bankid) {
                          const kremit_verification = await accountVerification("kremit", { account_number: passed_body.payee_account_number, account_name: { first_name: passed_body.payee_names, last_name: "name_combined" }, account_belong_to: kremit_bankid }, true);
                          if (kremit_verification.status) {
                            is_payment_method = kremit_verification.data.verification_result_boolean;
                            payment_method_verification_desc = kremit_verification.data.verification_result_desc;
                          }
                        }
                      }
                      const default_payment = [
                        {
                          payment_method: passed_body.payee_payment_method_id,
                          is_active: true,
                          provider: passed_body.payee_payment_provider,
                          account_name: passed_body.payee_names,
                          account_number: passed_body.payee_account_number,
                          is_verified: is_payment_method,
                          account_verified_desc: payment_method_verification_desc,
                          worker_id: worker.id
                        }];
                      await strapi.query("service-providers").update({ id: worker.id }, { payment_methods: default_payment });
                    }
                  }
                } else {
                  const supplier = await strapi.query("payee-names").findOne({ id: passed_body.payee_names_id });
                  if (supplier) {
                    const default_payment_for_supplier = supplier.payment_methods.find((item) => item.is_active);
                    if (default_payment_for_supplier) {
                      is_payment_method = default_payment_for_supplier.is_verified;
                      payment_method_verification_desc = default_payment_for_supplier.account_verified_desc;
                    } else {
                      if (passed_body.payee_account_number.startsWith('078') || passed_body.payee_account_number.startsWith('079')) { // check for MTN
                        passed_body.payee_payment_provider = 'MTN';
                        const momo_verification = await accountVerification("MTN", { account_number: passed_body.payee_account_number, account_name: { first_name: passed_body.payee_names, last_name: "name_combined" }, account_belong_to: "MTN" }, true);
                        if (momo_verification.status) {
                          is_payment_method = momo_verification.data.verification_result_boolean;
                          payment_method_verification_desc = momo_verification.data.verification_result_desc;
                        }
                      } else if (passed_body.payee_account_number.startsWith('073') || passed_body.payee_account_number.startsWith('072')) {  // check for airtel
                        passed_body.payee_payment_provider = 'AIRTEL';
                      } else { // any number here is taken as bank account
                        if (kremit_bankid) {
                          const kremit_verification = await accountVerification("kremit", { account_number: passed_body.payee_account_number, account_name: { first_name: passed_body.payee_names, last_name: "name_combined" }, account_belong_to: kremit_bankid }, true);
                          if (kremit_verification.status) {
                            is_payment_method = kremit_verification.data.verification_result_boolean;
                            payment_method_verification_desc = kremit_verification.data.verification_result_desc;
                          }
                        }
                      }
                      const default_payment = [
                        {
                          payment_method: passed_body.payee_payment_method_id,
                          is_active: true,
                          provider: passed_body.payee_payment_provider,
                          account_name: passed_body.payee_names,
                          account_number: passed_body.payee_account_number,
                          is_verified: is_payment_method,
                          account_verified_desc: payment_method_verification_desc
                        }
                      ];
                      await strapi.query("payee-names").update({ id: supplier.id }, { payment_methods: default_payment });
                    }
                  }
                }
              }

              const payload_payout = {
                payment_id: payment.id,
                payee_type_id: passed_body.payee_type_id,
                payee_name: passed_body.payee_names,
                amount: passed_body.payee_amount,
                payment_method_id: passed_body.payee_payment_method_id,
                payment_method: passed_body.payee_payment_provider,
                account_number: passed_body.payee_account_number,
                service_name: service_name,
                status: "unpaid",
                worker_id: worker_id,
                payment_type_id: payment.payment_types_id,
                payee_type_name: payee.payee_type,
                is_editable: passed_body.to_be_saved,
                is_bank: is_bank,
                is_payment_method: is_payment_method,
                payment_method_verification_desc: payment_method_verification_desc
              };
              let payout_transaction = await strapi.query("payout-transactions").create(payload_payout);
              if (payout_transaction) {
                let payments_transactions = await strapi.query("payout-transactions").find({ payment_id: payout_transaction.payment_id, _limit: -1 });
                const total_amount = payments_transactions.reduce((sum, item) => {
                  return sum + parseInt(item.amount);
                }, 0);
                await strapi.query("payments").update({ id: payout_transaction.payment_id }, { total_amount: total_amount, total_payees: payments_transactions.length });
              }
              ctx.response.status = 200;
              response = Format.success("Payee added successful", []);
            } else {
              ctx.response.status = 400;
              response = Format.badRequest("No payment attached to this payout", []);
            }
          } else {
            ctx.response.status = 400;
            response = Format.badRequest("No payment method found", []);
          }
        } else {
          ctx.response.status = 400;
          response = Format.badRequest("No payee type found", []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }
    } catch (error) {
      console.log("Error in addPayee ", error);
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  async editPayee(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };

    try {
      const id = ctx.params.id;
      // validate request
      if (typeof id === "undefined" || !id) {
        response.errors.push("Missing the payee id.");
      }

      if (response.errors.length !== 0) {
        ctx.response.status = 400;
        response.status_code = 400;
        response.status = "failure";
        return response;
      }
      let payout_transaction = await strapi.services["payout-transactions"].findOne({
        id: id
      });
      if (!payout_transaction) {
        response.errors.push("Payout not found");
        response.status_code = 400;
        response.status = "failure";
        return response;
      }
      let payment = await strapi.services["payments"].findOne({
        id: payout_transaction.payment_id
      });
      if (!payment) {
        response.errors.push("Payment not found");
        response.status_code = 400;
        response.status = "failure";
        return response;
      }
      if (payment && payout_transaction) {
        let payout_transactions = await strapi.services["payout-transactions"].update({ id: payout_transaction.id }, ctx.request.body);
        if (payout_transactions) {
          let payments_transactions = await strapi.query("payout-transactions").find({ payment_id: payout_transaction.payment_id, _limit: -1 });
          const total_amount = payments_transactions.reduce((sum, item) => {
            return sum + parseInt(item.amount);
          }, 0);
          await strapi.query("payments").update({ id: payout_transaction.payment_id }, { total_amount: total_amount, total_payees: payments_transactions.length });
        }
        response.status = "success";
        response.status_code = 200;
      }
      return response;
    } catch (error) {
      console.log("Error in /editPayee() ", error);
    }

    return response;
  },
  async removePayoutTransaction(ctx) {
    let response;
    const { id } = ctx.params;
    try {
      // check if payroll transaction exist
      let payout_transaction = await strapi
        .query("payout-transactions")
        .findOne({ id: id });

      if (payout_transaction) {
        await strapi.query("payout-transactions").delete({ id: payout_transaction.id });

        let payments_transactions = await strapi.query("payout-transactions").find({ payment_id: payout_transaction.payment_id, _limit: -1 });
        const total_amount = payments_transactions.reduce((sum, item) => {
          return sum + parseInt(item.amount);
        }, 0);

        await strapi.query("payments").update({ id: payout_transaction.payment_id }, { total_amount: total_amount, total_payees: payments_transactions.length });

        response = {
          status: "success",
          data: "payout transaction deleted successfully",
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "failed",
          data: "",
          error: `Payout transaction with id ${payout_transaction.id} does not exist`,
          meta: "",
        };
      }
    } catch (error) {
      console.log(error);
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async removeAllPayoutTempTransaction(ctx) {
    const data = await strapi.query('temp-payout-pament').find({
      _limit: -1
    });

    // Delete all entries fetched.
    data.forEach((entry) => strapi.query('temp-payout-pament').delete({
      id: entry.id
    }));
    let response = {
      status: "success",
      data: "temp payout transaction deleted successfully",
      error: "",
      meta: "",
    };
    return response
  },
  async payoutTransactionsDetails(ctx) {
    let response;
    const { id } = ctx.params;
    try {
      let payout_transaction = await strapi.query("payout-transactions").findOne({ id });
      if (payout_transaction) {
        let payment_transactions_tracks = await strapi.query("payment-transaction-tracks").findOne({
          payments_id: payout_transaction.payment_id,
          payroll_payout_transaction_id: id,
          _sort: "created_at:DESC"
        });
        response = {
          status: "success",
          data: payment_transactions_tracks,
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "failed",
          data: "",
          error: `payrout_transaction with ${id} does not exist`,
          meta: "",
        };
      }
    } catch (error) {
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }

    return response;
  },
  async payoutDisbursementDetails(ctx) {
    let response;
    try {
      const { id } = ctx.params;
      const payout_transactions = await strapi.query("payout-transactions").find({ payment_id: id, _limit: -1 });
      if (payout_transactions) {

        const payee_amount_total = payout_transactions.reduce((sum, item) => {
          return sum + parseInt(item.amount);
        }, 0);

        const grouped_payee = payout_transactions.reduce((result, obj) => {
          const status = obj.status;
          if (!result[status]) {
            result[status] = { status, data: [] };
          }
          result[status].data.push(obj);
          return result;
        }, {});
        const resultArray = Object.values(grouped_payee);
        let payee_status_data = [];
        for (let x = 0; x < resultArray.length; x++) {
          const status_count = resultArray[x].data.length;
          const status_sum = resultArray[x].data.reduce((sum, item) => {
            return sum + parseInt(item.amount);
          }, 0);
          if (resultArray[x].status.toLowerCase() === "successful") {
            resultArray[x].status = "Disbursed Net amount";
          } else if (resultArray[x].status.toLowerCase() === "failed") {
            resultArray[x].status = "Failed amount";
          } else if (resultArray[x].status.toLowerCase() === "pending") {
            resultArray[x].status = "Pending amount";
          } else if (resultArray[x].status.toLowerCase() === "unpaid") {
            resultArray[x].status = "Unpaid amount";
          } else {
            resultArray[x].status = resultArray[x].status;
          }
          payee_status_data.push({ status: resultArray[x].status, count: status_count, amount: status_sum });
        }

        ctx.response.status = 200;
        response = Format.success("List of available status", { total: payee_amount_total, payees: { statuses: payee_status_data, total: payee_amount_total } });

      } else {
        ctx.response.status = 400;
        response = Format.badRequest("No payout found", []);
      }
    } catch (error) {
      console.log("Error in payoutDisbursementDetails ", error.message);
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  }
};

