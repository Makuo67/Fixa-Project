"use strict";

const axios = require("axios");
const _ = require("underscore");
const { v4: uuid } = require("uuid");
const Pusher = require("pusher");
const moment = require('moment');
const { checkTransactionStatus, singlePayrolWorker } = require("../services/payroll_details");
const MOMO_URL_DISB = process.env.MOMO_URL_DISB;
const MOMO_PRIMARY_KEY = process.env.MOMO_PRIMARY_KEY;
const MOMO_X_TARGET_ENV = process.env.MOMO_X_TARGET_ENV;
const MOMO_MSISDN = process.env.MOMO_MSISDN;
const MOMO_CURRENCY = process.env.MOMO_CURRENCY;
const { getMomoToken } = require("../../../config/functions/momotoken");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async findByPayroll(ctx) {
    const { payroll_id, filters } = ctx.request.body;
    return await strapi.services.payroll_details.createPayrollTable(
      payroll_id,
      filters
    );
  },
  // checking momo balance associated to the APIUSER and APIKEY
  async momoCheckBalance(ctx) {
    try {
      let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
      let resp = await axios.get(MOMO_URL_DISB + "v1_0/account/balance", {
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
      if (resp.status === 200) {
        let response = {
          status: "success",
          statusCode: 200,
          data: resp.data,
          error: "",
          meta: "",
        };
        return response;
      } else {
        let response = {
          status: "failed",
          statusCode: 400,
          data: resp.data,
          error: "",
          meta: "",
        };
        return response;
      }
    } catch (error) {
      console.log(error.message);
      let response = {
        status: "failed",
        statusCode: 400,
        data: error.message,
        error: "",
        meta: "",
      };
      return response;
    }
  },
  // validate phone_number_routine_payroll
  async validatePhoneNumberRoutine(ctx) {
    let response = {
      status: "failed",
      statusCode: 400,
      data: null,
      error: "",
      meta: "",
    };
    let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
    let axios_account_validations = [];
    const { payroll_id, filters } = ctx.request.body;
    let payroll_details_workers = await strapi.query("payroll-details").find({ payroll_id: payroll_id, _limit: -1 });
    if (payroll_details_workers) {
      for (let index = 0; index < payroll_details_workers.length; index++) {
        let worker_phone_number = payroll_details_workers[index].worker_phone_number;
        if (worker_phone_number && worker_phone_number.length === 10) {
          axios_account_validations.push(
            axios.get(
              MOMO_URL_DISB +
              "v1_0/accountholder/msisdn/25" +
              worker_phone_number +
              "/active",
              {
                headers: {
                  "Content-Length": 0,
                  Accept: "*/*",
                  "Accept-Encoding": "gzip, deflate, br",
                  Connection: "keep-alive",
                  "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
                  "X-Target-Environment": MOMO_X_TARGET_ENV,
                  Authorization: `Bearer ${access_token}`,
                },
              }
            )
          );
        }

      }
    }
  },
  // Validate phone number for MOMO
  async validateAccountHolder(ctx) {
    let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
    const { payroll_id, filters } = ctx.request.body;
    const payroll_table =
      await strapi.services.payroll_details.createPayrollTable(
        payroll_id,
        filters
      );
    let axios_account_validations = [];
    let response = {
      status: "failed",
      statusCode: 400,
      data: null,
      error: "",
      meta: "",
    };
    if (payroll_table) {
      let resp = payroll_table.table;
      for (let x = 0; x < payroll_table.table.length; x++) {
        if (
          payroll_table.table[x].phone_number &&
          payroll_table.table[x].phone_number.length === 10
        ) {
          axios_account_validations.push(
            axios.get(
              MOMO_URL_DISB +
              "v1_0/accountholder/msisdn/25" +
              payroll_table.table[x].phone_number +
              "/active",
              {
                headers: {
                  "Content-Length": 0,
                  Accept: "*/*",
                  "Accept-Encoding": "gzip, deflate, br",
                  Connection: "keep-alive",
                  "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
                  "X-Target-Environment": MOMO_X_TARGET_ENV,
                  Authorization: `Bearer ${access_token}`,
                },
              }
            )
          );
        }
      }
      await axios.all(axios_account_validations).then(
        axios.spread((...responses) => {
          for (let x = 0; x < responses.length; x++) {
            for (let y = 0; y < resp.length; y++) {
              if (x === y) {
                resp[y].momo = responses[x].data.result;
              }
            }
          }
        })
      );
      response.status = "success";
      response.statusCode = 200;
      response.data = resp;
    }
    return response;
  },
  // run-payroll for routine_payroll
  async run_routine_payroll(ctx) {
    let response;
    const { payroll_id } = ctx.request.body;
    // check if payroll exist
    let payroll = await strapi.query("payroll").find({ id: payroll_id });
    // if yes
    if (payroll) {
      // generate uuid
      await generateUUID(payroll_id);
      // pay workers
      payWorkers(payroll_id);
      response = {
        status: "Successfull, Payment Initiated",
        statusCode: 200,
        data: null,
        error: "",
        meta: "",
      }
    } else {
      response = {
        status: "Not found, payroll with id" + payroll_id,
        statusCode: 404,
        data: null,
        error: "",
        meta: "",
      }
    }
    return response;
  },
  // check transaction status on routine_payroll
  async check_routine_payroll_transaction_status(ctx) {
    let response;
    const data = ctx.request.body;
    await checkTransactionStatus(data.payroll_id);
    response = {
      status: "success",
      statusCode: 200,
      data: null,
      error: "",
      meta: "",
    };
    return response;
  },
  // Initiate a payment to all workers in specific interval
  async runPayroll(ctx) {
    let response = {
      status: "failed",
      statusCode: 400,
      data: null,
      error: "",
      meta: "",
    };
    const { payroll_id } = ctx.request.body;
    const payee_data = await strapi.services.payroll_details.getPayeeData(
      payroll_id
    );
    let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
    for (let x = 0; x < payee_data.length; x++) {
      await axios
        .post(
          MOMO_URL_DISB + "v1_0/transfer",
          {
            amount: payee_data.deducted_earnings,
            currency: MOMO_CURRENCY,
            externalId: Math.floor(Math.random() * 10000),
            payee: {
              partyIdType: MOMO_MSISDN,
              partyId: "25" + payee_data.phone_number,
            },
            payerMessage: "pay",
            payeeNote: "enjoy",
          },
          {
            headers: {
              Accept: "*/*",
              "Accept-Encoding": "gzip, deflate, br",
              Connection: "keep-alive",
              "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
              "X-Target-Environment": MOMO_X_TARGET_ENV,
              "X-Reference-Id": payee_data.reference_id,
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        .then(function (resp) {
          strapi
            .query("payroll-details")
            .update(
              { id: payee_data.payroll_details_id },
              { status: "initiated" }
            );
        })
        .catch(function (error) {
          console.log(error.message);
        });
    }
    const PAYROLL_SUCCESS = true;
    response.status = "success";
    response.statusCode = 200;
    response.data = "Paid";
    if (PAYROLL_SUCCESS) {
      await strapi
        .query("payroll")
        .update({ id: payroll_id }, { payroll_status: "paid" });
    }
    return response;
  },
  // Check transaction status to all workers in specific interval
  async transferStatus(ctx) {
    let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
    const { payroll_id, filters } = ctx.request.body;
    const payroll_table =
      await strapi.services.payroll_details.createPayrollTable(
        payroll_id,
        filters
      );
    for (let x = 0; x < payroll_table.table.length; x++) {
      await axios
        .get(
          MOMO_URL_DISB +
          "v1_0/transfer/" +
          payroll_table.table[x].reference_id,
          {
            headers: {
              "Content-Length": 0,
              Accept: "*/*",
              "Accept-Encoding": "gzip, deflate, br",
              Connection: "keep-alive",
              "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
              "X-Target-Environment": MOMO_X_TARGET_ENV,
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        .then(function (response) {
          strapi.query("payroll-details").update(
            { id: payroll_table.table[x].id },
            {
              status: response.data.status.toLowerCase(),
              error_message: response.data?.reason,
            }
          );
        })
        .catch(function (error) {
          console.log("error", error.message);
        });
    }
    const result = await strapi.services.payroll_details.createPayrollTable(
      payroll_id,
      filters
    );
    let response = {
      status: "success",
      statusCode: 200,
      data: result,
      error: "",
      meta: "",
    };
    return response;
  },
  // Check transaction status to specific workers in specific interval
  async specifyTransferStatus(ctx) {
    let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
    const { workers_to_check_status, payroll_id, filters } = ctx.request.body;
    for (let x = 0; x < workers_to_check_status.length; x++) {
      await axios
        .get(
          MOMO_URL_DISB +
          "v1_0/transfer/" +
          workers_to_check_status[x].reference_id,
          {
            headers: {
              "Content-Length": 0,
              Accept: "*/*",
              "Accept-Encoding": "gzip, deflate, br",
              Connection: "keep-alive",
              "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
              "X-Target-Environment": MOMO_X_TARGET_ENV,
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        .then(function (response) {
          strapi.query("payroll-details").update(
            {
              worker: workers_to_check_status[x].worker_id,
              payroll_id: payroll_id,
            },
            {
              status: response.data.status.toLowerCase(),
              error_message: response.data?.reason,
            }
          );
        })
        .catch(function (error) {
          console.log(error.message);
        });
    }
    const { table } = await strapi.services.payroll_details.createPayrollTable(
      payroll_id,
      filters
    );

    let result = _.filter(table, function (t) {
      let x = _.findWhere(workers_to_check_status, {
        reference_id: t.reference_id,
      });
      if (x) {
        return t;
      }
    });

    let response = {
      status: "success",
      statusCode: 200,
      data: result,
      error: "",
      meta: "",
    };
    return response;
  },
  // Initiate a payment to specific workers in specific interval
  async specifyReRunPayroll(ctx) {
    let response = {
      status: "failed",
      statusCode: 400,
      data: null,
      error: "",
      meta: "",
    };
    const { workers_to_pay, payroll_id } = ctx.request.body;
    let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
    let workers_after_pay = [];
    for (let x = 0; x < workers_to_pay.length; x++) {
      let reference_id = uuid();
      await axios
        .post(
          MOMO_URL_DISB + "v1_0/transfer",
          {
            amount: workers_to_pay[x].worker_money,
            currency: MOMO_CURRENCY,
            externalId: Math.floor(Math.random() * 10000),
            payee: {
              partyIdType: MOMO_MSISDN,
              partyId: "25" + workers_to_pay[x].worker_phone,
            },
            payerMessage: "re-pay",
            payeeNote: "second trying enjoy",
          },
          {
            headers: {
              Accept: "*/*",
              "Accept-Encoding": "gzip, deflate, br",
              Connection: "keep-alive",
              "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
              "X-Target-Environment": MOMO_X_TARGET_ENV,
              "X-Reference-Id": reference_id,
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        .then(function (resp) {
          strapi
            .query("payroll-details")
            .update(
              { worker: workers_to_pay[x].worker_id, payroll_id: payroll_id },
              { status: "initiated", reference_id: reference_id }
            );
          workers_after_pay.push({
            worker_id: workers_to_pay[x].worker_id,
            worker_money: workers_to_pay[x].worker_money,
            worker_phone: workers_to_pay[x].worker_phone,
            transaction_status: "initiated",
          });
        })
        .catch(function (error) {
          console.log(error.message);
        });
    }
    response.status = "success";
    response.statusCode = 200;
    response.data = workers_after_pay;
    return response;
  },
  async getSummary(ctx) {
    // const { id } = ctx.params;
    // {
    //   "method": "GET",
    //   "path": "/app/payroll-summary/:id",
    //   "handler": "payroll-details.getSummary",
    //   "config": {
    //     "policies": []
    //   }
    // },
    const { payroll_id, filters } = ctx.request.body;
    // return await strapi.services.payroll_details.createPayrollTable(payroll_id);
    let response = await strapi.services.payroll_details.payroll_response(payroll_id, filters);
    return response;
  },
  /**
   * Applies deductions on a single person entry of a payroll
   *
   **/
  async deduct(ctx) {
    const { project_id, payroll_id, worker_id, deductions } = ctx.request.body;
    const deduction_types = await strapi
      .query("deduction-types")
      .find({ project_id, is_available: true });
    const requested_deduction_types = [];

    // add and/or update entries in the deduction table
    deductions.map(async (deduction) => {
      // find the corresponding deduction type title
      const my_type = deduction_types.find(
        (deduction_type) => deduction_type.title === deduction.type
      );
      // save deducted type IDs for checking for duplicates
      requested_deduction_types.push(my_type.id);

      const my_deduction = {
        project_id,
        payroll_id,
        worker_id,
        deduction_type: my_type.id,
      };

      const deduction_exists = await strapi
        .query("deductions")
        .findOne(my_deduction)
        .catch((err) => console.log("error in deduction_exists", err));
      if (deduction_exists) {
        // in order to avoid updating deductions that were not technically changed
        const should_update = await strapi
          .query("deductions")
          .find({ ...my_deduction, deduction_amount_ne: deduction.amount });

        if (should_update) {
          should_update.map((item) => {
            strapi
              .query("deductions")
              .update({ id: item.id }, { deduction_amount: deduction.amount })
              .then((e) => console.log("UPDATED DEDUCTION ID:", item.id))
              .catch((e) => console.log("ERROR:", e));
          });
        }
      } else {
        //  if some deduction does not exist, create new
        strapi
          .query("deductions")
          .create({ ...my_deduction, deduction_amount: deduction.amount });
      }
    });

    // clear out any deductions that are not in the request body
    const delete_data = {
      payroll_id: parseInt(payroll_id),
      worker_id: worker_id,
      deduction_type_nin: requested_deduction_types,
    };
    const should_delete = await strapi
      .query("deductions")
      .find(delete_data)
      .catch((err) => console.log("\n\n\n\nerror in should_delete", err));

    if (should_delete.length > 0) {
      should_delete.map((item) => {
        strapi
          .query("deductions")
          .delete({
            payroll_id: parseInt(payroll_id),
            worker_id: worker_id,
            deduction_type: item.deduction_type.id,
          })
          .catch((err) => console.log("\n\n\nerror in delete", err));
      });
    }

    let response = {
      status: "success",
    };
    return response;
  },
  async holdWorker(ctx) {
    const { worker_id, payroll_id } = ctx.request.body;
    return await strapi
      .query("payroll-details")
      .update({ payroll_id: payroll_id, worker: worker_id }, { on_hold: true })
      .then((data) => {
        return { status: "success", data: data };
      })
      .catch((err) => {
        return { status: "failure", message: err };
      });
  },
  async enableWorker(ctx) {
    const { worker_id, payroll_id } = ctx.request.body;
    return await strapi
      .query("payroll-details")
      .update({ payroll_id: payroll_id, worker: worker_id }, { on_hold: false })
      .then((data) => {
        return { status: "success", data: data };
      })
      .catch((err) => {
        return { status: "failure", message: err };
      });
  },
  /**
   * Populates the payroll-details table from
   * old run-payroll table
   */
  async populateTable() {
    // get all payroll details
    let payroll_details = await strapi
      .query("payroll-details")
      .find({ _limit: -1 }, [""]);

    // these are the IDs of payrolls that are in payroll details table
    // this is needed to get run payroll entries
    let payroll_details_id = [
      ...new Set(payroll_details?.map((item) => item.payroll_id)),
    ];

    // find run payrolls which are not already in payroll details
    let run_payrolls = await strapi
      .query("run-payroll")
      .find({ payroll_id_nin: payroll_details_id, _limit: -1 });

    if (run_payrolls.length > 0) {
      // sum total earnings for a particular worker
      // and total shifts
      var entity = {};
      var updated_run_payrolls = run_payrolls.reduce(function (prev, curr) {
        var key = curr.payroll_id + "/" + curr.worker_id;
        if (!entity[key]) {
          entity[key] = curr;
          prev.push(entity[key]);
        } else {
          entity[key].earnings =
            parseInt(entity[key].earnings || 0) + parseInt(curr.earnings || 0);
          entity[key].days_worked =
            parseInt(entity[key].days_worked) + parseInt(curr.days_worked);
        }
        return prev;
      }, []);

      // find all worker deductions outside of the map
      // because of async effects
      let worker_deductions = await strapi.query("deductions").find({});

      // create new entries in the payroll details table
      updated_run_payrolls.map(async (item) => {
        // find my worker
        const my_worker_deductions = worker_deductions.filter(
          (o) =>
            o.worker_id == item.worker_id &&
            o.project_id == item.project_id &&
            o.payroll_id == item.payroll_id
        );
        // sum up worker deductions
        const total_deductions = my_worker_deductions?.reduce(
          (n, { deduction_amount }) => n + deduction_amount,
          0
        );
        const create_body = {
          project_id: item.project_id,
          payroll_id: item.payroll_id,
          worker: item.worker_id,
          total_shifts: item.days_worked,
          initial_earnings: item.earnings,
          deducted_earnings: item.earnings - total_deductions,
          total_deductions: total_deductions,
          deductions: my_worker_deductions,
        };
        await strapi
          .query("payroll-details")
          .create(create_body)
          .catch((err) => console.log(err));
      });
      return { status: "success" };
    } else {
      return { status: "error", message: "payroll not found." };
    }
  },
  async populateTotalShifts() {
    // find all run payrolls
    let run_payrolls = await strapi.query("run-payroll").find({ _limit: -1 });

    if (run_payrolls.length > 0) {
      // sum total shifts for a particular worker
      var entity = {};
      var updated_run_payrolls = run_payrolls.reduce(function (prev, curr) {
        var key = curr.payroll_id + "/" + curr.worker_id;
        if (!entity[key]) {
          entity[key] = curr;
          prev.push(entity[key]);
        } else {
          entity[key].days_worked =
            parseInt(entity[key].days_worked) + parseInt(curr.days_worked);
        }
        return prev;
      }, []);

      // create new entries in the payroll details table
      updated_run_payrolls.map(async (item) => {
        const update_body = {
          total_shifts: item.days_worked,
        };
        const my_worker = {
          worker: item.worker_id,
          project_id: item.project_id,
          payroll_id: item.payroll_id,
        };
        await strapi
          .query("payroll-details")
          .update(my_worker, update_body)
          .catch((err) => console.log(err));
      });
      return { status: "success" };
    } else {
      return { status: "error" };
    }
  },
  async getSinglePayrollHistory(ctx) {
    let response = {
      status: "failed",
      statusCode: 400,
      data: null,
      error: "",
      meta: "",
    };
    const { worker_id } = ctx.query;
    let worker_payment_history = await singlePayrolWorker(worker_id);
    worker_payment_history = JSON.parse(worker_payment_history);
    if (worker_id && worker_payment_history.length >= 1) {
      response.status = "success";
      response.statusCode = 200;
      response.data = worker_payment_history;
    }
    return response;
  }
};

const payWorkers = async (payroll_id) => {
  // configure pusher
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });

  let workers_to_pay = await strapi.query("payroll-details").find({ payroll_id: payroll_id, _limit: -1 });
  for (let index = 0; index < workers_to_pay.length; index++) {
    // get momo access_token
    let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB, process.env.MOMO_PRIMARY_KEY);
    // get only if transaction status (failed,unpaid) 
    if ((workers_to_pay[index].status === "failed" || workers_to_pay[index].status === "unpaid") && workers_to_pay[index].on_hold != true) {
      //  get phone_number from workers using assigned_worker_id
      let worker_phone_number = workers_to_pay[index].worker_phone_number;
      // pay worker, if worker is present and has a phone number
      if (worker_phone_number) {
        // pay worker
        let currentTime = moment().unix();
        let payroll_type = await strapi.query("payroll-types").findOne({ id: workers_to_pay[index].payroll_type_id });
        if (payroll_type) {
          let payout_transaction_tracks = await strapi.query("instant-payout-transaction-tracks").findOne({ id: workers_to_pay[index].payout_transaction_tracks_id, status: 'unpaid', payroll_type_id: payroll_type.id }).catch((err) => console.log("error in payWorkers", err));
          if (payout_transaction_tracks) {
            await axios
              .post(
                MOMO_URL_DISB + "v1_0/transfer",
                {
                  amount: workers_to_pay[index].take_home,
                  currency: MOMO_CURRENCY,
                  externalId: currentTime,
                  payee: {
                    partyIdType: MOMO_MSISDN,
                    partyId: "25" + worker_phone_number,
                  },
                  payerMessage: "pay",
                  payeeNote: "enjoy",
                },
                {
                  headers: {
                    Accept: "*/*",
                    "Accept-Encoding": "gzip, deflate, br",
                    Connection: "keep-alive",
                    "Ocp-Apim-Subscription-Key": MOMO_PRIMARY_KEY,
                    "X-Target-Environment": MOMO_X_TARGET_ENV,
                    "X-Reference-Id": payout_transaction_tracks.reference_id,
                    Authorization: `Bearer ${access_token}`,
                  },
                }
              ).then(function (resp) {
                strapi.query("payroll-details").update({ id: workers_to_pay[index].id }, { status: "initiated" });
                strapi.query("instant-payout-transaction-tracks").update({ id: payout_transaction_tracks.id }, { timestamp: currentTime, status: "initiated" }).then(() => {
                  pusher.trigger(
                    `transaction-status-${workers_to_pay[index].payroll_type_id}-${workers_to_pay[index].payroll_id}`,
                    `transaction-status-${workers_to_pay[index].payroll_type_id}-${workers_to_pay[index].payroll_id}-event`,
                    {
                      entity_id: workers_to_pay[index].id, // payroll_detail id 
                      status: "initiated",
                    }
                  );
                });
              })
              .catch(function (error) {
                console.log(error.message);
                strapi.query("instant-payout-transaction-tracks").update({ id: payout_transaction_tracks.id }, { timestamp: currentTime, status: "error" }).then(() => {
                  pusher.trigger(
                    `transaction-status-${workers_to_pay[index].payroll_type_id}-${workers_to_pay[index].payroll_id}`,
                    `transaction-status-${workers_to_pay[index].payroll_type_id}-${workers_to_pay[index].payroll_id}-event`,
                    {
                      entity_id: workers_to_pay[index].id, // payroll_detail id 
                      status: "error",
                    }
                  );
                });
              });

            // store data in cron logs if status is initiated
            strapi.query("transaction-cron-logs").create({
              payroll_id: workers_to_pay[index].payroll_id, // payroll_id
              payroll_type_id: workers_to_pay[index].payroll_type_id, // payroll_type to be routine
              entity_id: payout_transaction_tracks.id, // transaction track id
              reference_id: payout_transaction_tracks.reference_id, // reference_id
            });
          }
        }
      }
    }
  }
  // update payroll
  await strapi.query("payroll").update({ id: payroll_id }, { payroll_status: "paid" });
  // await checkTransactionStatus(payroll_id);
}

const generateUUID = async (payroll_id) => {
  let workers_to_give_reference = await strapi.query("payroll-details").find({ payroll_id: payroll_id, _limit: -1 });

  // generate uuid for workers to pay
  for (let index = 0; index < workers_to_give_reference.length; index++) {
    let payroll_type = await strapi.query("payroll-types").findOne({ id: workers_to_give_reference[index].payroll_type_id });
    let id = workers_to_give_reference[index].id;
    // get only if transaction status (failed,unpaid) 
    if ((workers_to_give_reference[index].status === "failed" || workers_to_give_reference[index].status === "unpaid") && workers_to_give_reference[index].on_hold != true && payroll_type) {
      // generate_reference_id
      let reference_id = uuid();
      let payout_transaction_tracks_body = {
        instant_payout_transaction_id: workers_to_give_reference[index].id,
        reference_id: reference_id,
        status: "unpaid",
        payroll_type_id: payroll_type.id
      };
      // add transaction_reference_id in payout_transaction_tracks
      let bean = await strapi.query("instant-payout-transaction-tracks").create(payout_transaction_tracks_body);
      // update transaction_reference_id in payroll-details
      if (bean) {
        await strapi.query("payroll-details").update({ id }, { payout_transaction_tracks_id: bean.id });
      }
    }
  }
}