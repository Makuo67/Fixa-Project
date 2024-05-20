"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    /**
     *
     * @param {*} data
     * @param {*} dataAfter
     * Update successful and failed transactions in the payroll table
     */
    async beforeUpdate(data, dataAfter) {
      let { id } = data;
      if (!id) return;
      let dataBefore = await strapi.query("payroll-details").findOne({ id });
      if (dataBefore) {
        const change_value = 1;
        // if the status field was previously initiated
        if (dataBefore.status == "initiated" || dataBefore.status == "unpaid") {
          // only need to increment one field
          let increment_field =
            (dataAfter.status == "failed" && "failed_transactions") ||
            (dataAfter.status == "successful" && "successful_transactions");
          if (increment_field) {
            strapi
              .query("payroll")
              .model.query((qb) => {
                qb.where("id", dataBefore.payroll_id);
                qb.increment(increment_field, change_value);
              })
              .fetch();
          }
        } else if (
          dataBefore.status == "failed" ||
          dataBefore.status == "successful"
        ) {
          // payroll was re-run, thus status was changed back to initiated
          if (dataAfter.status == "initiated" || dataAfter.status == "unpaid") {
            // we need to decrement one field
            let decrement_field =
              (dataBefore.status == "failed" && "failed_transactions") ||
              (dataBefore.status == "successful" && "successful_transactions");
            if (decrement_field) {
              strapi
                .query("payroll")
                .model.query((qb) => {
                  qb.where("id", dataBefore.payroll_id);
                  qb.decrement(decrement_field, change_value);
                })
                .fetch();
            }
          } else {
            // get the increment field
            let increment_field =
              (dataAfter.status == "failed" && "failed_transactions") ||
              (dataAfter.status == "successful" && "successful_transactions");
            // and the decrement field
            let decrement_field =
              (dataBefore.status == "failed" && "failed_transactions") ||
              (dataBefore.status == "successful" && "successful_transactions");
            // check if the two fields are not the same because we don't want to
            // increment and decrement the same field
            if (
              increment_field &&
              decrement_field &&
              increment_field != decrement_field
            ) {
              strapi
                .query("payroll")
                .model.query((qb) => {
                  qb.where("id", dataBefore.payroll_id);
                  qb.increment(increment_field, change_value);
                  qb.decrement(decrement_field, change_value);
                })
                .fetch();
            }
          }
        }
      }
    },
  },
};
