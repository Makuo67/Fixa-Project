"use strict";
const moment = require("moment");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async updateWorkerStatus(weekRange) {
    // calculate the week range between now and N (weekRange) weeks
    const today = moment();
    const n_weeks_ago = moment().subtract(weekRange, "weeks");

    // filter params to get attendance between a given week range
    const params = {
      date_gte: n_weeks_ago.format(),
      date_lte: today.format(),
    };

    const data = await strapi.query("attendance").find(params);

    // this map will have project ID as key and a set of unique worker ID's as value
    let active_workers = new Map();

    // find active workers from attendance
    data.map((attendance) => {
      // set of worker ID's
      var workers_set = new Set();

      // check if this project exists in map
      if (active_workers.has(attendance.project_id)) {
        // if so, get the workers who worked in that project
        workers_set = active_workers.get(attendance.project_id);
      }

      // add new workers to the set
      attendance.services.map((service) => {
        service.workers.map((worker) => {
          workers_set.add(worker.id);
        });
      });

      // set the key value pair
      active_workers.set(attendance.project_id, workers_set);
    });

    const active_workers_iterator = active_workers[Symbol.iterator]();
    var number_of_active_workers = 0; // for testing

    // update worker statuses
    for (const item of active_workers_iterator) {
      for (const worker_id of item[1]) {
        number_of_active_workers += 1;
        try {
          // these are inactive workers who did not work the past N or more weeks
          // but they DID work these N or less weeks, so we need to update
          // their status back to active
          const what = {
            worker_id: worker_id,
            project_id: item[0],
            status: "inactive",
          };
          const where = {
            status: "active",
            status_changed: today.format(),
          };
          // change their status to active
          strapi
            .query("assigned-workers")
            .update(what, where)
            .catch(() => { });
        } catch (err) {
          console.log("error in updateWorkerStatus ", err.message);
        }
      }
    }

    // find active workers whose status didn't change for the past N weeks
    // and change their status back to inactive
    // note: we don't even need to worry about already inactive workers whose status
    // did not change the past N weeks because they should stay inactive.
    try {
      const inactive_workers = await strapi.query("assigned-workers").find({
        status: "active",
        status_changed_lte: n_weeks_ago.format(),
        _limit: -1,
      });

      // change their status back to inactive
      inactive_workers.map((worker) => {
        try {
          strapi.query("assigned-workers").update(
            {
              worker_id: worker.worker_id,
              project_id: worker.project_id,
              job_id: worker.job_id,
            },
            {
              status: "inactive",
              status_changed: today.format(),
            }
          );
        } catch (err) {
          console.log(err.message);
        }
      });
    } catch (err) {
      console.log(err.message);
    }
  },



};
