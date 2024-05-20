"use strict";
const { v4: uuid } = require("uuid");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  /**
   * Creates payee data for MoMo API
   *
   * @returns JSON data
   */
  async getPayeeData(instant_payout_id) {
    const entities = await strapi
      .query("instant-payout-transactions")
      .find({ instant_payout_id, _limit: -1 });

    const result = [];

    for (let i = 0; i < entities.length; i++) {
      const payee_data = {
        transaction_track_id: -1,
        payee_id: -1,
        phone_number: "",
        total_earnings: 0,
        reference_id: "",
      };

      const all_tracks = await strapi
        .query("instant-payout-transaction-tracks")
        .find({
          instant_payout_transaction_id: entities[i].id,
          // status_nin: ["successful", "error", "initiated"],
          _sort: "id:desc",
        });

      if (all_tracks && all_tracks.length) {
        // get the most recent entry from the tracks table
        const instant_payout_transaction_track = all_tracks[0];
        // console.log(
        //   "instant_payout_transaction_track id",
        //   instant_payout_transaction_track.id
        // );
        // if status is failed, create new entry in the database for the future
        if (instant_payout_transaction_track.status == "failed") {
          await strapi
            .query("instant-payout-transaction-tracks")
            .create({
              payroll_type_id: instant_payout_transaction_track.payroll_type_id,
              status: "need to re-run",
              timestamp: Date.now(),
              instant_payout_transaction_id: entities[i].id,
              reference_id: uuid(),
            })
            .then((data) => {
              payee_data.transaction_track_id = data.id;
              payee_data.payee_id = entities[i].id;
              payee_data.phone_number = entities[i].phone_number;
              payee_data.total_earnings = entities[i].amount;
              payee_data.reference_id = data.reference_id;

              result.push(payee_data);
            });
        } else if (instant_payout_transaction_track.status == "unpaid") {
          // otherwise push payee data
          payee_data.transaction_track_id = instant_payout_transaction_track.id;
          payee_data.payee_id = entities[i].id;
          payee_data.phone_number = entities[i].phone_number;
          payee_data.total_earnings = entities[i].amount;
          payee_data.reference_id =
            instant_payout_transaction_track.reference_id;

          result.push(payee_data);
        }
      }
    }

    return result;
  },
};
