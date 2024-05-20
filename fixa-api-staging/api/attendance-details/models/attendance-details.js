"use strict";
const {createUpdateAttendanceList} = require("../../attendancelist/services/attendancelist");
const { attendanceSaveWorkerProfile } = require("../../worker-profile/services/worker-profile");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async afterCreate(result, data, funcName) {
      switch (funcName) {
        case "createUpdateAttendanceDetails":
          //adding entries in attendanceList
          await attendanceSaveWorkerProfile(result.id);
          const knex = strapi.connections.default;
          let sql_raw = `SELECT 
                    t3.id AS assigned_worker_id,
                    t4.id AS worker_id,
                    t4.created_at AS worker_onboarded,
                    t4.first_name,
                    t4.last_name,
                    t4.gender,
                    t4.nid_number,
                    t7.address,
                    t5.service_id AS service_id,
                    t5.value AS daily_rate,
                    t6.name AS service,
                    t7.id AS project_id,
                    t8.attendance_id AS attendance_id,
                    t8.id AS attendance_details_id,
                    t9.shift_id AS shift_id,
                    t9.supervisor_id AS supervisor_id,
                    t10.name AS shift,
                    t9.date As attendance_date
                    FROM new_assigned_workers AS t3
                    LEFT JOIN service_providers as t4 ON t3.worker_id = t4.id
                    LEFT JOIN attendance_details as t8 ON t8.assigned_worker_id = t3.id
                    LEFT JOIN worker_rates as t5 ON t8.worker_rate_id = t5.id
                    LEFT JOIN services as t6 ON t5.service_id = t6.id
                    LEFT JOIN projects as t7 ON t3.project_id = t7.id
                    LEFT JOIN new_attendances as t9 ON t9.id = t8.attendance_id
                    LEFT JOIN shifts as t10 ON t10.id = t9.shift_id
                    WHERE t8.id=${result.id}`;
          let attendance_workers = await knex.raw(sql_raw);
          if (attendance_workers) {
            await createUpdateAttendanceList(
              JSON.stringify(attendance_workers[0][0])
            );
          }
          //adding entries in daily payroll
          //build worker profile and history for one worker
          let worker_status = await strapi
            .query("new-assigned-workers")
            .update(
              {
                worker_id: attendance_workers[0][0].worker_id,
                project_id: attendance_workers[0][0].project_id,
              },
              { is_active: true }
            )
            .catch((err) => {
              console.log(err.message);
            });
          if (worker_status) {
            // saveWorkerProfile({ worker_id: attendance_workers[0][0].worker_id, created_at: attendance_workers[0][0].worker_onboarded, project_id: attendance_workers[0][0].project_id });
          }
          break;
        default:
          return {
            status: "failed",
            statusCode: 400,
            message: "Failed recording attendanceList",
          };
      }

      return {
        status: "success",
        statusCode: 201,
        message: "attendanceList saved!",
      };
    }

  },
};

