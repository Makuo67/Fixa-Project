'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    // save attendance data
    async saveAttendanceData(attendance_id, mode) {
        const knex = strapi.connections.default;
        try {
            let allAttendanceSaved = await strapi.query("new-attendance-list").count();
            if (allAttendanceSaved > 0) {
                let attendance = await strapi.query("new-attendance").findOne({ id: attendance_id });
                if (attendance) {
                    if (mode === 'create') {
                        let attendace_sql_raw = `SELECT
                                t1.date,
                                t1.id AS attendance_id,
                                t1.project_id,
                                t1.created_at AS attendance_created_at,
                                t2.name AS shift_name,
                                t3.name AS project_name,
                                (SELECT Count(t4.attendance_id) FROM attendance_details AS t4 WHERE t4.attendance_id = ${attendance_id}) AS total_workers,
                                t5.approved_by,
                                t6.full_name AS approved_by_name,
                                t5.id AS attendance_status_id,
                                t5.approved_time,
                                t5.status AS attendance_status
                                FROM new_attendances AS t1
                                LEFT JOIN shifts AS t2 ON t2.id = t1.shift_id
                                LEFT JOIN projects AS t3 ON t3.id = t1.project_id
                                LEFT JOIN attendance_statuses AS t5 ON t5.attendance_id = t1.id
                                LEFT JOIN client_users AS t6 ON t6.user_id = t5.approved_by
                                WHERE t1.id =${attendance_id} `;

                        let attendance_data = await knex.raw(attendace_sql_raw);
                        await strapi.query("new-attendance-list").create({ ...attendance_data[0][0] });

                    } else if (mode === 'update') {
                        let attendace_sql_raw = `SELECT
                                t1.date,
                                t1.id AS attendance_id,
                                t1.project_id,
                                t1.created_at AS attendance_created_at,
                                t2.name AS shift_name,
                                t3.name AS project_name,
                                (SELECT Count(t4.attendance_id) FROM attendance_details AS t4 WHERE t4.attendance_id = ${attendance_id}) AS total_workers,
                                t5.approved_by,
                                t6.full_name AS approved_by_name,
                                t5.id AS attendance_status_id,
                                t5.approved_time,
                                t5.status AS attendance_status
                                FROM new_attendances AS t1
                                LEFT JOIN shifts AS t2 ON t2.id = t1.shift_id
                                LEFT JOIN projects AS t3 ON t3.id = t1.project_id
                                LEFT JOIN attendance_statuses AS t5 ON t5.attendance_id = t1.id
                                LEFT JOIN client_users AS t6 ON t6.user_id = t5.approved_by
                                WHERE t1.id =${attendance_id} `;

                        let attendance_data = await knex.raw(attendace_sql_raw);
                        await strapi.query("new-attendance-list").update({ attendance_id: attendance_id }, { ...attendance_data[0][0] });

                    } else if (mode === 'delete') {
                        let attendace_sql_raw = `SELECT
                                t1.date,
                                t1.id AS attendance_id,
                                t1.project_id,
                                t1.created_at AS attendance_created_at,
                                t2.name AS shift_name,
                                t3.name AS project_name,
                                (SELECT Count(t4.attendance_id) FROM attendance_details AS t4 WHERE t4.attendance_id = ${attendance_id}) AS total_workers,
                                t5.approved_by,
                                t6.full_name AS approved_by_name,
                                t5.id AS attendance_status_id,
                                t5.approved_time,
                                t5.status AS attendance_status
                                FROM new_attendances AS t1
                                LEFT JOIN shifts AS t2 ON t2.id = t1.shift_id
                                LEFT JOIN projects AS t3 ON t3.id = t1.project_id
                                LEFT JOIN attendance_statuses AS t5 ON t5.attendance_id = t1.id
                                LEFT JOIN client_users AS t6 ON t6.user_id = t5.approved_by
                                WHERE t1.id =${attendance_id}
                                `;

                        let attendance_data = await knex.raw(attendace_sql_raw);

                        await strapi.query("new-attendance-list").update({ attendance_id: attendance_id }, { ...attendance_data[0][0] });
                    }
                } else {
                    let attendance_list = await strapi.query("new-attendance-list").findOne({ attendance_id: attendance_id });
                    if (attendance_list) {
                        await strapi.query("new-attendance-list").delete({ attendance_id: attendance_id });
                    }
                }
            } else {
                let all_recorded_attendance = await strapi.query("new-attendance").find({ _limit: -1 });
                if (all_recorded_attendance.length > 0) {
                    let attendance_ids = all_recorded_attendance.map((item) => item.id);
                    let attendace_sql_raw = `SELECT
                                t1.date,
                                t1.id AS attendance_id,
                                t1.project_id,
                                t1.created_at AS attendance_created_at,
                                t2.name AS shift_name,
                                t3.name AS project_name,
                                (SELECT Count(t4.attendance_id) FROM attendance_details AS t4 WHERE t4.attendance_id = t1.id) AS total_workers,
                                t5.approved_by,
                                t6.full_name AS approved_by_name,
                                t5.id AS attendance_status_id,
                                t5.approved_time,
                                t5.status attendance_status
                                FROM new_attendances AS t1
                                LEFT JOIN shifts AS t2 ON t2.id = t1.shift_id
                                LEFT JOIN projects AS t3 ON t3.id = t1.project_id
                                LEFT JOIN attendance_statuses AS t5 ON t5.attendance_id = t1.id
                                LEFT JOIN client_users AS t6 ON t6.user_id = t5.approved_by
                                WHERE t1.id IN (${attendance_ids})`;

                    let attendance_data = await knex.raw(attendace_sql_raw);
                    await strapi.query("new-attendance-list").createMany(attendance_data[0]);
                }
            }
        } catch (error) {
            console.log('error in saveAttendanceData()', error.message);
        }
    },

    // get attendance data
    async getAttendanceData() {

    }
};
