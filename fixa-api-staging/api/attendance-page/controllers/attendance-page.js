"use strict";
let Validator = require("validatorjs");
const moment = require("moment");
const { getAttendance, getExportAttendance, getClientAttendanceAggregates, attendanceWorkerCount } = require("../services/attendance-page");
const { getClientProjectsId } = require("../../projects/services/projects");
const { saveAttendanceData } = require("../../new-attendance-list/services/new-attendance-list")
const _ = require('underscore');
const utils = require("../../../config/functions/utils");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  /**
   *
   * @param {int} project_id
   * @param {string} period
   *
   * @returns {
   * "total_active_workers": {
   *      value: int,
   *      change: float
   * },
   * "total_shifts": {
   *      value: int,
   *      change: float
   * },
   * "total_day_shifts": {
   *      value: int,
   *      change: float
   * },
   * "total_night_shifts": {
   *      value: int,
   *      change: float
   * },
   * }
   */
  async getAggregates(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: {},
      errors: [],
      meta: [],
    };
    try {
      const { project_id, start_date, end_date } = ctx.request.body;
      // get logged user
      let user = ctx.state.user;

      if (typeof project_id === "undefined" || !project_id) {
        response.errors.push("project_id is required");
      }
      if (typeof start_date === "undefined" || !start_date) {
        response.errors.push("start date is required");
      } else if (typeof end_date === "undefined" || !end_date) {
        response.errors.push("end date is required");
      }

      if (response.errors.length !== 0) {
        ctx.response.status = 400;
        response.status_code = 400;
        response.status = "failure";
        return response;
      }

      const current_date = start_date
        ? moment(start_date, "YYYY/MM/DD")
        : moment();
      const range_date = end_date ? moment(end_date, "YYYY/MM/DD") : moment();

      const data = {
        total_active_workers: 0,
        total_shifts: 0,
        total_day_shifts: 0,
        total_night_shifts: 0,
      };

      const total_workers =
        await strapi.services.client_dashboard.countActiveWorkers(
          project_id,
          current_date.clone(),
          range_date.clone(),
          user
        );

      // const total_workers_last_period =
      //   await strapi.services.client_dashboard.countActiveWorkers(
      //     project_id,
      //     current_date.clone().subtract(1, period + "s"),
      //     period,
      //     user
      //   );

      // const total_workers_change =
      //   await strapi.services.client_dashboard.calculateAggregatesChange(
      //     total_workers,
      //     total_workers_last_period
      //   );

      const total_night_shifts =
        await strapi.services.client_dashboard.countShifts(
          project_id,
          current_date.clone(),
          range_date.clone(),
          "night",
          user
        );

      // const total_night_shifts_last_period =
      //   await strapi.services.client_dashboard.countShifts(
      //     project_id,
      //     current_date.clone().subtract(1, period + "s"),
      //     period,
      //     "night",
      //     user
      //   );

      // const total_night_shifts_change =
      // await strapi.services.client_dashboard.calculateAggregatesChange(
      //   total_night_shifts,
      //   total_night_shifts_last_period
      // );

      const total_day_shifts =
        await strapi.services.client_dashboard.countShifts(
          project_id,
          current_date.clone(),
          range_date.clone(),
          "day",
          user
        );

      // const total_day_shifts_last_period =
      //   await strapi.services.client_dashboard.countShifts(
      //     project_id,
      //     current_date.clone().subtract(1, period + "s"),
      //     period,
      //     "day",
      //     user
      //   );

      // const total_day_shifts_change =
      //   await strapi.services.client_dashboard.calculateAggregatesChange(
      //     total_day_shifts,
      //     total_day_shifts_last_period
      //   );

      // const total_shifts_change =
      //   await strapi.services.client_dashboard.calculateAggregatesChange(
      //     total_day_shifts + total_night_shifts,
      //     total_day_shifts_last_period + total_night_shifts_last_period
      //   );

      data.total_active_workers = total_workers;
      // data.total_active_workers.change = total_workers_change;

      data.total_shifts = total_day_shifts + total_night_shifts;
      // data.total_shifts.change = total_shifts_change;

      data.total_night_shifts = total_night_shifts;
      // data.total_night_shifts.change = total_night_shifts_change;

      data.total_day_shifts = total_day_shifts;
      // data.total_day_shifts.change = total_day_shifts_change;

      response.data = data;
    } catch (error) {
      console.log("Error in /client-dashboard/getAggregates()", error);
      response.errors.push("something went wrong...");
      ctx.response.status = 500;
      response.status_code = 500;
      response.status = "failure";
    }
    return response;
  },

  async getNewAttendanceDetailsClient(ctx) {
    let response;
    try {
      let user = ctx.state.user;
      const { id } = ctx.params;
      const response_attendance = await getClientAttendanceAggregates(id, null, null);
      if (response_attendance.length > 0) {
        let grouped_data = _.chain(response_attendance)
          .groupBy("service_id")
          .map((group, key) => {
            return {
              service_id: group[0]['service_id'],
              service_name: group[0]['service_name'],
              total_workers: group.length,
            };
          })
          .value();
        response = {
          status: "success",
          data: grouped_data,
          error: "",
          meta: "",
        };
      } else {
        response = {
          status: "success",
          data: [],
          error: "",
          meta: "",
        };
      }
    } catch (error) {
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

  async getProjectAttendance(ctx) {
    let response;
    try {
      const query_body = ctx.query;
      let attendace_result_paginated = [];
      let total_active_workers = 0;
      let total_night_shifts = 0;
      let total_day_shifts = 0;
      let total_shifts = 0;
      let total = 0;
      const supervisors = await strapi.query("user", "users-permissions").find({ role: 5 }); // willy: To write role 5 here, this is not good!
      console.log("line 233 ", query_body);
      const allAttendanceSaved_paginated = await strapi.query("new-attendance-list").find(query_body);
      query_body._start = "0";
      query_body._limit = "-1";
      total = await strapi.query("new-attendance").count(query_body);
      // const allAttendanceSaved = await strapi.query("new-attendance-list").find(query_body);
      attendace_result_paginated = allAttendanceSaved_paginated.map((item) => {
        return {
          date: item.date,
          id: item.attendance_id,
          project_id: item.project_id,
          created_at: item.attendance_created_at,
          shift_name: item.shift_name,
          project_name: item.project_name,
          total_workers: item.total_workers,
          approved_by: item.approved_by,
          approved_by_name: item.approved_by_name,
          attendance_status_id: item.attendance_status_id,
          approved_time: item.approved_time,
          status: item.attendance_status,
          done_by: ""
        };
      });

      for (let i = 0; i < attendace_result_paginated.length; i++) {
        const get_attendance = await strapi.query("new-attendance").findOne({ id: attendace_result_paginated[i].id });
        if (get_attendance) {
          const founded_supervisor = supervisors.find((item) => parseInt(get_attendance.supervisor_id) === parseInt(item.id));
          if (founded_supervisor) {
            attendace_result_paginated[i].done_by = `${founded_supervisor.first_name} ${founded_supervisor.last_name}`;
          }
        }
      }

      const created_updated_end = moment().format('YYYY-MM-DD');
      const created_updated_start = utils.getDateOneMonthAgo(created_updated_end);
      const knex = strapi.connections.default;
      const attendancelists = await knex.raw(`SELECT id,shift_id,attendance_date,service,worker_id,gender,project_id FROM attendancelists WHERE project_id=${query_body.project_id}`);
      const shifts = attendancelists[0].map((entity) => {
        return {
          id: entity.id,
          shift_id: entity.shift_id,
          attendance_date: entity.attendance_date,
          service: entity.service,
          worker_id: entity.worker_id,
          gender: entity.gender,
          project_id: entity.project_id
        };
      });
      let filtered_shifts = [];

      if (utils.isValidDate(query_body.date_gte) && utils.isValidDate(query_body.date_lte)) {
        filtered_shifts = shifts.filter(item => new Date(item.attendance_date) >= new Date(query_body.date_gte) && new Date(item.attendance_date) <= new Date(query_body.date_lte));
        filtered_shifts = filtered_shifts.filter(item => new Date(item.attendance_date) >= new Date(created_updated_start) && new Date(item.attendance_date) <= new Date(created_updated_end));
      } else {
        filtered_shifts = shifts.filter(item => new Date(item.attendance_date) >= new Date(created_updated_start) && new Date(item.attendance_date) <= new Date(created_updated_end));
      }

      total_active_workers = utils.removeDuplicatesByWorkerId(filtered_shifts).length;

      total_day_shifts = _.size(_.filter(shifts, (shift) => parseInt(shift.shift_id) === 1));
      total_night_shifts = _.size(_.filter(shifts, (shift) => parseInt(shift.shift_id) === 2));
      total_shifts = total_day_shifts + total_night_shifts;


      ctx.response.status = 200;
      response = {
        status: "Success",
        data: {
          aggregates: {
            total_active_workers,
            total_day_shifts,
            total_night_shifts,
            total_shifts
          },
          attendances: attendace_result_paginated,
          meta: {
            pagination: {
              pageSize: attendace_result_paginated.length,
              total: total
            }
          }
        },
        error: "",
        meta: "",
      };

    } catch (error) {
      console.log("error new Attendance client ", error.message);
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

  async getNewAttendanceClient(ctx) {
    let response;
    try {
      let rules = {
        end_date: "required|string",
        start_date: "required|string",
        project: "required|integer",
      };

      let { _limit, _start } = ctx.request.query;
      let attendace_result = [];

      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      // var attendance_redis = await redisClient.get(`client-attendance-list`);
      // var attendance = JSON.parse(attendance_redis);
      if (validation.passes()) {
        let allAttendanceSaved = await strapi.query("new-attendance-list").count();

        if (allAttendanceSaved > 0) {
          if (request_body.project === -1) {
            let projectss_id = await getClientProjectsId(ctx.state.user.id);  //client_user.client_projects.map((item) => item.id);
            let new_attendances = await strapi.query("new-attendance-list").find({
              date_gte: request_body.start_date,
              date_lte: request_body.end_date,
              project_id: projectss_id,
              _limit: _limit,
              _start: _start,
              _sort: "date:desc",
            });
            if (new_attendances.length !== 0) {
              attendace_result = new_attendances.map((item) => {
                return {
                  "date": item.date,
                  "id": item.attendance_id,
                  "project_id": item.project_id,
                  "created_at": item.attendance_created_at,
                  "shift_name": item.shift_name,
                  "project_name": item.project_name,
                  "total_workers": item.total_workers,
                  "approved_by": item.approved_by,
                  "approved_by_name": item.approved_by_name,
                  "attendance_status_id": item.attendance_status_id,
                  "approved_time": item.approved_time,
                  "status": item.attendance_status
                };
              });
            }
            ctx.response.status = 200;
            response = {
              status: "Success",
              data: attendace_result,
              error: "",
              meta: "",
            };
          } else {
            let new_attendances = await strapi.query("new-attendance-list").find({
              date_gte: request_body.start_date,
              date_lte: request_body.end_date,
              project_id: request_body.project,
              _limit: _limit,
              _start: _start,
              _sort: "date:desc",
            });
            if (new_attendances.length !== 0) {
              attendace_result = new_attendances.map((item) => {
                return {
                  "date": item.date,
                  "id": item.attendance_id,
                  "project_id": item.project_id,
                  "created_at": item.attendance_created_at,
                  "shift_name": item.shift_name,
                  "project_name": item.project_name,
                  "total_workers": item.total_workers,
                  "approved_by": item.approved_by,
                  "approved_by_name": item.approved_by_name,
                  "attendance_status_id": item.attendance_status_id,
                  "approved_time": item.approved_time,
                  "status": item.attendance_status
                };
              });
              // let attendance_ids = new_attendances.map((item) => item.id);
              // for (let index = 0; index < attendance_ids.length; index++) {
              //   const attendanceId = attendance_ids[index];
              //   let attendancesFound = attendance.filter((item) => item.id.toString() === attendanceId.toString());
              //   if (attendancesFound.length > 0) {
              //     attendace_result.push(attendancesFound[0])
              //   }
              // }
            }
            ctx.response.status = 200;
            response = {
              status: "Success",
              data: attendace_result,
              error: "",
              meta: "",
            };
            ctx.response.status = 200;

            response = {
              status: "Success",
              data: attendace_result,
              error: "",
              meta: "",
            };
          }
        } else {

          saveAttendanceData();
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
      console.log("error new Attendance client ", error.message);
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
  async getAttendanceClient(ctx) {
    let response;
    try {
      let rules = {
        end_date: "required|string",
        start_date: "required|string",
        project: "required|integer",
      };
      let { _limit, _start } = ctx.request.query;
      let validation = new Validator(ctx.request.body, rules);
      let request_body = ctx.request.body;
      if (validation.passes()) {
        let user_id = ctx.state.user.id;
        // get user_client
        var client_user = await strapi
          .query("client-users")
          .findOne({ user_id: user_id });

        if (client_user) {
          if (client_user.client_projects.length === 0) {
            ctx.response.status = 200;
            response = {
              status: "Success",
              data: [],
              error: "",
              meta: "",
            };
          } else {
            if (request_body.project === -1) {
              // get user_client projects_ids
              let projects_id = client_user.client_projects.map(
                (item) => item.id
              );
              var response_data = await getAttendance(
                request_body.start_date,
                request_body.end_date,
                projects_id,
                _limit,
                _start
              );
              ctx.response.status = 200;
              response = {
                status: "Success",
                data: response_data,
                error: "",
                meta: "",
              };
            } else {
              var response_data = await getAttendance(
                request_body.start_date,
                request_body.end_date,
                request_body.project,
                _limit,
                _start
              );
              ctx.response.status = 200;
              response = {
                status: "Success",
                data: response_data,
                error: "",
                meta: "",
              };
            }
          }
        } else {
          ctx.response.status = 400;
          response = {
            status: "failed",
            data: "",
            error: "Failed to get client user",
            meta: "",
          };
        }
      } else {
        ctx.response.status = 400;
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    } catch (error) {
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

  // get attendance by knex
  async getAttendaces(ctx) {
    let response;
    let { user } = ctx.state;
    let { start_date, end_date, project } = ctx.request.body;
    let { _limit, _start } = ctx.request.query;
    let rules = {
      project: "required",
      start_date: "required|date",
      end_date: "required|date",
    };

    let validation = new Validator(ctx.request.body, rules);
    if (validation.passes()) {
      let project_id;

      if (project && project === -1) {
        project_id = await getClientProjectsId(user.id);
      } else {
        project_id = project;
      }

      let response_data = await getAttendance(
        start_date,
        end_date,
        project_id,
        _limit,
        _start
      );

      response = {
        status: "success",
        statusCode: 200,
        data: response_data,
        error: "",
        meta: {
          firstname: user.firstname,
          lastname: user.lastname,
        },
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

  /**
   * get specific use
   */
  async getUser(ctx) {
    let { id } = ctx.request.query;
    let data = {};
    if (id) {
      let user_data = await strapi
        .query("user", "users-permissions")
        .find({ id: id });
      user_data.map((item) => {
        data = {
          id: item.id,
          first_name: item.first_name,
          last_name: item.last_name,
        };
      });
      return {
        status: "success",
        statusCode: 200,
        data: data,
        message: "user found",
      };
    } else {
      return ctx.badRequest("Missing id");
    }
  },

  /**
   * Search attendance according to project
   */
  async searchProject(ctx) {
    let response;
    let modData = [];

    let { start_date, end_date, project, search } = ctx.request.body;
    let { _limit, _start } = ctx.request.query;
    let { user } = ctx.state;
    let rules = {
      project: "required",
      start_date: "required|date",
      end_date: "required|date",
      search: "required",
    };

    let validation = new Validator(ctx.request.body, rules);
    if (validation.passes()) {
      let project_id;

      if (project && project === -1) {
        project_id = await getClientProjectsId(user.id);
      } else {
        project_id = project;
      }

      let response_data = await getAttendance(
        start_date,
        end_date,
        project_id,
        _limit,
        _start
      );

      response_data.map((item, i) => {
        if (
          item?.attendance?.project_name?.project_name
            ?.toString()
            .trim()
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        ) {
          modData.push({
            key: item.attendance.attendance_id,
            date: `${moment(item.attendance.date).format("YYYY/MM/DD")}`,
            shift: item.attendance.shift,
            project_name: `${item?.attendance?.project_name?.project_name}`,
            time_submitted: `${item.attendance.time_submitted}`,

            total_headcount: `${item.attendance.total_headcount}`,
            status: `${item.attendance.status}`,
            services: {
              helpers: `${item.attendance.total_helpers}`,
              masons: `${item.attendance.total_masons}`,
              steel_fixers: `${item.attendance.total_steel_fixers}`,
              carpenters: `${item.attendance.total_carpenters}`,
              electricians: `${item.attendance.total_electricians}`,
            },
          });
        }
      });

      response = {
        status: "success",
        statusCode: 200,
        data: modData,
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
  async exportAttendance(ctx) {
    let { start_date, end_date, project_id } = ctx.request.body;
    let entity;

    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };

    try {
      entity = await getExportAttendance(start_date, end_date, project_id);
      response.data = entity;
    } catch (error) {
      console.log(error.message);
      response.status_code = 400;
      response.status = "failure";
      response.errors.push(error);
    }
    return response;
  },
};

function getServiceName(services, service_id) {
  let service = { service_name: "", service_id: 0 };
  for (let index = 0; index < services.length; index++) {
    if (services[index].id.toString() === service_id.toString()) {
      service.service_id = services[index].id;
      service.service_name = services[index].name;
    }
  }
  return service;
}

function getServiceWorkes(worker, new_attendace_data, rates) {
  let attendace_data = new_attendace_data;
  if (attendace_data.length === 0) {
    let service = getServiceName(rates, worker.worker_service_id);
    attendace_data.push({
      service_id: worker.worker_service_id,
      service_name: service.service_name,
      total_workers: 1,
    });
  } else {
    for (let index = 0; index < attendace_data.length; index++) {
      if (
        worker.worker_service_id.toString() ===
        attendace_data[index].service_id.toString()
      ) {
        attendace_data[index].total_workers =
          attendace_data[index].total_workers + 1;
      } else {
        let service = getServiceName(rates, worker.worker_service_id);

        attendace_data.push({
          service_id: worker.worker_service_id,
          service_name: service.service_name,
          total_workers: 1,
        });
      }
    }
  }
  return attendace_data;
}
