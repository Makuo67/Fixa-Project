'use strict';
const { getAttendance, getAttendanceMobile,updateWorkerIdService } = require("../services/attendance-details");
const { checkIfPaymentExist } = require("../../payments/services/payments");
const { updateOnAttendace } = require("../../payroll-transactions/services/payroll-transactions");
const { getWorkerRates } = require("../services/attendance-details");
const { getPayrollTransactions } = require("../../payments/services/payments");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    // script to update workers data
  async updateWorkerId(){
   let response={'status':'starting'};
   updateWorkerIdService();
   return response;

  },
    async getAttendanceForMobileRange(ctx) {
        let response;

        try {
            if (ctx.query) {
                let workersAttendances = [];
                let attendances = await strapi.query("new-attendance").find(ctx.query);
                if (attendances && attendances.length >= 1) {

                    let all_attendances_ids = attendances.map((item) => item.id);
                    let attendances_json = await getPayrollTransactions(all_attendances_ids);
                    let attendances_data = JSON.parse(attendances_json);
                    workersAttendances = await getWorkerRates(attendances_data);

                }
                ctx.response.status = 200;
                response = {
                    status_code: 200,
                    error_message: {},
                    data: workersAttendances,
                };
            } else {

                ctx.response.status = 200;
                response = {
                    status_code: 200,
                    error_message: "Please Apply the filters",
                    data: {},
                };
            }
        } catch (error) {
            console.log("error in attendance range", error);
            ctx.response.status = 400;
            response = {
                status_code: 400,
                error_message: error.message,
                data: {},
            };
        }

        return response;
    },
    async getAttendanceForMobile(ctx) {
        let response = {
            status: "failed",
            message: "",
            statusCode: 400,
            data: null,
            error: "",
            meta: "",
        };
        if (ctx.query._q) {
            // aggregates = await strapi.services.attendancelist.search(ctx.query);
        } else {
            if (ctx.query.attendance_date && ctx.query.project_id) {
                let date = ctx.query.attendance_date;
                let project_id = ctx.query.project_id;
                let attendances = await strapi.query("new-attendance").find({ date, project_id });
                if (attendances && attendances.length >= 1) {
                    let ids = [];
                    attendances.forEach((item) => {
                        ids.push(item.id);
                    });
                    let my_attendances = JSON.parse(await getAttendance(ids));
                    if (!my_attendances.error) {
                        response.status = "success";
                        response.statusCode = 200;
                        response.data = my_attendances;
                    } else {
                        response.status = "failed";
                        response.statusCode = 200;
                        response.message = my_attendances.message;
                    }
                } else {
                    response.status = "failed";
                    response.statusCode = 200;
                    response.message = "No attendance found";
                }
            } else {
                response.status = "failed";
                response.statusCode = 200;
                response.message = "Please provide attendance date and project_id";
            }
        }
        return response;
    },
    // fucntion to get mobile attendance
    async getMobileAttendance(ctx) {
        let response;
        try {
            const { attendance_date, project_id } = ctx.query;
            // check for project
            const project = await strapi.query("projects").findOne({ id: project_id });
            if (project) {//if project is found
                //   get attendance
                let attendances = await strapi.query("new-attendance").find({ date: attendance_date, project_id });
                if (attendances.length > 0) { //if attendance is available
                    let attendances_ids = attendances.map((item) => item.id);
                    let attendance_response = await getAttendanceMobile(attendances_ids);
                    ctx.response.status = 200;
                    response = {
                        status: "success",
                        message: "",
                        statusCode: 200,
                        data: attendance_response,
                        error: "",
                        meta: "",
                    }
                } else { //if attendance is not available
                    ctx.response.status = 200;
                    response = {
                        status: "success",
                        message: "no attendance found",
                        statusCode: 200,
                        data: null,
                        error: "",
                        meta: "",
                    }
                }
            } else { //if project is not found
                ctx.response.status = 400;
                response = {
                    status: "failed",
                    message: "Invalid data, check project",
                    statusCode: 400,
                    data: null,
                    error: "Invalid data, check project",
                    meta: "",
                }
            }


        } catch (error) {
            console.log("error getting mobile attendance", error);
            ctx.response.status = 500;
            response = {
                status: "failed",
                message: error.message,
                statusCode: 500,
                data: null,
                error: error.message,
                meta: "",
            }
        }
        return response;
    },

    async halfShift(ctx) {
        let { workers_assigned, attendance_id } = ctx.request.body;
        let response = {
            status: "failed",
            statusCode: 400,
            data: [],
            error: "",
            meta: "",
        };
        try {
            workers_assigned.forEach(async (item) => {
                let attendance_detail = await strapi.query("attendance-details").findOne({ assigned_worker_id: item, attendance_id: attendance_id, working_time: 'full' });
                let attendance = await strapi.query("new-attendance").findOne({ id: attendance_id });
                // apply half-shift once
                if (attendance_detail) {
                    // check if payment exist
                    let payment_exist = await checkIfPaymentExist(attendance.date, attendance.project_id, item);
                    let worker_rate = await strapi.query("worker-rates").findOne({ id: attendance_detail.worker_rate_id });
                    let half_shift_value = parseInt(worker_rate.value) / 2;
                    if (payment_exist.status !== 404) {
                        if (payment_exist.status_payment === "unpaid") {
                            if (payment_exist.status === 200) {
                                await updateOnAttendace(
                                    half_shift_value,
                                    payment_exist.payment_id,
                                    payment_exist.payroll_transaction_id,
                                    attendance.shift_id,
                                    true
                                );
                            }
                        }
                    }
                    // update attendance-details table
                    await strapi.query("attendance-details").update({ id: attendance_detail.id }, { working_time: "half" });
                    response.status = "success";
                    response.statusCode = 201;
                }
            });
        } catch (error) {
            console.log("error half shift ", error);
        }
        return response;
    }
};


