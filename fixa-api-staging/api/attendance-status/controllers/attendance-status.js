'use strict';
const { buildPayroll } = require('../../payroll-details/services/payroll_details');
const { redisAttendance } = require("../../attendance-page/services/attendance-page");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    // update attendance status
    async appCreate(ctx) {
        let response;
        // attendance status id to update
        const { id } = ctx.params;
        // attendance status body to update
        let data = ctx.request.body;
        // let routine = await strapi.query("payroll-types").findOne({ name: data.type });
        // if (!routine) {
        //     response = {
        //         status: "Not found, make sure you have routine payroll type",
        //         statusCode: 404,
        //         data: [],
        //         error: "",
        //         meta: "",
        //     };
        //     return response;
        // }
        // check if attendance_status with id exist
        let attendance_status = await strapi.query("attendance-status").findOne({ id: id });
        let new_attendance_list = await strapi.query("new-attendance-list").findOne({ attendance_status_id: id });
        // if attendance_status exist
        if (attendance_status && new_attendance_list) {

            // check if payload sent is valid
            for (let key in data) {
                if (data[key] === undefined || data[key] === null || data[key].toString().includes("undefined")) {
                    return ctx.badRequest("Please provide all the required fields");
                }
            }

            let update_new_list = {
                attendance_status: data.status,
                approved_by: data.approved_by,
                approved_by_name: data.approved_by_name,
                approved_time: data.approved_time,
            }
            await strapi.query("attendance-status").update({ id }, data);
            await strapi.query("new-attendance-list").update({ attendance_status_id: id }, update_new_list);

            response = {
                status: "Successfully Updated",
                statusCode: 201,
                data: ctx.state.user,
                error: "",
                meta: "",
            };

        } else {
            return ctx.notFound("attendance-status does not exist");
        }
        return response;
    }
};
