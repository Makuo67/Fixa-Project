"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async updateWorkerRate(data) {
    for (let index = 0; index < data.length; index++) {
      let worker_rate = await strapi.query("worker-rates").findOne({ service_id: data[index].id, assigned_worker_id: data[index].assigned_worker_id, _sort: "created_at:DESC" });
      if (worker_rate) {
        let id = worker_rate.id;
        await strapi.query("worker-rates").update({ id }, { value: data[index].daily_rate });
      } else {
        await strapi.query("worker-rates").create({ service_id: data[index].id, assigned_worker_id: data[index].assigned_worker_id, value: data[index].daily_rate });
      }
    }
  },
};
