"use strict";
const { sanitizeEntity } = require("strapi-utils");
let Validator = require("validatorjs");
const { consumeDeductionPayroll, } = require("../../deductions/services/deductions");
const { getPaymentDetails } = require("../services/payments");
const { getPayrollTransactions, checkStatus } = require("../services/payments");
const moment = require("moment");
const axios = require("axios");
const Pusher = require("pusher");
const _ = require("underscore");
// const logger = require("../../../config/logger");
const MOMO_URL_DISB = process.env.MOMO_URL_DISB;
const MOMO_PRIMARY_KEY = process.env.MOMO_PRIMARY_KEY;
const MOMO_X_TARGET_ENV = process.env.MOMO_X_TARGET_ENV;
const MOMO_MSISDN = process.env.MOMO_MSISDN;
const MOMO_CURRENCY = process.env.MOMO_CURRENCY;
const { getMomoToken } = require("../../../config/functions/momotoken");
const utils = require("../../../config/functions/utils");
const { accountVerification } = require("../../payment-methods/services/payment-methods");
const Format = require('response-format');
const { kremikAccountHolderValidation, kremikTransferRequest, kremikCheckTransactionStatus } = require("../../../config/functions/third_part_api_functions");
module.exports = {
  /**
   * Create instant payout entry.
   *
   * @return {Object}
   */

  // get internal and external deductions summary per payment
  async getPaymentDeductionSummary(ctx) {
    let response;
    try {
      const { id } = ctx.params;
      if (parseInt(id)) {
        const payment = await strapi.query("payments").findOne({ id: id });
        if (payment) {
          const all_deduction_types = await strapi.query("deduction-types").find({ _limit: -1 });
          const all_deduction_transactions = await strapi.query("deductions-transactions").find({ payment_id: id, _limit: -1 });
          const external_deduction_types = all_deduction_types.filter((item) => item.is_external);
          const internal_deduction_types = all_deduction_types.filter((item) => !item.is_external);
          const internal_deduction_types_ids = internal_deduction_types.map((item) => item.id);
          const external_deduction_types_ids = external_deduction_types.map((item) => item.id);

          const external_deductions = await strapi.query("deductions").find({ payment_id: id, deduction_type_id: external_deduction_types_ids, _limit: -1 });
          const internal_deductions = await strapi.query("deductions").find({ payment_id: id, deduction_type_id: internal_deduction_types_ids, _limit: -1 });

          const total_external_deduction = external_deductions.reduce((sum, itm) => {
            if (parseInt(itm.deduction_amount) < 0) {
              return sum;
            }
            return sum + parseInt(itm.deduction_amount);
          }, 0);

          const total_internal_deduction = internal_deductions.reduce((sum, itm) => {
            if (parseInt(itm.deduction_amount) < 0) {
              return sum;
            }
            return sum + parseInt(itm.deduction_amount);
          }, 0);

          const unique_internal_deductions = utils.removeDuplicatesByProperty(internal_deductions, 'deduction_type_id');
          const unique_internal_deductions_with_name = unique_internal_deductions.map((i) => {
            i.name = internal_deduction_types.find((u) => parseInt(u.id) === parseInt(i.deduction_type_id)).title;
            return i;
          });

          const unique_external_deductions = utils.removeDuplicatesByProperty(all_deduction_transactions, 'payee_name_id');
          const unique_external_deductions_with_name = unique_external_deductions.map((i) => {
            const payee_transaction = all_deduction_transactions.find((u) => parseInt(u.payee_name_id) === parseInt(i.payee_name_id));
            if (payee_transaction) {
              i.name = payee_transaction.payee_name;
              i.external_link = payee_transaction.external_link;
              i.amount = payee_transaction.amount;
              i.status = payee_transaction.status;
            }
            return i;
          });

          let internal_deduction_final = [];
          for (let x = 0; x < unique_internal_deductions_with_name.length; x++) {
            let total_amount = 0;
            for (let y = 0; y < internal_deductions.length; y++) {
              if (parseInt(unique_internal_deductions_with_name[x].deduction_type_id) === parseInt(internal_deductions[y].deduction_type_id)) {
                if (parseInt(internal_deductions[y].deduction_amount) > 0) {
                  total_amount = total_amount + parseInt(internal_deductions[y].deduction_amount);
                }
              }
            }
            internal_deduction_final.push({ name: unique_internal_deductions_with_name[x].name, total_amount: total_amount });
          }

          let external_deduction_final = [];
          for (let x = 0; x < unique_external_deductions_with_name.length; x++) {
            let total_amount = 0;
            for (let y = 0; y < external_deductions.length; y++) {
              if (parseInt(unique_external_deductions_with_name[x].payee_name_id) === parseInt(external_deductions[y].payee_name_id)) {
                if (parseInt(external_deductions[y].deduction_amount) > 0) {
                  total_amount = total_amount + parseInt(external_deductions[y].deduction_amount);
                }
              }
            }
            external_deduction_final.push({
              name: unique_external_deductions_with_name[x].name,
              link: unique_external_deductions_with_name[x].external_link,
              compare_amount: unique_external_deductions_with_name[x].amount,
              status: unique_external_deductions_with_name[x].status,
              total_amount: total_amount
            });
          }
          ctx.response.status = 200;
          response = {
            status: "success",
            data: {
              total_internal_deduction: total_internal_deduction,
              total_external_deduction: total_external_deduction,
              internal_deductions: internal_deduction_final,
              external_deductions: external_deduction_final
            },
            error: "",
            meta: "",
          };
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Invalid Id",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "",
          error: "Id required",
          meta: "",
        };
      }
    } catch (error) {
      console.log("erro catch getPaymentDeductionSummary", error.message);
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
  async paymentMomoVerification(ctx) {
    const response = {
      status: "failed",
      data: "",
      error: "",
      meta: "",
    };
    const { id } = ctx.params;
    try {
      const payment = await strapi.query("payments").findOne({ id });
      if (payment) {
        const payroll_transactions = await strapi.query("payroll-transactions").find({ payment_id: id, _limit: -1 });
        if (payroll_transactions.length >= 1) {
          console.log(`**************************** we are going to verify the payment method of ${payroll_transactions.length} workers in the payment with id ${id} ******************************************`);
          for (let index = 0; index < payroll_transactions.length; index++) {
            if (payroll_transactions[index].is_momo_verified_and_rssb != "green") {
              let is_momo_verified_and_rssb = "";
              let is_momo_verified_and_rssb_desc = "";
              let worker_name_momo = "";
              let is_rwandan = false;
              if (utils.nidValidation(payroll_transactions[index].id_number)) {
                const worker_info = await strapi.query("service-providers").findOne({ nid_number: payroll_transactions[index].id_number });
                if (worker_info) {
                  is_rwandan = (worker_info.is_rssb_verified === "green") ? true : false;
                }
              }
              const momo_verification = await accountVerification("MTN", { account_number: payroll_transactions[index].phone_number, account_name: { first_name: payroll_transactions[index].worker_name, last_name: "name_combined" }, account_belong_to: "MTN" }, is_rwandan);
              if (momo_verification.status) {
                worker_name_momo = momo_verification.data.verification_result_account_name;
                is_momo_verified_and_rssb = momo_verification.data.verification_result_boolean;
                is_momo_verified_and_rssb_desc = momo_verification.data.verification_result_desc;
              }
              if (is_momo_verified_and_rssb === "green") {
                worker_name_momo = payroll_transactions[index].worker_name;
              }
              let update_payroll = await strapi.query("payroll-transactions").update({ id: payroll_transactions[index].id }, { is_momo_verified_and_rssb: is_momo_verified_and_rssb, is_momo_verified_and_rssb_desc: is_momo_verified_and_rssb_desc, worker_name_momo: worker_name_momo });
              if (update_payroll) {
                console.log(index + 1, ". Payroll transaction  updated! ", payroll_transactions[index].worker_name, "verification result:: ", is_momo_verified_and_rssb);
              }
            } else {
              console.log(index + 1, ". Payroll transaction  ok ", payroll_transactions[index].worker_name);
            }
          }
          response.status = "success";
        } else {
          response.data = `We cant find any payroll with  payment_id ${id}`;
        }
      } else {
        response.data = `Payment with ${id} does not exist`;
      }
    } catch (error) {
      response.error = error.message;
    }
    return response;
  },
  async createPaymentClaim(ctx) {
    let response;
    try {
      const user = ctx.state.user;
      // check user
      let user_admin = await strapi
        .query("user", "admin")
        .findOne({ id: user.id });
      if (user_admin) {
        let user_access = await strapi
          .query("user-admin-access")
          .findOne({ user_id: user_admin.id });
        if (user_access) {
          let rules = {
            project_id: "required|integer",
            payment_id: "required|integer",
            title: "required|string"
          };
          let validation = new Validator(ctx.request.body, rules);
          if (validation.passes()) {
            const { title, project_id, description, payment_id } = ctx.request.body;
            // check if payment_id exist,project and payment_types
            let payment = await strapi.query("payments").findOne({ id: payment_id });
            let project = await strapi.query("projects").findOne({ id: project_id });
            let paymentType = await strapi.query("payment-types").findOne({ type_name: "payout" });
            if (payment && project && paymentType) {
              let payment_claims_list = await strapi.query("payments").find({ payment_id_claim: payment_id, is_claim: true, _limit: -1 });
              let payment_claims_list_length = payment_claims_list.length === 0 ? 1 : payment_claims_list.length + 1
              let payload = {
                title: `${title}-${payment_claims_list_length}`,
                project_id: project_id,
                status: "unpaid",
                added_on: new Date(),
                description: description ? description : "",
                project_name: project.name,
                payment_types_id: paymentType.id,
                total_payees: 0,
                total_amount: 0,
                payment_id_claim: payment_id,
                is_claim: true,
                parent_claim: (parseInt(payment.payment_types_id) === parseInt(paymentType.id)) ? "payout" : "payroll",
                end_date: payment.end_date,//we need this for filtering don't remove it
                start_date: payment.start_date,//we need this for filtering don't remove it
                done_by: user.id,
                done_by_name: `${user.firstname} ${user.lastname}`
              };
              let paymentClaim = await strapi.services["payments"].create(payload);
              ctx.response.status = 200;
              response = {
                status: "success",
                data: paymentClaim,
                error: "",
                meta: "",
              };

            } else {
              ctx.response.status = 404;
              response = {
                status: "failed",
                data: "",
                error: "Payment could not be created",
                meta: "",
              };
            }
          } else {
            ctx.response.status = 403;
            response = {
              status: "failed",
              data: validation.data,
              error: validation.failedRules,
              meta: validation.rules,
            };
          }

        } else {
          ctx.response.status = 403;
          response = {
            status: "failed",
            data: "",
            error: "User access forbidden",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 404;
        response = {
          status: "failed",
          data: "",
          error: "Invalid User",
          meta: "",
        };
      }
    } catch (error) {
      console.log("Error in create Payment Claim ", error.message);
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
  async createPayout(ctx) {
    let response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {

      const user = ctx.state.user;
      // check user
      let user_admin = await strapi
        .query("user", "admin")
        .findOne({ id: user.id });
      if (user_admin) {
        let user_access = await strapi
          .query("user-admin-access")
          .findOne({ user_id: user_admin.id });
        if (user_access) {
          const { title, project_id, description, payment_type_id } = ctx.request.body;
          let project = {};
          if (typeof title === "undefined" || !title) {
            response.errors.push("Missing the payout title.");
          }
          if (typeof payment_type_id === "undefined" || !payment_type_id) {
            response.errors.push("Missing the payment type.");
          }
          if (response.errors.length !== 0) {
            ctx.response.status = 400;
            response.status_code = 400;
            response.status = "failure";
            return response;
          }
          if (project_id) {
            project = await strapi.query("projects").findOne({ id: project_id });
          }

          let payoutPayment = {};
          const paymentType = await strapi.query("payment-types").findOne({
            id: payment_type_id
          });
          if (paymentType && paymentType.type_name === "payout") {
            let payload = {
              title: title,
              status: "unpaid",
              added_on: new Date(),
              payment_types_id: paymentType.id,
              total_payees: 0,
              total_amount: 0,
              end_date: new Date(),//we need this for filtering don't remove it
              start_date: new Date(),//we need this for filtering don't remove it
              done_by: user.id,
              done_by_name: `${user.firstname} ${user.lastname}`,
            };
            if (project_id) {
              payload["project_id"] = project_id;
            }
            if (description) {
              payload["description"] = description;
            }
            if (project) {
              payload["project_name"] = project.name;
            }
            payoutPayment = await strapi.services["payments"].create(payload);
            ctx.response.status = 200;
            response.data = payoutPayment;
          } else {
            response.status_code = 400;
            response.status = "failure";
            response.data = "Incorrect passed payment type id";
          }
        } else {
          ctx.response.status = 403;
          response = {
            status: "failed",
            data: "",
            error: "User access forbidden",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 404;
        response = {
          status: "failed",
          data: "",
          error: "User not found",
          meta: "",
        };
      }


    } catch (error) {
      console.log("Error happened in createPayout()", error);
      response.errors.push("Technical issue: Sorry we were not able to create a payout.");
      ctx.response.status = 500;
      response.status_code = 500;
      response.status = "failure";
    }
    return response;
  },
  // create payroll
  async createPayroll(ctx) {
    let response;
    try {
      const user = ctx.state.user;
      const user_admin = await strapi
        .query("user", "admin")
        .findOne({ id: user.id });
      if (user_admin) {
        const user_access = await strapi
          .query("user-admin-access")
          .findOne({ user_id: user_admin.id });
        if (user_access) {
          const rules = {
            project_id: "required|integer",
            payment_type_id: "required|integer",
            start_date: "required|date",
            end_date: "required|date",
          };
          const validation = new Validator(ctx.request.body, rules);
          if (validation.passes()) {
            const { project_id, payment_type_id, start_date, end_date } =
              ctx.request.body;
            const project = await strapi
              .query("projects")
              .findOne({ id: project_id });

            const payments_types = await strapi
              .query("payment-types")
              .findOne({ id: payment_type_id });
            if (project) {
              if (payments_types && payments_types.type_name === "payroll") {
                let payment_existed_status = await checkPaymentExisted(project_id, payment_type_id, start_date, end_date);
                if (payment_existed_status.status) {
                  let workers = [];
                  const checkPayrollPaymentExist = await strapi
                    .query("payments")
                    .findOne({
                      end_date: end_date,
                      start_date: start_date,
                      project_id: project_id,
                      payment_types_id: payment_type_id
                    });
                  if (!checkPayrollPaymentExist) {
                    let start_Date_str = moment(start_date).format("YYYY/MM/DD");
                    let end_Date_str = moment(end_date).format("YYYY/MM/DD");
                    let all_attendances = await strapi.query("new-attendance").find({
                      date_gte: start_date,
                      date_lte: end_date,
                      _limit: -1,
                      project_id: project_id,
                    });
                    if (all_attendances.length !== 0) {
                      const payroll_payment = await strapi.query("payments").create({
                        status: "",
                        total_amount: 0,
                        project_name: project.name,
                        done_by: user.id,
                        done_by_name: `${user.firstname} ${user.lastname}`,
                        end_date: end_date,
                        start_date: start_date,
                        added_on: new Date(),
                        description: "",
                        title: `${start_Date_str}-${end_Date_str}`,
                        total_payees: 0,
                        payment_types_id: payments_types.id,
                        project_id: project_id,
                        status: "unpaid",
                      });
                      const all_attendances_ids = all_attendances.map((item) => item.id);
                      const attendances_json = await getPayrollTransactions(all_attendances_ids, project_id, payroll_payment.id);
                      const attendance_data = JSON.parse(attendances_json);
                      const attendance_data_workers_ids = attendance_data.map((item) => item.worker_id);
                      const combinedWorkerShifts = utils.combineWorkerShifts(attendance_data);

                      let attendances = [];
                      if (attendance_data_workers_ids.length > 0) {
                        let all_service_providers = await strapi.query("service-providers").find({ id: attendance_data_workers_ids, _limit: -1 });
                        if (all_service_providers.length > 0) {
                          attendances = utils.payrollTransactionBody(combinedWorkerShifts, all_service_providers, payroll_payment.id);
                        }
                      }

                      for (let index = 0; index < attendances.length; index++) {
                        const item = attendances[index];
                        const total_deductions = await consumeDeductionPayroll(
                          item.assigned_worker_id,
                          payroll_payment.id,
                          project_id,
                          start_date,
                          end_date
                        );
                        let take_home = item.take_home - total_deductions;
                        item.take_home = take_home;
                        item.total_deductions = total_deductions;
                        workers.push({ ...item });
                      }
                      const total_amount = attendances.reduce((sum, item) => {
                        return sum + parseInt(item.total_earnings);
                      }, 0);

                      await strapi.query("payroll-transactions").createMany(workers);
                      const payroll_payment_updated = await strapi
                        .query("payments")
                        .update(
                          { id: payroll_payment.id },
                          { total_payees: workers.length, total_amount: total_amount }
                        );
                      response = {
                        status: "success",
                        data: {
                          payment: payroll_payment_updated,
                        },
                        error: "",
                        meta: "",
                      };

                    } else {
                      response = {
                        status: "failed",
                        data: "No Attendance available, Payment can not be created",
                        error: "",
                        meta: "",
                      };
                    }

                  } else {
                    response = {
                      status: "failed",
                      data: "payment already exist under the given time range and project",
                      error: "",
                      meta: "",
                    };
                  }
                } else {
                  response = {
                    status: "failed",
                    data: `${payment_existed_status.message}`,
                    error: "",
                    meta: ""
                  }
                }

              } else {
                response = {
                  status: "failed",
                  data: "payment type not correct, please check",
                  error: "",
                  meta: "",
                };
              }
            } else {
              response = {
                status: "failed",
                data: "project not available, please check",
                error: "",
                meta: "",
              };
            }
          } else {
            response = {
              status: "failed",
              data: validation.data,
              error: validation.failedRules,
              meta: validation.rules,
            };
          }
        } else {
          ctx.response.status = 403;
          response = {
            status: "failed",
            data: "",
            error: "User access forbidden",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 404;
        response = {
          status: "failed",
          data: "",
          error: "User not found",
          meta: "",
        };
      }

    } catch (error) {
      console.log("error reating payroll", error);
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async getAllPayments(ctx) {
    let response;
    const queries = ctx.query;
    try {
      const user = ctx.state.user;
      const user_admin = await strapi.query("user", "admin").findOne({ id: user.id });
      if (user_admin) {
        const user_access = await strapi.query("user-admin-access").findOne({ user_id: user_admin.id });
        const payment_types = await strapi.query("payment-types").find();
        if (user_access) {
          const paginated_payments = await strapi.query('payments').find({
            _or: [
              { is_claim: false },
              { is_claim_null: true }
            ],
            ...queries
          });

          queries._start = "0";
          queries._limit = "-1";
          const no_paginated_payments_without_payment_type = await strapi.query("payments").find({
            _or: [
              { is_claim: false },
              { is_claim_null: true }
            ],
            ...queries
          });

          const no_paginated_payments_without_payment_type_claim = await strapi.query("payments").find({
            _or: [
              { is_claim: true }
            ],
            ...queries
          });

          if (paginated_payments && no_paginated_payments_without_payment_type) {

            const paginated_filtered_payments = paginated_payments.map((payment) => {
              const payment_type = payment_types.find(item => parseInt(item.id) === parseInt(payment.payment_types_id));
              payment.payment_type_name = payment_type.type_name;
              payment.total_to_be_disbursed = parseInt(payment.total_amount);
              payment.has_claim = checkPaymentClaim(paginated_payments, payment.id)
              return payment;
            });

            const no_paginated_payments = no_paginated_payments_without_payment_type.map((payment) => {
              const payment_type = payment_types.find(item => parseInt(item.id) === parseInt(payment.payment_types_id));
              payment.payment_type_name = payment_type.type_name;
              return payment;
            });

            const claim_payments = no_paginated_payments_without_payment_type_claim.filter(item => item.is_claim);

            const open_payments = no_paginated_payments.filter(item => item.status === "open");
            const closed_payments = no_paginated_payments.filter(item => item.status === "closed");
            const unpaid_payments = no_paginated_payments.filter(item => item.status === "unpaid");

            const total_paid = no_paginated_payments.reduce((sum, item) => {
              let total_amount = Number.isInteger(parseInt(item.total_amount)) ? item.total_amount : 0;
              return sum + parseInt(total_amount);
            }, 0);
            const total_unpaid = unpaid_payments.reduce((sum, item) => {
              let total_amount = Number.isInteger(parseInt(item.total_amount)) ? item.total_amount : 0;
              return sum + parseInt(total_amount);
            }, 0);
            const total_closed = closed_payments.reduce((sum, item) => {
              let total_amount = Number.isInteger(parseInt(item.total_amount)) ? item.total_amount : 0;
              return sum + parseInt(total_amount);
            }, 0);
            const total_open = open_payments.reduce((sum, item) => {
              let total_amount = Number.isInteger(parseInt(item.total_amount)) ? item.total_amount : 0;
              return sum + parseInt(total_amount);
            }, 0);
            const total_claim = claim_payments.reduce((sum, item) => {
              let total_amount = Number.isInteger(parseInt(item.total_amount)) ? item.total_amount : 0;
              return sum + parseInt(total_amount);
            }, 0);
            response = {
              status: "success",
              aggregates: {
                total_payments: no_paginated_payments.length,
                open_payments: open_payments.length,
                closed_payments: closed_payments.length,
                unpaid_payments: unpaid_payments.length,
                total_amount: {
                  total: total_paid,
                  total_unpaid: total_unpaid,
                  total_closed: total_closed,
                  total_open: total_open,
                  total_claim: total_claim
                }
              },
              data: paginated_filtered_payments,
              export: no_paginated_payments,
              meta: {
                pagination: {
                  pageSize: paginated_filtered_payments.length,
                  total: no_paginated_payments.length
                }
              },
              error: ""
            };
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: [],
              meta: {
                pagination: {
                  pageSize: 0,
                  total: 0
                }
              },
              error: "No payment found",
              meta: "",
            };
          }
        } else {
          ctx.response.status = 403;
          response = {
            status: "failed",
            data: [],
            meta: {
              pagination: {
                pageSize: 0,
                total: 0
              }
            },
            error: "User access forbidden",
            meta: "",
          };
        }

      } else {
        ctx.response.status = 404;
        response = {
          status: "failed",
          data: [],
          meta: {
            pagination: {
              pageSize: 0,
              total: 0
            }
          },
          error: "User not found",
          meta: "",
        };
      }
    } catch (error) {
      response = {
        status: "failed",
        data: [],
        meta: {
          pagination: {
            pageSize: 0,
            total: 0
          }
        },
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  /**
   * Retrieve records.
   *
   * @return {Array}
   */
  async find(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const { project_id } = ctx.request.query;
      // validate request

      if (response.errors.length !== 0) {
        ctx.response.status = 400;
        response.status_code = 400;
        response.status = "failure";
        return response;
      }

      if (ctx.query._q) {
        response.data = await strapi.services["payments"].search(ctx.query);
      } else {
        response.data = await strapi.services["payments"].find(ctx.query);
      }

      const final = [];

      for (var i = 0; i < response.data.length; i++) {
        let instant_payout = response.data[i];
        const sanitizedPayout = sanitizeEntity(instant_payout, {
          model: strapi.models["payments"],
        });
        const payrollType = await strapi.services["payment-types"].findOne({
          id: sanitizedPayout.payment_types_id,
        });
        sanitizedPayout.payroll_type = payrollType
          ? payrollType.type_name
          : "none";
        if (sanitizedPayout.hasOwnProperty("payout_type_id")) {
          delete sanitizedPayout.payout_type_id;
        }
        final.push(sanitizedPayout);
      }
      response.data = final;
    } catch (error) {
      console.log("Error happened in /payments/find()", error);
      response.errors.push(
        "Technical issue: Sorry we were not able to list out your instant payouts."
      );
      ctx.response.status = 500;
      response.status_code = 500;
      response.status = "failure";
    }

    return response;
  },
  async run(ctx) {
    console.log("Line 758 here we go!");
    const response = {
      status_code: 200,
      status: "success",
      data: {},
      errors: [],
      meta: [],
    };
    try {
      const { instant_payout_id } = ctx.request.body;
      // validate request
      if (typeof instant_payout_id === "undefined" || !instant_payout_id) {
        response.errors.push("Missing the instant_payout_id.");
      }

      if (response.errors.length !== 0) {
        ctx.response.status = 400;
        response.status_code = 400;
        response.status = "failure";
        return response;
      }

      // run payroll logic here
      const payee_data = await strapi.services.instant_payouts.getPayeeData(
        instant_payout_id
      );
      // console.log("payee_data", payee_data);

      const pathname = MOMO_URL_DISB + "v1_0/transfer";
      const headers = {
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
        "X-Target-Environment": MOMO_X_TARGET_ENV,
        "X-Reference-Id": null,
        Authorization: null,
      };

      const body = {
        amount: null,
        currency: MOMO_CURRENCY,
        externalId: null,
        payee: {
          partyIdType: MOMO_MSISDN,
          partyId: null,
        },
        payerMessage: "pay",
        payeeNote: "enjoy",
      };

      const transactions = {
        inititated: [],
        failed: [],
      };
      const instant_payout = await strapi
        .query("payments")
        .findOne({ id: instant_payout_id });

      // configure pusher
      const pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS: true,
      });

      for (let i = 0; i < payee_data.length; i++) {
        let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);

        body.amount = payee_data[i].total_earnings; // update body params
        // change to function regenarateUUID
        body.externalId = Math.floor(Math.random() * 10000);
        body.payee.partyId = "250" + payee_data[i].phone_number;

        // update header
        headers["Authorization"] = `Bearer ${access_token}`;
        headers["X-Reference-Id"] = payee_data[i].reference_id;

        await axios
          .post(pathname, body, {
            headers: headers,
          })
          .then((resp) => {
            transactions.inititated.push(payee_data[i].phone_number);
            // console.log("SUCCESS FROM PAYROLL:", resp.data);
            // console.log("SUCCESS:", resp.data);
            // update payee's status to initiated
            strapi
              .query("instant-payout-transaction-tracks")
              .update(
                { id: payee_data[i].transaction_track_id },
                { status: "initiated", timestamp: Date.now() }
              )
              .then(() => {
                pusher.trigger(
                  `transaction-status-${instant_payout.payroll_type_id}-${instant_payout_id}`,
                  `transaction-status-${instant_payout.payroll_type_id}-${instant_payout_id}-event`,
                  {
                    entity_id: payee_data[i].payee_id,
                    status: "initiated",
                  }
                );
              });
          })
          .catch((error) => {
            transactions.failed.push(payee_data[i].phone_number);

            // update payee's status to failed
            strapi
              .query("instant-payout-transaction-tracks")
              .update(
                { id: payee_data[i].transaction_track_id },
                { status: "error", timestamp: Date.now() }
              )
              .then(() => {
                pusher.trigger(
                  `transaction-status-${instant_payout.payroll_type_id}-${instant_payout_id}`,
                  `transaction-status${instant_payout.payroll_type_id}-${instant_payout_id}-event`,
                  {
                    entity_id: payee_data[i].payee_id,
                    status: "error",
                  }
                );
              });
            console.log("ERROR:", error.message);
          });

        // store data in cron logs if status is initiated
        strapi.query("transaction-cron-logs").create({
          payroll_id: instant_payout_id,
          payroll_type_id: instant_payout.payroll_type_id,
          entity_id: payee_data[i].transaction_track_id,
          reference_id: payee_data[i].reference_id,
        });
      }

      response.status = "success";
      response.status_code = 200;
      response.data = transactions;
      // update instant payout status
      await strapi
        .query("payments")
        .update({ id: instant_payout_id }, { status: "paid" });
    } catch (error) {
      console.log("Error happened in /payments/run()", error);
      response.errors.push(
        "Technical issue: Sorry we were not able to run instant payroll at the moment."
      );
      ctx.response.status = 500;
      response.status_code = 500;
      response.status = "failure";
    }

    return response;
  },
  async checkStatus(ctx) {
    const response = {
      status: "",
      statusCode: "",
      data: [],
      error: "",
      meta: "",
    };

    const instant_payout_id = ctx.params.id;
    //remove the limits to a

    const instant_payout_transactions_table = await strapi
      .query("instant-payout-transactions")
      .find({ instant_payout_id: instant_payout_id });

    const instant_payout_transactions_tracks_table = await strapi
      .query("instant-payout-transaction-tracks")
      .find({});

    // console.log(instant_payout_transactions_table, "my data--")
    if (instant_payout_transactions_table.length > 0) {
      for (let x = 0; x < instant_payout_transactions_table.length; x++) {
        for (
          let y = 0;
          y < instant_payout_transactions_tracks_table.length;
          y++
        ) {
          if (
            instant_payout_transactions_table[x].id ===
            instant_payout_transactions_tracks_table[y]
              .instant_payout_transaction_id
          ) {
            response.data.push({
              status: instant_payout_transactions_tracks_table[y].status,
              instant_payout_id:
                instant_payout_transactions_table[x].instant_payout_id,
              phone: instant_payout_transactions_table[x].phone_number,
              entity_name: instant_payout_transactions_table[x].entity_name,
              amount: instant_payout_transactions_table[x].amount,
            });
          }
        }
      }
      response.status = "success";
      response.statusCode = 200;
    } else {
      response.status = "failed";
      response.statusCode = 400;
      response.error = "Payroll with this id not found";
    }
    // console.log(instant_payout_transactions_table.length, "length of my table");

    //  console.log(response.data, "--data--- fromresponse--")
    return response;
  },
  async delete(ctx) {
    let response;
    const { id } = ctx.params;
    try {
      let deductions_types = await strapi.query("deduction-types").find({ _limit: -1 });
      // check if payment exist before deleting

      let payment = await strapi.query("payments").findOne({ id: id });

      if (payment) {
        if (payment.status.toLowerCase() === "unpaid") {
          // get payment_type
          let payment_type = await strapi
            .query("payment-types")
            .findOne({ id: payment.payment_types_id });
          if (payment_type.type_name.toLowerCase() === "payroll") {
            // delete deductions
            let deductions = await strapi
              .query("deductions")
              .find({ payment_id: payment.id, _limit: -1 });
            if (deductions.length > 0) {
              for (let index = 0; index < deductions.length; index++) {
                let deduction_type_status = getDeductionType(deductions_types, deductions[index].deduction_type_id);
                // if status is true ==> internal deduction
                if (deduction_type_status) {
                  await strapi
                    .query("deductions")
                    .update(
                      { id: deductions[index].id },
                      { payment_id: 0, payroll_id: 0 }
                    );
                } else { // if status is false ==> external deduction
                  await strapi
                    .query("deductions").delete({ id: deductions[index].id });
                }
              }
            }
            // delete deductions_transactions
            await strapi.query("deductions-transactions").delete({ payment_id: payment.id });
            // delete payroll transactions
            await strapi
              .query("payroll-transactions")
              .delete({ payment_id: payment.id });

            // delete payment
            await strapi.query("payments").delete({ id: payment.id });

            response = {
              status: "success",
              data: `Payment deleted successfully `,
              error: "",
              meta: "",
            };
          } else {
            // delete payout transactions
            await strapi
              .query("payout-transactions")
              .delete({ payment_id: payment.id })
              .then(await strapi.query("payments").delete({ id: payment.id }))
              .catch((error) => {
                console.log("ERROR:", error.message);
              });
            response = {
              status: "success",
              data: `Payment deleted successfully `,
              error: "",
              meta: "",
            };
          }
        } else {
          response = {
            status: "failed",
            data: `Only allowed to delete unpaid payment `,
            error: "",
            meta: "",
          };
        }
      } else {
        response = {
          status: "failed",
          data: `payment with ${id} does not exist `,
          error: "",
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
  async paymentDetails(ctx) {
    let response;
    const { id } = ctx.params;
    try {
      let payment = await strapi.query("payments").findOne({ id: id });
      if (payment) {
        response = {
          status: "Success",
          data: await getPaymentDetails(payment),
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "failed",
          data: `Payment with ${id} does not exist`,
          error: "",
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
  async closePayment(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const { id } = ctx.params;
      if (typeof id === "undefined" || !id) {
        response.errors.push("Missing payment_id");
      }
      if (response.errors.length !== 0) {
        ctx.response.status = 400;
        response.status_code = 400;
        response.status = "failure";
        return response;
      }
      await strapi.query("otp-verification").update({ payment_id: id }, { is_running: false });
      await strapi.services["payments"].update({ id }, { status: 'closed' });
    } catch (error) {
      console.log("Error happened in closePayment()", error);
      response.status = "failure";
    }
    return response;
  },
  async checkPaymentStatus(ctx) {
    let response;
    try {
      let rules = {
        payment_id: "required|integer"
      };
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { payment_id } =
          ctx.request.body;

        let payment = await strapi
          .query("payments")
          .findOne({ id: payment_id });
        if (payment) {
          await checkStatus(payment);
          response = {
            status: "Success",
            data: "Checking Status",
            error: "",
            meta: "",
          };
        } else {
          response = {
            status: "failed",
            data: "",
            error: "payment not available",
            meta: "",
          };
        }
      }
    } catch (error) {
      // console.log("error reating payroll", error);
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },
  async kRemitAccountValidation(ctx) {
    let response;
    try {
      let rules = {
        acctno: "required|string",
        bankid: "required|integer",
        accname: "required|string"
      };
      const request_body = ctx.request.body;
      const validation = new Validator(request_body, rules);
      if (validation.passes()) {
        const validation_response = await kremikAccountHolderValidation(request_body);
        if (validation_response.status) {
          response = Format.success("Account found", validation_response.data);
        } else {
          response = Format.notFound("Account not found", validation_response.data);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }
    } catch (error) {
      console.log(error.message);
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  async kRemitTransferFound(ctx) {
    let response;
    try {
      let rules = {
        acctno: "required|string",
        bankid: "required|integer",
        accname: "required|string",
        amount: "required|integer"
      };
      const request_body = ctx.request.body;
      const validation = new Validator(request_body, rules);
      if (validation.passes()) {
        const transfer_response = await kremikTransferRequest(request_body);
        if (transfer_response.status) {
          response = Format.success("Transfer successful", transfer_response.data);
        } else {
          response = Format.badRequest("Transfer failed", transfer_response.data);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }
    } catch (error) {
      console.log(error.message);
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  async kRemitTransactionStatus(ctx) {
    let response;
    try {
      let rules = {
        refid: "required|integer"
      };
      const request_body = ctx.request.body;
      const validation = new Validator(request_body, rules);
      if (validation.passes()) {
        const transaction_response = await kremikCheckTransactionStatus(request_body);
        if (transaction_response.status) {
          response = Format.success("Transaction found", transaction_response.data);
        } else {
          response = Format.badRequest("Transaction not found", transaction_response.data);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }
    } catch (error) {
      console.log(error.message);
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  async updatePaymentVerification(ctx) {
    let response;
    try {
      let rules = {
        payment_id: "required|integer",
      };
      const validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        const { payment_id } = ctx.request.body;
        const payment = await strapi.query("payments").findOne({ id: payment_id });
        if (payment) {
          let payment_type = await strapi.query("payment-types").findOne({ id: payment.payment_types_id });
          let all_workers = await strapi.query("service-providers").find({ _limit: -1 });
          if (payment_type) {
            if (payment_type.type_name.toString().toLowerCase() === 'payroll') {
              let payroll_transactions = await strapi.query("payroll-transactions").find({ payment_id: payment_id, _limit: -1 });
              if (payroll_transactions) {
                for (let index = 0; index < payroll_transactions.length; index++) {
                  const transaction = payroll_transactions[index];
                  let worker_found = all_workers.find(worker => worker.id.toString() === transaction.worker_id.toString());
                  if (worker_found) {
                    if (worker_found.payment_methods && worker_found.payment_methods.length > 0) {
                      let worker_payment_method = worker_found.payment_methods.find(item => item.account_number.toString() === transaction.account_number);
                      if (worker_payment_method) {
                        const is_payment_method = worker_payment_method.is_verified ?? 'nothing';
                        const payment_method = "MTN";
                        const payment_method_id = 1;
                        const payment_method_verification_desc = worker_payment_method.account_verified_desc ?? "N/A";
                        const account_number = transaction.account_number;
                        await strapi.query("payroll-transactions").update({ id: transaction.id }, { is_payment_method: is_payment_method, payment_method: payment_method, payment_method_id: payment_method_id, payment_method_verification_desc: payment_method_verification_desc, account_number: account_number });
                      }
                    }
                  }
                }
                ctx.response.status = 200;
                response = Format.success("Payment transanction updated successfully", []);
              } else {
                ctx.response.status = 400;
                response = Format.badRequest("No transactions to update", []);
              }
            } else if (payment_type.type_name.toString().toLowerCase() === 'payout') {
              let payout_transactions = await strapi.query("payout-transactions").find({ payment_id: payment_id, _limit: -1 });
              if (payout_transactions) {
                for (let index = 0; index < payout_transactions.length; index++) {
                  const transaction = payout_transactions[index];
                  let worker_found = all_workers.find(worker => worker?.phone_number?.toString() === transaction?.account_number?.toString());
                  if (worker_found) {
                    if (worker_found.payment_methods && worker_found.payment_methods.length > 0) {
                      let worker_payment_method = worker_found.payment_methods.find(item => item?.account_number?.toString() === transaction?.account_number);
                      if (worker_payment_method) {
                        const is_payment_method = worker_payment_method.is_verified ?? 'nothing';
                        const payment_method = "MTN";
                        const payment_method_id = 1;
                        const payment_method_verification_desc = worker_payment_method.account_verified_desc ?? "N/A";
                        const account_number = transaction.account_number;
                        await strapi.query("payout-transactions").update({ id: transaction.id }, { is_payment_method: is_payment_method, payment_method: payment_method, payment_method_id: payment_method_id, payment_method_verification_desc: payment_method_verification_desc, account_number: account_number });
                      }
                    }
                  }
                }
                ctx.response.status = 200;
                response = Format.success("Payment transanction updated successfully", []);
              } else {
                ctx.response.status = 400;
                response = Format.badRequest("No transactions to update", []);
              }
            }
          } else {
            ctx.response.status = 400;
            response = Format.badRequest("Payment does not have a payment type", []);
          }
        } else {
          ctx.response.status = 400;
          response = Format.badRequest("Payment not found", []);
        }
      } else {
        ctx.response.status = 400;
        response = Format.badRequest(utils.makeStringOfErrorsFromValidation(validation.errors.all()), []);
      }
    } catch (error) {
      console.log("---> ", error);
      ctx.response.status = 500;
      response = Format.internalError(error.message, []);
    }
    return response;
  },
  async runScripts() {
    let response;
    try {
      const payments = await strapi.query("payments").find({ _limit: -1, status: "closed" });
      console.log(`==================================== we are about to start build payment method inside  ${payments.length} payments ====================================`);
      for (let x = 0; x < payments.length; x++) {
        if (parseInt(payments[x].payment_types_id) === 1) {
          const payrolls = await strapi.query("payroll-transactions").find({ payment_id: payments[x].id, _limit: - 1 });
          for (let y = 0; y < payrolls.length; y++) {
            if (utils.phoneNumberValidation(payrolls[y].phone_number)) {
              const is_payment_method = "green";
              const payment_method = "MTN";
              const payment_method_id = 1;
              const payment_method_verification_desc = (payrolls[y].is_momo_verified_and_rssb_desc) ? payrolls[y].is_momo_verified_and_rssb_desc : "N/A";
              const account_number = payrolls[y].phone_number;
              await strapi.query("payroll-transactions").update({ id: payrolls[y].id }, { is_payment_method: is_payment_method, payment_method: payment_method, payment_method_id: payment_method_id, payment_method_verification_desc: payment_method_verification_desc, account_number: account_number });
            }
          }
        } else {
          const payouts = await strapi.query("payout-transactions").find({ payment_id: payments[x].id, _limit: - 1 });
          for (let z = 0; z < payouts.length; z++) {
            if (utils.phoneNumberValidation(payouts[z].phone_number)) {
              const is_payment_method = "green";
              const payment_method = "MTN";
              const payment_method_id = 1;
              const payment_method_verification_desc = "N/A";
              const account_number = payouts[z].phone_number;
              await strapi.query("payout-transactions").update({ id: payouts[z].id }, { is_payment_method: is_payment_method, payment_method: payment_method, payment_method_id: payment_method_id, payment_method_verification_desc: payment_method_verification_desc, account_number: account_number });
            }
          }
        }
        let count = x + 1;
        console.log(`${count}. Finishing payment_id ${payments[x].id}`);
      }
      response = Format.success("success", payments.length);
    } catch (error) {
      response = Format.internalError(error.message, []);
    }
    return response;
  }
};

function getdata(arrayObjcts, obj) {
  let data = [];
  for (let index = 0; index < arrayObjcts.length; index++) {
    let shift_obj = utils.getShift(obj);
    if (arrayObjcts[index].worker_id === obj.worker_id) {
      let total_amount =
        parseInt(arrayObjcts[index].total_earnings) +
        parseInt(utils.checkIfNumber(obj.daily_rate) ? (parseInt(obj.daily_rate) * (shift_obj.day_shifts + shift_obj.night_shifts)) : 0);
      let amount =
        parseInt(arrayObjcts[index].take_home) +
        parseInt(utils.checkIfNumber(obj.daily_rate) ? (parseInt(obj.daily_rate) * (shift_obj.day_shifts + shift_obj.night_shifts)) : 0);
      let worker_body_transaction = {
        total_shifts: arrayObjcts[index].total_shifts + (shift_obj.day_shifts + shift_obj.night_shifts),
        payee_type_id: arrayObjcts[index].payee_type_id,
        payment_id: arrayObjcts[index].payment_id,
        total_earnings: total_amount,
        take_home: amount,
        daily_rate: arrayObjcts[index].daily_rate,
        status: arrayObjcts[index].status,
        phone_number: arrayObjcts[index].phone_number,
        assigned_worker_id: arrayObjcts[index].assigned_worker_id,
        worker_id: arrayObjcts[index].worker_id,
        service_name: arrayObjcts[index].service_name,
        total_deductions: arrayObjcts[index].total_deductions,
        day_shifts: arrayObjcts[index].day_shifts + shift_obj.day_shifts,
        night_shifts: arrayObjcts[index].night_shifts + shift_obj.night_shifts,
        worker_name: arrayObjcts[index].worker_name,
        is_momo: arrayObjcts[index].is_momo,
        is_momo_verified_and_rssb: arrayObjcts[index].is_momo_verified_and_rssb,
        is_momo_verified_and_rssb_desc: arrayObjcts[index].is_momo_verified_and_rssb_desc,
        account_number: arrayObjcts[index].account_number,
        account_name: arrayObjcts[index].account_name,
        payment_method: arrayObjcts[index].payment_method,
        payment_method_id: arrayObjcts[index].payment_method_id,
        is_payment_method: arrayObjcts[index].is_payment_method,
        payment_method_verification_desc: arrayObjcts[index].payment_method_verification_desc,
        worker_name_momo: arrayObjcts[index].account_name
      };
      data.push(worker_body_transaction);

    } else {
      let worker_body_transaction = {
        total_shifts: arrayObjcts[index].total_shifts,
        payee_type_id: arrayObjcts[index].payee_type_id,
        payment_id: arrayObjcts[index].payment_id,
        total_earnings: arrayObjcts[index].total_earnings,
        take_home: arrayObjcts[index].take_home,
        status: arrayObjcts[index].status,
        daily_rate: arrayObjcts[index].daily_rate,
        phone_number: arrayObjcts[index].phone_number,
        assigned_worker_id: arrayObjcts[index].assigned_worker_id,
        worker_id: arrayObjcts[index].worker_id,
        service_name: arrayObjcts[index].service_name,
        total_deductions: arrayObjcts[index].total_deductions,
        day_shifts: arrayObjcts[index].day_shifts,
        night_shifts: arrayObjcts[index].night_shifts,
        worker_name: arrayObjcts[index].worker_name,
        is_momo: arrayObjcts[index].is_momo,
        is_momo_verified_and_rssb: arrayObjcts[index].is_momo_verified_and_rssb,
        is_momo_verified_and_rssb_desc: arrayObjcts[index].is_momo_verified_and_rssb_desc,
        account_number: arrayObjcts[index].account_number,
        account_name: arrayObjcts[index].account_name,
        payment_method: arrayObjcts[index].payment_method,
        payment_method_id: arrayObjcts[index].payment_method_id,
        is_payment_method: arrayObjcts[index].is_payment_method,
        payment_method_verification_desc: arrayObjcts[index].payment_method_verification_desc,
        worker_name_momo: arrayObjcts[index].account_name
      };
      data.push(worker_body_transaction);

    }
  }
  return data;
}

async function checkPaymentExisted(project_id, payment_type_id, start_date, end_date) {
  let status = { status: false, message: "" };
  let payment_existed_start = await strapi
    .query("payments")
    .findOne({
      start_date_lte: start_date,
      end_date_gte: start_date,
      project_id: project_id,
      payment_types_id: payment_type_id
    });
  let payment_existed_end = await strapi
    .query("payments")
    .findOne({
      start_date_lte: end_date,
      end_date_gte: end_date,
      project_id: project_id,
      payment_types_id: payment_type_id
    });
  let payment_existed_start_end = await strapi
    .query("payments")
    .findOne({
      start_date_gte: start_date,
      end_date_lte: end_date,
      project_id: project_id,
      payment_types_id: payment_type_id
    });
  if (payment_existed_start) {
    status = { status: false, message: "The start date is in use" }
  } else if (payment_existed_end) {
    status = { status: false, message: "The end date is in use" }
  } else if (payment_existed_start_end) {
    status = { status: false, message: "The end date and start date is in use" }
  } else {
    status = { status: true, message: "" }
  }
  return status;
}

function getDeductionType(deductions_Types, id) {
  let status = false;
  let deduction_types_response = deductions_Types.filter(item => item.id.toString() === id.toString());
  if (deduction_types_response.length > 0) {
    if (deduction_types_response[0].is_external === false) {
      status = true;
    }

  }
  return status;
}

function checkPaymentClaim(all_payments, payment_id) {
  let status = false;
  const payments_claims = all_payments.filter(item => item.payment_id_claim?.toString() === payment_id.toString());
  if (payments_claims.length > 0) {
    status = true;
  }
  return status;
}