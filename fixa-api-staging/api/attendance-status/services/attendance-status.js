'use strict';
const moment = require("moment");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
module.exports = {
    // create and update attendance status
    async createAttendanceStatus(attendance_id, done_by) {
        const status = 'pending';
        const approved_by = done_by;
        const approved_time = moment().format();
        const data = { attendance_id, status, approved_by, approved_time };
        const attendanceStatus = await strapi.query("attendance-status").create(data);
        return attendanceStatus;
    },
};
