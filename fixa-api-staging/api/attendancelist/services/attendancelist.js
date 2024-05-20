'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    // create and update attendancelist
    async createUpdateAttendanceList(data) {
        let parsedData = JSON.parse(data);
        let { project_id, assigned_worker_id, attendance_id } = parsedData;
        parsedData.names = parsedData.first_name + " " + parsedData.last_name;
        const attendancelist = await strapi.query("attendancelist").findOne({ project_id, assigned_worker_id, attendance_id });
        if (!attendancelist) {
            if ((parseInt(parsedData.shift_id) === 1)) {
                parsedData.day = 1;
                parsedData.night = 0;
                parsedData.total_shift = parsedData.day + parsedData.night;
            } else {
                parsedData.day = 0;
                parsedData.night = 1;
                parsedData.total_shift = parsedData.day + parsedData.night;
            }
            await strapi.query("attendancelist").create(parsedData, "createUpdateAttendanceList");
        } else {
            let { id, day, night, total_shift } = attendancelist;
            let day_count = parseInt(day);
            let night_count = parseInt(night);
            let total_shift_count = parseInt(total_shift);
            if ((parseInt(parsedData.shift_id) === 1)) {
                day_count = day_count + 1;
                total_shift_count = day_count + night_count;
            } else {
                night_count = night_count + 1;
                total_shift_count = day_count + night_count;
            }
            await strapi.query("attendancelist").update({ id }, { day: day_count, night: night_count, total_shift: total_shift_count });
        }
    },
};
