"use strict";
const axios = require("axios");
const Pusher = require("pusher");
const MOMO_URL_DISB = process.env.MOMO_URL_DISB;
const MOMO_PRIMARY_KEY = process.env.MOMO_PRIMARY_KEY;
const MOMO_X_TARGET_ENV = process.env.MOMO_X_TARGET_ENV;
const {getMomoToken} = require("../../../config/functions/momotoken");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: {},
      errors: [],
      meta: [],
    };
    try {
      // console.log('I am about to check transaction statuses against MoMo');
      const transaction_cron_logs = await strapi
        .query("transaction-cron-logs")
        .find({ _limit: -1 });

      // validate request
      if (!transaction_cron_logs || !transaction_cron_logs.length) {
        response.errors.push("No transaction logs available.");
      }

      if (response.errors.length !== 0) {
        ctx.response.status = 400;
        response.status_code = 400;
        response.status = "failure";
        return response;
      }

      // check transaction status logic here

      // console.log("transaction_cron_logs", transaction_cron_logs);

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
      // configure pusher
      const pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS: true,
      });
      for (let i = 0; i < transaction_cron_logs.length; i++) {
        let { access_token } = await getMomoToken(process.env.MOMO_URL_DISB,process.env.MOMO_PRIMARY_KEY);
        headers["Authorization"] = `Bearer ${access_token}`;
        // console.log('checking status for transaction with reference_id ', transaction_cron_logs[i].reference_id);
        await axios
          .get(pathname + transaction_cron_logs[i].reference_id, {
            headers: headers,
          })
          .then((resp) => {
            // console.log("SUCCESS:", resp.data);
            // update payee's status to successful
            // console.log('Got response from Momo ', response.data);
            strapi
              .query("instant-payout-transaction-tracks")
              .update(
                { id: transaction_cron_logs[i].entity_id },
                {
                  status: resp.data.status.toLowerCase(),
                  timestamp: Date.now(),
                }
              )
              .then((data) => {
                // send pusher message
                pusher.trigger(
                  `transaction-status-${data.payroll_type_id}-${transaction_cron_logs[i].payroll_id}`,
                  `transaction-status-${data.payroll_type_id}-${transaction_cron_logs[i].payroll_id}-event`,
                  {
                    entity_id: data.instant_payout_transaction_id,
                    status: resp.data.status.toLowerCase(),
                  }
                );
              });
            // delete finished transactions
            if (resp.data.status !== "PENDING") {
              // console.log('Status is not pending so deleting ', transaction_cron_logs[i].id);
              strapi
                .query("transaction-cron-logs")
                .delete({ id: transaction_cron_logs[i].id });
            }
          })
          .catch((error) => {
            console.log("ERROR:", error.message);
          });
      }

      response.status = "success";
      response.status_code = 200;
    } catch (error) {
      console.log("Error happened in /transaction-cron-logs/find()", error);
      response.errors.push("Technical issue: Something went wrong.");
      ctx.response.status = 500;
      response.status_code = 500;
      response.status = "failure";
    }

    return response;
  },
};
