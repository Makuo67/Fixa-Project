"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
const { createUpdateAttendance } = require("../../new-attendance/services/new-attendance");
const { buildWorkForce } = require("../../workforce/services/workforce");
const redisService = require("../../../config/redis");
const redisClient = redisService.getClient();

module.exports = {
  lifecycles: {
    async afterCreate(result, data, funcName, others) {
      switch (funcName) {
        //Save worker during an atendance record
        case "saveWorker":
          // filtering worker rates
          const rates = others[4].filter((item) => item.service_id === data.services);
          //we need this because, on attendance .....
          const entryAssignedAttendance = {
            worker_id: result.id,
            project_id: others[0] ? others[0] : 0,
            is_active: false,
          };
          await strapi
            .query("new-assigned-workers")
            .create(entryAssignedAttendance)
            .then(async (assigned) => {
              const entryWorkerRates = {
                assigned_worker_id: assigned.id,
                service_id: data.services,
                rate_type: data.daily_rate ? "negotiated" : "standard",
                value: data.daily_rate ? data.daily_rate : rates[0].beginner_rate,
              };
              await strapi
                .query("worker-rates")
                .create(entryWorkerRates)
                .then(() => {
                  if (others.length == 5) {
                    let attendancebody = {
                      project_id: others[0],
                      date: others[1],
                      supervisor_id: others[2],
                      shift_id: others[3],
                      workers_assigned: [assigned.id],
                    };
                    createUpdateAttendance(attendancebody, "attendance");
                  }
                });
            });
          break;

        // Create new user on the form
        case "registerWorker":
          const entryAssignedRegister = { worker_id: result.id, project_id: 0, is_active: false, };
          strapi
            .query("new-assigned-workers")
            .create(entryAssignedRegister)
            .then((assigned) => {
              const entryWorkerRates = {
                assigned_worker_id: assigned.id,
                service_id: data.services,
                rate_type: data.daily_rate ? "negotiated" : "standard",
                value: data.daily_rate ? data.daily_rate : 0,
              };
              strapi.query("worker-rates").create(entryWorkerRates);
            });
          break;
        case "start":
          const workerAssignedRegister = { worker_id: result.id, project_id: 0, is_active: false, };
          await strapi.query("new-assigned-workers").create(workerAssignedRegister);
          const workers_to_build = [{ worker_id: result.id, project_id: 0 }];
          await buildWorkForce(workers_to_build);
          // .then((assigned) => {
          //   const entryWorkerRates = {
          //     assigned_worker_id: assigned.id,
          //     service_id: 0,
          //     rate_type: data.daily_rate ? "negotiated" : "standard",
          //     value: data.daily_rate ? data.daily_rate : 0,
          //   };
          //   strapi.query("worker-rates").create(entryWorkerRates);
          // });
          break;

        /* ==== When saving Temporary excel ==== */
        case "saveTempExcel":
          const entryAssignedExcel = {
            worker_id: result.id,
            project_id: data.project_id,
            is_active: data.is_active,
          };
          await strapi
            .query("new-assigned-workers")
            .create(entryAssignedExcel)
            .then(async (assigned) => {
              const entryWorkerRates = {
                assigned_worker_id: assigned.id,
                service_id: data.service_id,
                rate_type: data.daily_earnings ? "negotiated" : "standard",
                value: data.daily_earnings ? data.daily_earnings : 0,
              };
              // TODO: send Message to worker about registration result
              // Build workforce
              await strapi
                .query("worker-rates")
                .create(entryWorkerRates)
                .then(() => {
                  // strapi.services.workforce.buildWorker(result.id, entryAssignedExcel.project_id);
                });
                const workers_to_build = [{ worker_id: result.id, project_id: 0 }];
                await buildWorkForce(workers_to_build);
              // Deleting the worker in temp-table
              await strapi.query("temp-workers-table").delete({ id: data.id });
            });
          break;
        default:
          return {
            status: "failed",
            statusCode: 400,
            message: "Failed recording Workers",
          };
      }
      for await (const key of redisClient.scanIterator()) {
        redisClient.del(key, (err, reply) => {
          if (err) {
            console.error(err);
          } else {
            console.log('Keys deleted:', reply);
          }
          redisClient.quit();
        });
      }     
    },
    async afterUpdate(result, params, data) {
      const assigned_worker = await strapi.query("new-assigned-workers").findOne({ worker_id: result.id, _sort: "created_at:DESC" });
      if (assigned_worker) {
        const workers_to_build = [{ worker_id: result.id, project_id: assigned_worker.project_id }];
        await buildWorkForce(workers_to_build);
      }
    },
    async beforeUpdate(params, data) {
      const worker_id = params.id;
      if (worker_id) {
        const worker_data = await strapi.query("service-providers").findOne({ id: worker_id });
        if (worker_data.is_momo_verified_and_rssb && worker_data.is_momo_verified_and_rssb === "green") { //to remove a phone_number if it is verified
          delete data.phone_number;
          delete data.is_momo_verified_and_rssb;
          delete data.is_momo_verified_and_rssb_desc;
        }
        if (worker_data.is_rssb_verified && worker_data.is_rssb_verified === "green") { //to remove a nid_number,first_name,last_name and date_of_birth  if it is verified
          delete data.nid_number;
          delete data.date_of_birth;
          delete data.is_rssb_verified;
          delete data.is_rssb_verified_desc;
        }
      }
    },
  },
};
