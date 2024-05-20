"use strict";
const moment = require("moment");
const _ = require("underscore");
const { createAttendanceStatus } = require("../../attendance-status/services/attendance-status");
const { createUpdateAttendanceDetails } = require("../../attendance-details/services/attendance-details");
const { NotifyClientAttendance } = require("../../notifications/services/notifications");
const { checkIfPaymentExist } = require("../../payments/services/payments");
const { removeFromAttendance } = require("../../payroll-transactions/services/payroll-transactions");
const { removeAttendanceWorkerProfile } = require("../../worker-profile/services/worker-profile");
const { redisAttendance } = require("../../attendance-page/services/attendance-page");
const { getWorkerDays } = require("../../workforce/services/workforce");
// const { dashboardMetrics } = require("../../service-providers/controllers/service-providers");
const { saveAttendanceData } = require("../../new-attendance-list/services/new-attendance-list");
const { getRssbKycs } = require("../../../config/functions/third_part_api_functions");
const redisService = require("../../../config/redis");
const redisClient = redisService.getClient();

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */


module.exports = {
  async attendanceToSync(attendance_id) {
    let response = { "error": false, "data": [] };
    try {
      const knex = strapi.connections.default;
      let attendace_sql_raw = `SELECT
        t1.date,
        t1.id,
        t1.project_id,
        t1.created_at,
        t2.name AS shift_name,
        t3.name AS project_name,
        (SELECT Count(t4.attendance_id) FROM attendance_details AS t4 WHERE t4.attendance_id = t1.id) AS total_workers,
        t5.approved_by,
        t6.full_name AS approved_by_name,
        t5.id AS attendance_status_id,
        t5.approved_time,
        t5.status
        FROM new_attendances AS t1
        LEFT JOIN shifts AS t2 ON t2.id = t1.shift_id
        LEFT JOIN projects AS t3 ON t3.id = t1.project_id
        LEFT JOIN attendance_statuses AS t5 ON t5.attendance_id = t1.id
        LEFT JOIN client_users AS t6 ON t6.user_id = t5.approved_by
        WHERE t1.id =${attendance_id}
        `;
      let attendance_data = await knex.raw(attendace_sql_raw);
      response = { "error": false, "data": attendance_data[0] };
    } catch (error) {
      console.log('error in adding data to redis', error);
      response = { "error": true, "data": [] };
    }
    return response;
  },
  // sync attendance redis
  async syncAttendanceToRedis() {
    try {
      const knex = strapi.connections.default;
      let all_recorded_attendance = await strapi.query("new-attendance").find({ _limit: -1 });
      let attendance_ids = all_recorded_attendance.map((item) => item.id);
      console.log("INFO: attendance syncing starting for ", attendance_ids.length);
      if (attendance_ids.length > 0) {
        let attendace_sql_raw = `SELECT
        t1.date,
        t1.id,
        t1.project_id,
        t1.created_at,
        t2.name AS shift_name,
        t3.name AS project_name,
        (SELECT Count(t4.attendance_id) FROM attendance_details AS t4 WHERE t4.attendance_id = t1.id) AS total_workers,
        t5.approved_by,
        t6.full_name AS approved_by_name,
        t5.id AS attendance_status_id,
        t5.approved_time,
        t5.status
        FROM new_attendances AS t1
        LEFT JOIN shifts AS t2 ON t2.id = t1.shift_id
        LEFT JOIN projects AS t3 ON t3.id = t1.project_id
        LEFT JOIN attendance_statuses AS t5 ON t5.attendance_id = t1.id
        LEFT JOIN client_users AS t6 ON t6.user_id = t5.approved_by
        WHERE t1.id IN (${attendance_ids})`;
        let attendance_data = await knex.raw(attendace_sql_raw);
        await redisClient.set(`client-attendance-list`, JSON.stringify(attendance_data[0]));
      }
      console.log("INFO: attendance syncing end for ", attendance_ids.length);
    } catch (error) {
      console.log('error in syncAttendanceToRedis  ', error.message);
    }
  },

  // create and update attendance
  async createUpdateAttendance(data, mode) {
    let { workers_assigned: _, ...params } = data; // this is ES6 to remove property and value workers_assigned
    const attendance = await strapi.query("new-attendance").findOne({ project_id: params.project_id, date: params.date, shift_id: params.shift_id });

    //Getting project name
    const project = await strapi.query("projects").findOne({ id: params.project_id });
    let notification_params = {
      project_id: params.project_id,
      date: params.date,
      shift_id: params.shift_id,
      project_name: project.name,
    };

    if (!attendance) {
      const { id } = await strapi.query("new-attendance").create(data, "createUpdateAttendance");
      const attendanceStatus = await createAttendanceStatus(id, null);
      await createUpdateAttendanceDetails(id, data, 'create', mode);

      let assigned_workers = await strapi.query("new-assigned-workers").find({ id: data.workers_assigned, _limit: -1 });
      let workers_ids = assigned_workers.map((item) => item.worker_id);
      if (workers_ids.length > 0) {
        await registerWorkersToRssb(workers_ids);
      }
      // Adding attendanceId in notification params
      notification_params["attendance_id"] = id;
      notification_params["attendance_status_id"] = attendanceStatus?.id;
      // Adding pusher
      await NotifyClientAttendance(
        params.project_id,
        params.date,
        `The ${project.name} Attendance has been submitted at ${params.date}, Click to view attendance.`,
        notification_params
      );
    } else {
      const { id } = attendance;
      await createUpdateAttendanceDetails(id, data, 'update', mode);
      let assigned_workers = await strapi.query("new-assigned-workers").find({ id: data.workers_assigned, _limit: -1 });
      let workers_ids = assigned_workers.map((item) => item.worker_id);
      if (workers_ids.length > 0) {
        await registerWorkersToRssb(workers_ids);
      }
      notification_params["attendance_id"] = id;
      await NotifyClientAttendance(
        params.project_id,
        params.date,
        `The ${project.name} Attendance has been updated at ${params.date}, Click to view attendance.`,
        notification_params
      );
    }
    // await dashboardMetrics({ request: { body: { project: -1, year: -1, month: -1, redis: false } } });
  },
  // get attendance by knex
  async getAttendance(date, project_id, shift_id) {
    let response;
    const knex = strapi.connections.default;
    let attendance = await strapi
      .query("new-attendance")
      .findOne({ date: date, project_id: project_id, shift_id: shift_id });
    if (attendance) {
      let sql_raw = `SELECT 
                        t2.assigned_worker_id,
                        t2.id AS attendance_details_id,
                        t4.first_name,
                        t4.last_name,
                        t4.phone_number,
                        t4.nid_number,
                        t5.value,
                        t5.service_id,
                        t6.name AS service_name,
                        t7.address AS address,
                        t4.gender AS gender
                        FROM attendance_details AS t2
                        LEFT JOIN new_assigned_workers as t3 ON t2.assigned_worker_id = t3.id
                        LEFT JOIN service_providers as t4 ON t3.worker_id = t4.id
                        LEFT JOIN worker_rates as t5 ON t2.worker_rate_id = t5.id
                        LEFT JOIN services as t6 ON t5.service_id = t6.id
                        LEFT JOIN projects as t7 ON t3.project_id = t7.id
                        WHERE t2.attendance_id=${attendance.id}`;
      let attendance_workers = await knex.raw(sql_raw);
      response = {
        attendance: {
          attendance_id: attendance.id,
          date: attendance.date,
          shift_id: attendance.shift_id,
          supervisor_id: attendance.supervisor_id,
          project_id: attendance.project_id,
        },
        workers: attendance_workers[0],
      };
    }
    return response;
  },
  async updateWorkerStatus(weekRange) {
    // calculate the week range between now and N (weekRange) weeks
    const today = moment();
    const n_weeks_ago = moment().subtract(weekRange, "weeks");

    // filter params to get attendance between a given week range
    const params = {
      date_gte: n_weeks_ago.format(),
      date_lte: today.format(),
    };

    const data = await strapi.query("new-attendance").find(params);

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
          console.log(err);
        }
      }
    }

    // console.log(
    //   `number of workers in the past ${weekRange} weeks working in ${active_workers.size} project(s) total:`,
    //   number_of_active_workers
    // );

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
      // console.log(
      //   `number of active workers whose status didn't change the past ${weekRange} weeks:`,
      //   inactive_workers.length
      // );
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
          console.log(err);
        }
      });
    } catch (err) {
      console.log(err);
    }
  },
  async removeWorkers(data) {
    let { attendance_id, workers_assigned } = data;
    workers_assigned.forEach(async (item) => {
      let attendance_detail = await strapi
        .query("attendance-details")
        .findOne({ attendance_id: attendance_id, assigned_worker_id: item });
      let attendance = await strapi
        .query("new-attendance")
        .findOne({ id: attendance_id });
      let attendancelist = await strapi
        .query("attendancelist")
        .findOne({ attendance_id: attendance_id, assigned_worker_id: item });


      if (attendance_detail) {
        // check if payment exist
        let payment_exist = await checkIfPaymentExist(
          attendance.date,
          attendance.project_id,
          item
        );
        let worker_rate = await strapi.query("worker-rates").findOne({ id: attendance_detail.worker_rate_id });
        let amount = worker_rate ? worker_rate.value : 0;
        if (payment_exist.status_payment === "unpaid") {
          if (payment_exist.status === 200) {
            await removeFromAttendance(
              amount,
              payment_exist.payment_id,
              payment_exist.payroll_transaction_id,
              attendance.shift_id
            );
          }
        }
        // remove worker from attendance-details
        await strapi
          .query("attendance-details")
          .delete({ id: attendance_detail.id });
        // remove from new-attendance-list
        await saveAttendanceData(attendance_id, "delete");
        // build worker profile
        await removeAttendanceWorkerProfile(attendance_detail.id);
        // Adding pusher
        //await NotifyClientAttendance(params.project_id, params.date, `${project.name} Attendance.` );
      }

      if (attendancelist) {
        await strapi.query("attendancelist").delete({ id: attendancelist.id });
      }
    });
    await redisAttendance(data.attendance_id, "delete", workers_assigned.length);
  },

  async registerWorkersToRssbService(workers_ids) {
    let response = [];
    try {
      const workersInfos = await getWorkerDays(workers_ids);
      // workers with 90 days &&  having a national id number && without rss_code
      const permanentWorkers = _.filter(workersInfos, (item) => {
        if (item.nid_number && item.working_days >= parseInt(process.env.DEFAULT_WORKING_DAYS.toString())) {
          return item;
        }
      });
      if (permanentWorkers && permanentWorkers.length > 0) {
        response = await getRssbWorkerInfo(permanentWorkers);
      }
    } catch (error) {
      console.log('Error in registerWorkersToRssbService() ', error.message);
    }
    return response;
  }
};

async function registerWorkersToRssb(workers_ids) {
  let response = [];
  try {
    let workersInfos = await getWorkerDays(workers_ids);
    // workers with 30 days &&  having a national id number && without rss_code
    let permanentWorkers = _.filter(workersInfos, (item) => {
      if (item.nid_number && item.working_days >= parseInt(process.env.DEFAULT_WORKING_DAYS.toString())) { // TODO, >=30
        return item;
      }
    });
    if (permanentWorkers && permanentWorkers.length > 0) {
      response = await getRssbWorkerInfo(permanentWorkers);
    }
  } catch (error) {
    console.log('Line 407 service-providers  :: registerWorkersToRssb() ', error.message);
  }
  return response;
};

async function getRssbWorkerInfo(workersInfo) {
  let response = [];
  try {
    if (workersInfo.length > 0) {
      for (let index = 0; index < workersInfo.length; index++) {
        const item = workersInfo[index];
        if (item.nid_number.length === 16) {
          const rssbresponse = await getRssbKycs(item.nid_number);
          if (rssbresponse.status) {
            let workerUpdated = await updateWorkerInfoRssb(item, rssbresponse.data);
            if (workerUpdated) {
              response.push(item);
            }
          } else {
            console.log(`Worker with National ID ${item.nid_number}  ${rssbresponse.message} can't be found, Therefore we will not proceed with registering him/her on RSSB`);
          }
        }
      }
    }
  } catch (error) {
    console.log('Line 948   :: getRssbWorkerInfo()', error.message);
  }
  return response;
}

async function updateWorkerInfoRssb(worker_existing, rssbInfo) {
  let response = false;
  const updatedInfo = {};

  // Compare first_name
  if (worker_existing.first_name.toLowerCase() !== rssbInfo.firstName.toLowerCase()) {
    updatedInfo.first_name = rssbInfo.firstName.toLowerCase();
  }

  // Compare last_name
  if (worker_existing.last_name.toLowerCase() !== rssbInfo.lastName.toLowerCase()) {
    updatedInfo.last_name = rssbInfo.lastName.toLowerCase();
  }

  // Compare date_of_birth
  const rssbDateOfBirth = moment(rssbInfo.dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD');
  if (worker_existing.date_of_birth !== rssbDateOfBirth) {
    updatedInfo.date_of_birth = rssbDateOfBirth;
  }

  // verify the worker's phone number with the RSSB phone numbers
  if (verifyWorkerPhone(worker_existing.phone_number, rssbInfo.phoneNumbers)) {
    updatedInfo.is_verified = true;
  }

  let worker = await strapi.query('service-providers').update({ id: worker_existing.worker_id }, updatedInfo);
  if (worker) {
    response = true;
  }
  return response;
};


const verifyWorkerPhone = (worker_phone_number, rssb_phone_numbers) => {
  if (typeof worker_phone_number !== 'string' || !Array.isArray(rssb_phone_numbers)) {
    throw new TypeError('Invalid parameter types');
  }
  const maskedWorkerPhone = `25${worker_phone_number.slice(0, 3)}*****${worker_phone_number.slice(-2)}`;

  const phoneSet = new Set(rssb_phone_numbers.map(phone => phone.phoneNumber));
  const result = phoneSet.has(maskedWorkerPhone);
  return result;
};