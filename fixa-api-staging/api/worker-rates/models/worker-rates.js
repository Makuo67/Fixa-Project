'use strict';
const { buildWorkForce } = require("../../workforce/services/workforce");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async afterCreate(result) {
      let assigned_worker = await strapi.query("new-assigned-workers").findOne({ id: result.assigned_worker_id });
      if (assigned_worker) {
        let workers_to_build = [{ worker_id: assigned_worker.worker_id, project_id: assigned_worker.project_id }];
        await buildWorkForce(workers_to_build);
      }
    },
    async afterUpdate(result) {
      let assigned_worker = await strapi.query("new-assigned-workers").findOne({ id: result.assigned_worker_id });
      if (assigned_worker) {
        let workers_to_build = [{ worker_id: assigned_worker.worker_id, project_id: assigned_worker.project_id }];
        await buildWorkForce(workers_to_build);
      }
    },
  },
};
