'use strict';
let Validator = require('validatorjs');
const _ = require('underscore');
const moment = require("moment");
const { getAttendance, createUpdateAttendance, removeWorkers, syncAttendanceToRedis } = require("../services/new-attendance");
const { saveWorkerAttendance } = require("../../service-providers/services/service-providers");
const { getClientProjectsId } = require('../../projects/services/projects');
const { isPaymentAttendance } = require('../../deductions/services/deductions');
const utils = require('../../../config/functions/utils');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async generateManyAttendance(ctx) {
    let response = { status: "failed", data: [], error: "", meta: "" };
    try {
      let rules = {
        'project_id': 'required|integer',
        'start_date': 'required|string',
        'end_date': 'required|string',
        'assigned_worker_ids': 'required|array'
      };
      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        let { project_id, start_date, end_date, assigned_worker_ids } = ctx.request.body;
        const datesArray = [];
        let currentDate = moment(start_date);
        const formattedEndDate = moment(end_date).format('YYYY-MM-DD');

        while (currentDate.format('YYYY-MM-DD') <= formattedEndDate) {
          datesArray.push(currentDate.format('YYYY-MM-DD'));
          currentDate.add(1, 'day');
        }
        for (let i = 0; i < datesArray.length; i++) {
          let passed_body = {
            "project_id": project_id,
            "date": datesArray[i],
            "supervisor_id": 23,
            "shift_id": 1,
            "workers_assigned": assigned_worker_ids,
            "new_workers": []
          }
          // console.log(passed_body);
          createUpdateAttendance(passed_body, "normal");
        }

        response = {
          status: "success",
          data: "",
          error: "",
          meta: ""
        }
      } else {
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
      console.log("Error in generateManyAttendance() ", error.message);
    }
    return response;
  },

  async syncRedisAttendance(ctx) {
    let response;
    try {
      syncAttendanceToRedis();
      ctx.response.status = 200;
      response = {
        status: "success, sync started",
        data: "",
        error: "",
        meta: "",
      };
    } catch (error) {
      console.log("error syncRedisAttendance() ", error);
      ctx.response.status = 500;
      response = {
        status: "failed",
        data: "",
        error: error.message,
        meta: "",
      };
    }
    return response;
  },

  async counting(ctx) {
    const { project_id, start_date, end_date } = ctx.request.body
    let user = ctx.state.user;

    const query = { _limit: -1 };

    if (project_id && project_id === -1) {
      query.project_id = await getClientProjectsId(user.id);
    } else {
      query.project_id = project_id;
    }

    if (start_date && end_date) {
      query.date_gte = start_date
      query.date_lte = end_date
    }

    let response;
    const newCount = await strapi.query("new-attendance").count(query);

    response = {
      status: "success",
      statusCode: 200,
      data: newCount,
      error: "",
      meta: "",
    };
    return response;
  },

  // get attendance by knex

  async getAttendance(ctx) {
    let response;
    let { date, project_id, shift_id } = ctx.request.body;
    let rules = {
      project_id: "required|integer",
      date: "required|date",
      shift_id: "required|integer",
    };

    let validation = new Validator(ctx.request.body, rules);
    if (validation.passes()) {
      let response_data = await getAttendance(date, project_id, shift_id);
      response = {
        status: "success",
        statusCode: 200,
        data: response_data,
        error: "",
        meta: "",
      };
    } else {
      response = {
        status: "failed",
        data: validation.data,
        error: validation.failedRules,
        meta: validation.rules,
      };
    }

    return response;
  },
  async doAttendanceMultipleDays(ctx) {
    let response;
    let rules = {
      'project_id': 'required|integer',
      'supervisor_id': 'required|integer',
      'assigned_worker_id': 'required|integer'
    };
    let validation = new Validator(ctx.request.body, rules);
    if (validation.passes()) {
      response = {
        status: "success",
        data: "",
        error: "",
        meta: ""
      }
      addMultipleDaysAttendanceWorker(ctx.request.body, "normal");

    } else {
      response = {
        status: "failed",
        data: validation.data,
        error: validation.failedRules,
        meta: validation.rules,
      };
    }
    return response;
  },
  async doAttendance(ctx) {
    const response = {
      status: "failed",
      data: {},
      error: "",
      meta: ""
    };
    let rules = {
      'project_id': 'required|integer',
      'date': 'required|date',
      'supervisor_id': 'required|integer',
      'shift_id': 'required|integer'
    };

    let validation = new Validator(ctx.request.body, rules);
    const project = await strapi.query("projects").findOne({ id: ctx.request.body.project_id });

    if (validation.passes()) {
      if (project && project.supervisors.length >= 1) {
        let payment_type = await strapi.query('payment-types').findOne({ "type_name": "payroll" });
        if (payment_type) {
          // check if payment is avalaible  
          let payment_available = await isPaymentAttendance(
            ctx.request.body.project_id,
            ctx.request.body.date,
            payment_type.id
          );
          // if no add attendance
          if (payment_available === false) {
            if (!project) {
              response.status = "failed";
              response.error = "Project not found";
            } else {
              // Checking the projects rates before attempting to do an attendance.
              const project_rates = await strapi.query("rates").find({ project_id: ctx.request.body.project_id });
              const allServices = await strapi.query("services").find({ _limit: -1 });
              const extractedData = allServices.map(({ id, name }) => ({ id, name }));
              const nullResults = findServicesWithoutAssessmentRates(project_rates, extractedData);
              if (project && project.progress_status === "ongoing") {
                response.status = "success";
                response.data = validation.data;
                createUpdateAttendance(ctx.request.body, "normal");
                const { new_workers, project_id, date, supervisor_id, shift_id } = ctx.request.body;
                if (new_workers.length >= 0) {
                  const removed_worker_with_same_phone_number = utils.removeDuplicatesByProperty(new_workers, "phone_number");
                  const removed_worker_with_same_nid_number = utils.removeDuplicatesByProperty(removed_worker_with_same_phone_number, "nid_number");
                  removed_worker_with_same_nid_number.forEach(async (item) => {
                    if (!(item.services && parseInt(item.services) >= 1)) {
                      const services = await strapi.query("services").find({ _limit: -1 });
                      item.services = services.find((s) => s.name === "No service").id;
                    }
                    const new_worker_attendance = await saveWorkerAttendance(item, project_id, date, supervisor_id, shift_id, project_rates);
                    if (new_worker_attendance) {
                      console.log(new_worker_attendance.message);
                    }
                  });
                }
              } else {
                if (project.progress_status === "ongoing") { // we removed this function to make sure atttandance continue
                  ctx.response.status = 400;
                  response.status = "failed";
                  response.error = `we can't do an attendance because project rates for these services: ${nullResults.services} are not available or valid for this project, contact Fixa Admin to add them`;
                } else {
                  response.status = "failed";
                  response.error = "we can't do an attendance because project status is: " + project.progress_status;
                }
              }
            }
          } else { // if yes notify 
            ctx.response.status = 400;
            response.data = validation.data;
            response.error = "Attendance not created, Payment exist";
            response.meta = "";
          }
        } else { // if yes notify 
          ctx.response.status = 400;
          response.data = validation.data;
          response.error = "Attendance not created, Payment-type does not exist";
          response.meta = "";
        }
      } else {
        ctx.response.status = 400;
        response.data = [];
        response.error = "No supervisor assigned to this project";
        response.meta = "";
      }
    } else {
      ctx.response.status = 400;
      response.data = validation.data;
      response.error = validation.failedRules;
      response.meta = validation.rules;
    }
    return response;
  },
  async removeWorkerToAttendance(ctx) {
    let response;
    let rules = {
      attendance_id: "required|integer",
      workers_assigned: "required",
    };
    let validation = new Validator(ctx.request.body, rules);
    let attendance_status = await strapi
      .query("attendance-status")
      .findOne({ attendance_id: ctx.request.body.attendance_id });

    if (validation.passes() && attendance_status.status !== "approved") {
      response = {
        status: "success",
        data: validation.data,
        error: "",
        meta: "",
      };

      let payment_type = await strapi.query('payment-types').findOne({ "type_name": "payroll" });
      if (payment_type) {
        let attendance = await strapi.query('new-attendance').findOne({ id: ctx.request.body.attendance_id });
        if (attendance) {
          // check if payment is avalaible  
          let payment_available = await isPaymentAttendance(
            attendance.project_id,
            attendance.date,
            payment_type.id
          );
          if (payment_available === false) {
            removeWorkers(ctx.request.body);
          } else {
            ctx.response.status = 400;
            response = {
              status: "failed",
              data: "Attendance not created, Payment exist",
              error: "Attendance not created, Payment exist",
              meta: "",
            };
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "Attendance not available",
            error: "Attendance not available",
            meta: "",
          };

        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: "Incomplete Data",
          error: "Incomplete Data",
          meta: "",
        };

      }
    } else {
      response = {
        status: "failed",
        data: "we can't delete a worker in attendance if the attendance is approved",
        error: validation.failedRules,
        meta: validation.rules,
      };
    }

    return response;
  },

  // get notified of today's attendance
  async getAttendanceNotification(ctx) {
    const knex = strapi.connections.default;
    // get parameters
    const { date } = ctx.request.body;
    // const {date} =ctx.params;
    var today = new Date(date);
    var priorDate = new Date(new Date().setDate(today.getDate() - 30));

    let attendance = await strapi
      .query("new-attendance")
      .find({ date_gte: priorDate, date_lte: today, _sort: "id:desc" });
    let shifts = await strapi.query("shifts").find({ _limit: -1 });
    let services = await strapi.query("services").find({ _limit: -1 });
    let workers_info_attendance = [];
    for (let index = 0; index < attendance.length; index++) {
      // get attendance details
      // let attendance_details = await strapi.query("attendance-details").find({attendance_id:attendance.id,_limit:-1});
      let sql_raw = `SELECT 
        t1.assigned_worker_id AS assigned_worker_id,
        t1.attendance_id AS attendance_id,
        t4.id As worker_id,
        t6.name AS service_name,
        t7.name AS project_name,
        t6.id AS service_id,
        t8.status AS attendance_status,
        t9.name AS shift_name
        FROM attendance_details AS t1
        LEFT JOIN new_attendances AS t2 ON t2.id = t1.attendance_id
        LEFT JOIN new_assigned_workers AS t3 ON t3.id = t1.assigned_worker_id
        LEFT JOIN service_providers AS t4 ON t4.id =  t3.worker_id
        LEFT JOIN worker_rates AS t5 ON t5.id = t1.assigned_worker_id
        LEFT JOIN services AS t6 ON t6.id = t5.service_id 
        LEFT JOIN projects AS t7 ON t7.id = t3.project_id
        LEFT JOIN attendance_statuses AS t8 ON t8.attendance_id = t2.id
        LEFT JOIN shifts AS t9 ON t9.id = t2.shift_id
        WHERE t1.attendance_id=${attendance[index].id}`;

      let attendance_workers = await knex.raw(sql_raw);
      if (attendance_workers[0][0]) {
        workers_info_attendance.push({
          project_name: attendance_workers[0][0]["project_name"],
          status: attendance_workers[0][0]["attendance_status"],
          attendance_id: attendance[index].id,
          shift: getShiftName(shifts, attendance[index].shift_id),
          date: attendance[index].date,
          workers: getAttendanceInfo(attendance_workers[0], services),
        });
      }

      // get attendance statuses
    }

    return workers_info_attendance;
  },
};

const addMultipleDaysAttendanceWorker = async (data, mode) => {
  let body = {
    project_id: data.project_id,
    date: "",
    supervisor_id: data.supervisor_id,
    shift_id: 0,
    workers_assigned: [data.assigned_worker_id],
  };
  for (let index = 0; index < data.dates_shifts.length; index++) {
    body.date = data.dates_shifts[index].date;
    body.shift_id = data.dates_shifts[index].shift_id;
    if (body.date !== "" && body.shift_id !== 0) {
      await createUpdateAttendance(body, mode);
    }
  }
};

const getShiftName = (shifts, shift_id) => {
  let shif_name = "no";
  for (let index = 0; index < shifts.length; index++) {
    if (shifts[index].id == shift_id) {
      shif_name = shifts[index].name;
    }
  }
  return shif_name;
};

const getAttendanceInfo = (attendance, services) => {
  let attendance_info = "";
  for (let index = 0; index < services.length; index++) {
    let attendace_services = attendance.filter(
      (x) => x.service_id == services[index].id
    );
    if (attendance_info === "") {
      if (attendace_services.length > 0) {
        attendance_info = `${attendace_services.length} ${services[index].name}`;
      }
    } else {
      if (attendace_services.length > 0) {
        attendance_info = `${attendance_info}, ${attendace_services.length} ${services[index].name}`;
      }
    }
  }
  return attendance_info;
};

// check the availability of nulls in rates
const nullRatesAvailable = (rates, services) => {
  /** 
   * Function checks if all the rates are not null and greater than 0
   * Return true if the conditions are not met
   * Return false if the conditions are met
   * @param {Array of objects}
   * */
  const nullRates = [];

  if (!_.isEmpty(rates)) {
    const allRatesNotNull = _.every(rates, (rate) => {
      const isNotNull = (
        !_.isNull(rate.beginner_rate) &&
        !_.isNull(rate.intermediate_rate) &&
        !_.isNull(rate.advanced_rate) &&
        rate.beginner_rate > 0 &&
        rate.intermediate_rate > 0 &&
        rate.advanced_rate > 0
      );

      if (!isNotNull) {
        // find a service
        let nullService = services.filter(item => item.id === rate.service_id).map(item => item.name);
        nullRates.push(nullService[0]);
      }
      // return isNotNull;
    });

    if (allRatesNotNull) {
      // console.log("ALL RATES ARE NOT NULL");
      return {
        result: !allRatesNotNull,
        nullRates: nullRates
      }
    }
    // console.log("SOME RATES ARE not valid ===>:", allRatesNotNull);
    return {
      result: true,
      nullRates: nullRates
    }
  } else {
    // console.log("empty");
    return {
      result: true,
      nullRates: nullRates
    }
  }
};

const findServicesWithoutAssessmentRates = (rates, services) => {
  try {
    if (!Array.isArray(rates) || !Array.isArray(services)) {
      throw new Error('Rates and services are invalid, they should be array');
    }

    const serviceMap = new Map();
    services.forEach((service) => {
      serviceMap.set(service.id, service);
    });
    const servicesWithoutAssessmentRates = [];

    for (let i = 0; i < rates.length; i++) {
      const rate = rates[i];
      const hasAssessmentRates = (
        rate.beginner_rate != null &&
        rate.intermediate_rate != null &&
        rate.advanced_rate != null
      );
      if (!hasAssessmentRates) {
        // const service = services.find((s) => s.id === rate.service_id);
        const service = serviceMap.get(rate.service_id);
        if (service) {
          servicesWithoutAssessmentRates.push(service.name);
        }
      }
    }
    return {
      result: servicesWithoutAssessmentRates.length === 0,
      services: [...servicesWithoutAssessmentRates],
    };
  } catch (error) {
    console.error('An error occurred in findServicesWithoutAssessmentRates() ===> :', error);
  }
};
