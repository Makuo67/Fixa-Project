"use strict";
const moment = require("moment");
const redisService = require("../../../config/redis");
const redisClient = redisService.getClient();
// const {redisAttendance} = require("../../attendance-details/services/attendance-details");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {

  async attendanceWorkerCount(attendance_ids) {
    let response = {
      status: 'failed',
      data: [],
      message: ""
    }
    try {
      const knex = strapi.connections.default;
      let attendace_sql_raw = `SELECT
    t3.id AS worker_id
    FROM attendance_details AS t1
    LEFT JOIN new_assigned_workers AS t2 on t1.assigned_worker_id = t2.id
    LEFT JOIN service_providers AS t3 on t2.worker_id = t3.id
    WHERE t1.attendance_id IN (${attendance_ids})
    `;
      let attendance_data = await knex.raw(attendace_sql_raw);
      // if(attendance_data[0].length >1){
      response.status = 'success';
      response.data = attendance_data[0];

    } catch (error) {
      response.message = error.message;
    }
    return response;
  },

  // save Redis Attendance
  async redisAttendance(attendance_id, mode, total_workers) {
    const knex = strapi.connections.default;
    try {
      let attendance = await strapi.query("new-attendance").findOne({ id: attendance_id });
      if (attendance) {
        // get redis attendance
        var attendance_redis_data = await redisClient.get(`client-attendance-list`);
        let attendance_redis = attendance_redis_data ? JSON.parse(attendance_redis_data) : [];
        if (attendance_redis && attendance_redis.length === 0) {
          let all_recorded_attendance = await strapi.query("new-attendance").find({ _limit: -1 });
          // get attendances ids
          let attendance_ids = all_recorded_attendance.map((item) => item.id);
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
            WHERE t1.id IN (${attendance_ids})
            `;
            let attendance_data = await knex.raw(attendace_sql_raw);

            await redisClient.set(`client-attendance-list`, JSON.stringify(attendance_data[0]))
          }
        } else {
          if (mode === 'create') {
            let attendace_sql_raw = `SELECT
              t1.date,
              t1.id,
              t1.project_id,
              t1.created_at,
              t2.name AS shift_name,
              t3.name AS project_name,
              (SELECT Count(t4.attendance_id) FROM attendance_details AS t4 WHERE t4.attendance_id = ${attendance_id}) AS total_workers,
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
            let attendanceToSyc = attendance_data[0];
            attendanceToSyc[0].total_workers = total_workers;
            if (attendance_redis) {
              let new_attendances = [...attendance_redis, ...attendanceToSyc]; // removed ...attendance_redis because to distracture a null object is not okay
              await redisClient.set(`client-attendance-list`, JSON.stringify(new_attendances))
            } else {
              let new_attendances = [...attendanceToSyc]; // removed ...attendance_redis because to distracture a null object is not okay
              await redisClient.set(`client-attendance-list`, JSON.stringify(new_attendances))
            }

          } else if (mode === 'update') {
            let attendance_index = attendance_redis.findIndex((item => item.id === attendance_id));
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
            let attendanceToSyc = attendance_data[0];
            attendanceToSyc[0].total_workers = parseInt(attendanceToSyc[0].total_workers) + parseInt(total_workers);
            attendance_redis[attendance_index] = attendanceToSyc[0];
            let new_attendances = attendance_redis;
            // let new_attendances = attendance_redis.filter((item) => item.total_workers != 0);
            await redisClient.set(`client-attendance-list`, JSON.stringify(new_attendances));
          } else if (mode === 'delete') {
            let attendance_index = attendance_redis.findIndex((item => item.id === attendance_id));
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
            let attendanceToSyc = attendance_data[0];
            attendanceToSyc[0].total_workers = parseInt(attendanceToSyc[0].total_workers) - parseInt(total_workers);
            attendance_redis[attendance_index] = attendanceToSyc[0];
            let new_attendances = attendance_redis;
            // let new_attendances = attendance_redis.filter((item)=> item.total_workers != 0);
            await redisClient.set(`client-attendance-list`, JSON.stringify(new_attendances));
          }
        }
      }
    } catch (error) {
      console.log("error in saveRedisAttendance()", error);
    }
  },

  async getClientAttendanceAggregates(attendance_id, passed_service, passed_gender) {
    let response = [];
    const knex = strapi.connections.default;
    let sql_query = `WHERE t1.id = ${attendance_id}`;
    if (passed_service && passed_gender) {
      sql_query = `WHERE t1.id = ${attendance_id} AND t3.name = '${passed_service}' AND t5.gender = '${passed_gender}'`;
    } else if (passed_service && !passed_gender) {
      sql_query = `WHERE t1.id = ${attendance_id} AND t3.name = '${passed_service}'`;
    } else if (!passed_service && passed_gender) {
      sql_query = `WHERE t1.id = ${attendance_id} AND t5.gender = '${passed_gender}'`;
    } else {
      sql_query = `WHERE t1.id = ${attendance_id}`;
    }
    const attendace_sql_raw = `SELECT
    t2.assigned_worker_id,
    t2.worker_service_id AS service_id,
    t3.name AS service_name,
    t4.worker_id,
    t5.gender
    FROM new_attendances AS t1
    LEFT JOIN attendance_details AS t2 ON t2.attendance_id = t1.id
    LEFT JOIN services AS t3 on t2.worker_service_id = t3.id
    LEFT JOIN new_assigned_workers AS t4 on t2.assigned_worker_id = t4.id
    LEFT JOIN service_providers AS t5 on t4.worker_id = t5.id
    ${sql_query}`;

    const attendance_data = await knex.raw(attendace_sql_raw);

    if (attendance_data[0].length > 0) {
      response = attendance_data[0];
    }

    return response;
  },

  async getClientAttendance(start_date, end_date, project, limit, start) {
    let response = [];
    let attendance = [];
    const knex = strapi.connections.default;
    attendance = await strapi.query("new-attendance").find({
      date_gte: start_date,
      date_lte: end_date,
      project_id: project,
      _limit: limit,
      _start: start,
      _sort: "date:desc",
    });
    let attendance_ids = attendance.map((item) => item.id);
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
      WHERE t1.id IN (${attendance_ids})
      `;

      let attendance_data = await knex.raw(attendace_sql_raw);
      response = attendance_data[0];

    }
    return response;
  },
  // get attendance by knex
  async getAttendance(start_date, end_date, project, limit, start) {
    let response = [];
    let attendance;
    const knex = strapi.connections.default;

    /**
     *  Specific project's attendances in time range filtering
     */
    attendance = await strapi.query("new-attendance").find({
      date_gte: moment(start_date).toISOString(),
      date_lte: moment(end_date).toISOString(),
      project_id: project,
      _limit: limit,
      _start: start,
      _sort: "date:desc",
    });

    for (let index of attendance) {
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
                            t7.name AS project_name,
                            t4.gender AS gender,
                            t8.status AS status,
                            t8.approved_by
                            FROM attendance_details AS t2
                            LEFT JOIN new_assigned_workers as t3 ON t2.assigned_worker_id = t3.id
                            LEFT JOIN service_providers as t4 ON t3.worker_id = t4.id
                            LEFT JOIN worker_rates as t5 ON t2.worker_rate_id = t5.id
                            LEFT JOIN services as t6 ON t5.service_id = t6.id
                            LEFT JOIN projects as t7 ON t3.project_id = t7.id
                            LEFT JOIN attendance_statuses as t8 ON t8.attendance_id=${index.id}
                            WHERE t2.attendance_id=${index.id}`;
        let attendance_workers = await knex.raw(sql_raw);
        let attendance = {
          attendance: {
            attendance_id: index.id,
            date: index.date,
            shift_id: index.shift_id,
            shift:
              index.shift_id == 1 ? "Day" : index.shift_id == 2 ? "Night" : "",
            supervisor_id: index.supervisor_id,
            project_id: index.project_id,
            total_headcount: attendance_workers[0].length,
            status: attendance_workers[0].map((item) => item.status)[0],
            approved_by: attendance_workers[0].map(
              (item) => item.approved_by
            )[0],
            time_submitted: moment(index.created_at).format("h:mm A"),
            total_helpers: attendance_workers[0].filter(
              (item) => item.service_name == "Helper"
            ).length,
            total_masons: attendance_workers[0].filter(
              (item) => item.service_name == "Mason"
            ).length,
            total_steel_fixers: attendance_workers[0].filter(
              (item) => item.service_name == "Steel Bender"
            ).length,
            total_carpenters: attendance_workers[0].filter(
              (item) => item.service_name == "Carpenter"
            ).length,
            total_electricians: attendance_workers[0].filter(
              (item) => item.service_name == "Electrician"
            ).length,
            total_plumbers: attendance_workers[0].filter(
              (item) => item.service_name == "Plumber"
            ).length,
            total_scaffolders: attendance_workers[0].filter(
              (item) => item.service_name == "Scaffolder"
            ).length,
            project_name: attendance_workers[0].find(
              (item) => item.project_name
            ),
          },
          workers: attendance_workers[0],
        };
        response.push(attendance);
      }
    }

    return response;
  },
  async getExportAttendance(start_date, end_date, project) {
    let response = [];
    let attendance;
    const knex = strapi.connections.default;
    let new_query = {};

    if (project && project != "All") {
      new_query = {
        date_gte: moment(start_date).toISOString(),
        date_lte: moment(end_date).toISOString(),
        project_id: project,
        _limit: -1,
        _sort: "date:desc",
      };
    } else {
      new_query = {
        date_gte: moment(start_date).toISOString(),
        date_lte: moment(end_date).toISOString(),
        _limit: -1,
        _sort: "date:desc",
      };
    }

    /**
     *  Specific project's attendances in time range filtering
     */
    attendance = await strapi.query("new-attendance").find(new_query);

    let day_shift = 0;
    let night_shift = 0;

    if (attendance) {
      for (let index of attendance) {
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
                                t7.name AS project_name,
                                t4.gender AS gender,
                                t8.status AS status,
                                t8.approved_by
                                FROM attendance_details AS t2
                                LEFT JOIN new_assigned_workers as t3 ON t2.assigned_worker_id = t3.id
                                LEFT JOIN service_providers as t4 ON t3.worker_id = t4.id
                                LEFT JOIN worker_rates as t5 ON t2.worker_rate_id = t5.id
                                LEFT JOIN services as t6 ON t5.service_id = t6.id
                                LEFT JOIN projects as t7 ON t3.project_id = t7.id
                                LEFT JOIN attendance_statuses as t8 ON t8.attendance_id=${index.id}
                                WHERE t2.attendance_id=${index.id}`;
        let attendance_workers = await knex.raw(sql_raw);

        let attendance = {
          attendance_id: index.id,
          date: index.date,
          day_shift: index.shift_id == 1 ? attendance_workers[0].length : "-",
          night_shift: index.shift_id == 2 ? attendance_workers[0].length : "-",
          total_workers: attendance_workers[0].length,
          status: attendance_workers[0].map((item) => item.status)[0],

          time_submitted: moment(index.created_at).format("h:mm A"),
          project_name: attendance_workers[0].find((item) => item?.project_name)
            ?.project_name,
        };
        response.push(attendance);
      }
    }

    return response;
  },
};
