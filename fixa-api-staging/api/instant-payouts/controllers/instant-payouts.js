"use strict";
const { sanitizeEntity } = require("strapi-utils");
const moment = require("moment");
const axios = require("axios");
const Pusher = require("pusher");
const _ = require("underscore");
const { v4: uuid } = require("uuid");
const MOMO_URL_DISB = process.env.MOMO_URL_DISB;
const MOMO_PRIMARY_KEY = process.env.MOMO_PRIMARY_KEY;
const MOMO_X_TARGET_ENV = process.env.MOMO_X_TARGET_ENV;
const MOMO_ACCOUNT_HOLDER_ID_TYPE = process.env.MOMO_ACCOUNT_HOLDER_ID_TYPE;
const MOMO_MSISDN = process.env.MOMO_MSISDN;
const MOMO_CURRENCY = process.env.MOMO_CURRENCY;
const { getMomoToken } = require("../../../config/functions/momotoken");

const createInstantPayoutEntry = async (payroll_type_id, project_id) => {
  let IsEntryCreated = false;
  try {
    let instantPayout = await strapi.services["instant-payouts"].findOne({
      payroll_type_id,
      project_id,
      status: "pending",
    });
    if (instantPayout) {
      await strapi.services["instant-payouts"].update(
        { id: instantPayout.id },
        {
          payroll_type_id,
          project_id,
          added_on: new Date().getTime()
        }
      );
      IsEntryCreated = true;
      return IsEntryCreated;
    }
    instantPayout = await strapi.services["instant-payouts"].create({
      payroll_type_id,
      project_id,
      status: "pending",
      added_on: new Date().getTime(),
    });

    if (instantPayout) {
      IsEntryCreated = true;
      return IsEntryCreated;
    }
  } catch (error) {
    console.log("Error happened in /instant-payouts/createInstantPayoutEntry()", error.message);
  }

  return IsEntryCreated;
};
module.exports = {
  /**
   * Create instant payout entry.
   *
   * @return {Object}
   */

  async create(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const { payroll_type_id, project_id } = ctx.request.body;
      // validate request
      if (
        (typeof payroll_type_id === "undefined" || !payroll_type_id) &&
        (typeof project_id === "undefined" || !project_id)
      ) {
        response.errors.push("Missing the project_id and payroll_type_id.");
      } else if (typeof payroll_type_id === "undefined" || !payroll_type_id) {
        response.errors.push("Missing the payroll_type_id.");
      } else if (typeof project_id === "undefined" || !project_id) {
        response.errors.push("Missing the project_id.");
      }
      if (response.errors.length !== 0) {
        ctx.response.status = 400;
        response.status_code = 400;
        response.status = "failure";
        return response;
      }

      // All requirements are Okay, proceed to creating entry in the background
      createInstantPayoutEntry(payroll_type_id, project_id);
      ctx.response.status = 200;
    } catch (error) {
      console.log("Error happened in /instant-payouts/create()", error);
      response.errors.push(
        "Technical issue: Sorry we were not able to list out your instant payouts."
      );
      ctx.response.status = 500;
      response.status_code = 500;
      response.status = "failure";
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
      if (typeof project_id === "undefined" || !project_id) {
        response.errors.push("Missing the project_id.");
      }

      if (response.errors.length !== 0) {
        ctx.response.status = 400;
        response.status_code = 400;
        response.status = "failure";
        return response;
      }

      if (ctx.query._q) {
        response.data = await strapi.services["instant-payouts"].search(
          ctx.query
        );
      } else {
        response.data = await strapi.services["instant-payouts"].find(
          ctx.query
        );
      }

      const final = [];

      for (var i = 0; i < response.data.length; i++) {
        let instant_payout = response.data[i];
        const sanitizedPayout = sanitizeEntity(instant_payout, {
          model: strapi.models["instant-payouts"],
        });
        const payrollType = await strapi.services["payroll-types"].findOne({
          id: sanitizedPayout.payroll_type_id,
        });
        sanitizedPayout.payroll_type = payrollType ? payrollType.name : "none";
        sanitizedPayout.added_on = sanitizedPayout.added_on
          ? moment(Number(sanitizedPayout.added_on)).format("YYYY/MM/DD")
          : "-";
        if (sanitizedPayout.hasOwnProperty("created_at")) {
          delete sanitizedPayout.created_at;
        }
        if (sanitizedPayout.hasOwnProperty("updated_at")) {
          delete sanitizedPayout.updated_at;
        }
        if (sanitizedPayout.hasOwnProperty("payout_type_id")) {
          delete sanitizedPayout.payout_type_id;
        }
        final.push(sanitizedPayout);
      }
      response.data = final;
    } catch (error) {
      console.log("Error happened in /instant-payouts/find()", error);
      response.errors.push(
        "Technical issue: Sorry we were not able to list out your instant payouts."
      );
      ctx.response.status = 500;
      response.status_code = 500;
      response.status = "failure";
    }

    return response;
  },
  /**
   *
   *
   * request:
   * {
   *    "instant_payout_id": int
   * }
   */
  async run(ctx) {
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
        // "X-Reference-Id": null,
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
        .query("instant-payouts")
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
        .query("instant-payouts")
        .update({ id: instant_payout_id }, { status: "paid" });
    } catch (error) {
      console.log("Error happened in /instant-payouts/run()", error);
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
};
