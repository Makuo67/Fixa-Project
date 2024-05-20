'use strict';
const _ = require('underscore');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { exportExcel } = require('../../payroll-excel/services/payroll-excel');
const { getClientAttendanceAggregates } = require("../../attendance-page/services/attendance-page");

module.exports = {
    async getAggregate(ctx) {
        let aggregates = {};
        let response = {
            status: "failed",
            statusCode: 400,
            data: null,
            error: "",
            meta: "",
        };
        if (ctx.query._q) {
            // aggregates = await strapi.services.attendancelist.search(ctx.query);
        } else {
            let attendance = await strapi.query("new-attendance").findOne({ id: ctx.query.attendance_id });
            if (attendance) {
                const passed_service = ctx.query.service;
                const passed_gender = ctx.query.gender;
                const attendace_data = await getClientAttendanceAggregates(attendance.id, passed_service, passed_gender);
                let grouped_data = _.chain(attendace_data)
                    .groupBy("service_id")
                    .map((group, key) => {
                        return {
                            service_id: group[0]['service_id'],
                            service_name: group[0]['service_name'],
                            total_workers: group.length
                        };
                    })
                    .value();
                let total = 0;
                for (let index = 0; index < grouped_data.length; index++) {
                    const item = grouped_data[index];
                    total = total + parseInt(item.total_workers.toString());
                    aggregates[`${item.service_name}`] = item.total_workers;
                }
                aggregates['Total'] = total.toString()
            }
        }
        response.status = "success";
        response.statusCode = 200;
        response.data = aggregates;
        return response;
    },
    async exportAttendance(ctx) {
        let response;
        let file;

        try {
            // attendance id
            const { id } = ctx.params;
            //columns of data same as on frontend->data_index
            const { project_id, columns } = ctx.request.body;
            //Fetch the attendance db
            const data = await strapi.query("attendancelist").find({ attendance_id: id, project_id, _limit: -1 });
            // Saving data
            if (data.length > 0) {
                exportExcel(columns, data, 'attendance_list').then((res) => {
                    file = res;
                    return file;
                }).catch((error) => {
                    console.log('FILE attendance list', error.message);
                    return file;
                })
            }
            else {
                response = {
                    status: "No data to export!",
                    status_code: 400,
                    data: [],
                    error: error,
                    meta: ""
                }
            }

        } catch (error) {
            response = {
                status: "Failed",
                status_code: 400,
                data: [],
                error: 'System error',
                meta: "Check your params, project_id, attendance_id!"
            }
        }
        return response;
    },
    async updateAttendanceList(ctx) {
        const data = await strapi.query("service-providers").find({ _limit: -1 });
        console.log("the length is :: ", data.length);
        for (let i = 0; i < data.length; i++) {
            console.log("worker id::", data[i].id);
            let list = await strapi.query("attendancelist").find({ worker_id: data[i].id, _limit: -1 });
            for (let j = 0; j < list.length; j++) {
                console.log("attendancelist id::", list[j].id);
                await strapi.query("attendancelist").update({ id: list[j].id }, { nid_number: data[i].nid_number });
            }
        }
        return ctx.state.user;
    }

};
