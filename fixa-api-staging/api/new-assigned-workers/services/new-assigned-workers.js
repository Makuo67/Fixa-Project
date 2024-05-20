"use strict";
const moment = require("moment");
const { buildWorkForce } = require("../../workforce/services/workforce");
const utils = require("../../../config/functions/utils");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async updateWorker() {
    // calculate the week range between now and N (weekRange) weeks
    const WEEK_RANGE = 4; // number of weeks to check the attendance in
    const today = moment();
    const _4_weeks_ago = moment().subtract(WEEK_RANGE, "weeks");
    // filter params to get attendance between a given week range
    const params_attanded_worker = {
      attendance_date_gte: _4_weeks_ago.format(),
      attendance_date_lte: today.format(),
      _limit: -1,
    };

    const active_worker = await strapi.query("new-assigned-workers").find({ is_active: true, _limit: -1 });

    if (active_worker && active_worker.length >= 1) {
      for (let i = 0; i < active_worker.length; i++) {
        try {
          await strapi.query("new-assigned-workers").update({ id: active_worker[i].id }, { is_active: false });
          const workers_to_build = [{ worker_id: active_worker[i].worker_id, project_id: active_worker[i].project_id }];
          await buildWorkForce(workers_to_build);
        } catch (err) {
          console.log(err);
        }
      }
    }
    const worker_attanded_list = await strapi.query("attendancelist").find(params_attanded_worker);
    const worker_attanded = utils.removeDuplicatesByProperty(worker_attanded_list, "worker_id");
    if (worker_attanded && worker_attanded.length >= 1) {
      let counting = 0;
      for (let i = 0; i < worker_attanded.length; i++) {
        try {
          if (worker_attanded[i].worker_id && worker_attanded[i].project_id) {
            counting = counting + 1;
            await strapi.query("new-assigned-workers").update({ worker_id: worker_attanded[i].worker_id, project_id: worker_attanded[i].project_id, }, { is_active: true });
            const workers_to_build = [{ worker_id: worker_attanded[i].worker_id, project_id: worker_attanded[i].project_id }];
            await buildWorkForce(workers_to_build);
            console.log(counting, ". updated the worker with id::", worker_attanded[i].worker_id, "status to active");
          } else {
            console.log("we can't updated the worker status");
          }
        } catch (err) {
          console.log("error in forloop", err.message);
        }
      }
    }
  },
};
