'use strict';

const { saveAttendanceWorkerProfile, removeAttendanceWorkerProfile, getAttendanceWorkerInfo, getAllWorkerServices } = require("../../worker-profile/services/worker-profile");
const moment = require("moment");
const _ = require('underscore');
const { getUserLevel } = require("../../user-admin-access/services/user-admin-access");

module.exports = {
  async getWorkerAttendance(ctx) {
    let response = {};
    try {
      const { worker_id } = ctx.params;

      const workforce = await strapi.query("workforce").findOne({ worker_id });

      if (!workforce) {
        response = {
          status: 'failed',
          errors: ["workforce entry not found for worker id " + worker_id],
          meta: []
        }
        return response
      }

      if (workforce.attendance && workforce.attendance != -1) {
        response = {
          status: 'success',
          data: { attendance_rate: workforce.attendance },
          meta: []
        }
        return response
      }
      let assigned_worker = await strapi.query("new-assigned-workers").findOne({ worker_id: worker_id, _sort: 'created_at:DESC' });

      let worker_attendance_detail = await strapi.query("attendance-details").findOne({ assigned_worker_id: assigned_worker.id, _sort: 'created_at:DESC' });
      let worker = await strapi.query("service-providers").findOne({ id: worker_id });
      if (!assigned_worker) {
        return {
          "status": "failed",
          "errors": ["Could not find 'new-assigned-worker' entry for worker id " + worker_id],
          "meta": []
        }
      }
      if (!worker_attendance_detail) {
        return {
          "status": "failed",
          "errors": ["Could not find 'attendance-detail' entry for assigned worker id " + assigned_worker.id],
          "meta": []
        }
      }
      if (!worker) {
        return {
          "status": "failed",
          "errors": ["Could not find 'service-provider' entry for worker id " + worker_id],
          "meta": []
        }
      }
      let attendance_rate = await strapi.services['worker-profile'].getWorkerAttendance(worker_id, moment(worker.created_at), moment(worker_attendance_detail.created_at));

      if (attendance_rate == -1) {
        response = {
          status: 'failed',
          errors: ["Error calculating the attendance rate"],
          meta: []
        }
        return response
      }

      await strapi.query("workforce").update({ id: workforce.id }, { attendance: attendance_rate }).then(() => {
        console.log("Updated workforce id", workforce.id)
      })

      response = {
        status: 'success',
        data: { attendance_rate: attendance_rate },
        meta: []
      }
    } catch (error) {
      response = {
        status: 'failed',
        errors: error.message,
        meta: []
      }
    }
    return response;
  },
  /**
   * Retrieve records.
   *
   * @return {Array}
   */
  // async find(ctx) {
  //   let entities;
  //   if (ctx.query._q) {
  //     entities = await strapi.services['worker_profile'].search(ctx.query);
  //   } else {
  //     entities = await strapi.services['worker_profile'].find(ctx.query);
  //   }
  //   return entities.map((entity) => {
  //     // console.log(entity);
  //   });
  // },
  async buildWorkerProfileSaveAttendance(ctx) {
    let response = {};
    try {
      const { id } = ctx.params;
      if (id) {
        saveAttendanceWorkerProfile(id);
        response = {
          status: 'Success',
          errors: "Attendance  id received, Now Building worker profile",
          meta: []
        }
      } else {
        response = {
          status: 'failed',
          errors: "Attendance id required",
          meta: []
        }
      }
    } catch (error) {
      response = {
        status: 'failed',
        errors: error.message,
        meta: []
      }
    }
    return response;
  },
  async buildWorkerProfileRemoveAttendance(ctx) {
    let response = {};
    try {
      const { id } = ctx.params;
      if (id) {
        removeAttendanceWorkerProfile(id);
        response = {
          status: 'Success',
          data: [],
          errors: "Attendance details id received, Now Building worker profile",
          meta: []
        }
      } else {
        response = {
          status: 'failed',
          data: [],
          errors: "Attendance id required",
          meta: []
        }
      }
    } catch (error) {
      response = {
        status: 'failed',
        data: [],
        errors: error.message,
        meta: []
      }
    }
    return response;
  },
  async getWorkerWorkingHistory(ctx) {
    let response = {
      status: "Failed",
      message: "",
      status_code: 400,
      data: null,
      error: "",
      meta: "",
    }
    let histories = [];
    let sum_day_shifts = 0;
    let sum_night_shifts = 0;
    let total_earnings = 0;
    let total_deductions = 0;
    let project_id = [];
    let total_number_projects = 0;

    const { id } = ctx.params;
    // if (!ctx.query.project_id) {
    //   response.message = 'No Project Id found';
    //   return response;
    // }
    // get assigned workers
    const assigned_workers = await strapi.query("new-assigned-workers").find({ worker_id: id });
    const assigned_workers_ids = assigned_workers.map((item) => item.id);
    const worker_projects_ids = assigned_workers.map((item) => item.project_id);

    // project id from query
    if (ctx.query.project_id) {
      project_id = ctx.query.project_id
    } else {
      project_id = worker_projects_ids
    }
    // service id from query
    // if (ctx.query.service_id) {
    //   service_id = ctx.query.service_id
    // }
    // ALl worker projects
    const all_projects = await getWorkerProjects(worker_projects_ids, ctx.state.user.id);
    // all worker services
    const all_services = await getAllWorkerServices(id);
    // Attendance queries
    const attendanceQuery = { _limit: -1, project_id: project_id };

    if (ctx.query.working_date_gte) {
      attendanceQuery.date_gte = ctx.query.working_date_gte;
    }

    if (ctx.query.working_date_lte) {
      attendanceQuery.date_lte = ctx.query.working_date_lte;
    }
    // get attendance
    const all_attendances = await strapi.query("new-attendance").find(attendanceQuery);

    if (all_attendances.length > 0) {
      let data = [];
      const all_attendances_ids = all_attendances.map((item) => item.id);
      const workersAttendance = await getAttendanceWorkerInfo(assigned_workers_ids, all_attendances_ids);

      // filter by service id
      if (ctx.query.service_id && ctx.query.service_id !== "null" && ctx.query.service_id !== "") {
        data = filterDataByServiceId(workersAttendance, ctx.query.service_id);
      } else {
        data = workersAttendance;
      }
      // get the number of projects from data
      total_number_projects = countNumberOfProjects(data);

      for (let index = 0; index < data.length; index++) {
        const item = data[index];
        let daily_rate = 0;
        if (item['shift_name'].toString().toLowerCase() === 'day') {
          if (item['working_time'].toString().toLowerCase() == 'half') {
            sum_day_shifts = sum_day_shifts + 0.5;
          } else {
            sum_day_shifts = sum_day_shifts + 1;
          }

        } else {
          if (item['working_time'].toString().toLowerCase() == 'half') {
            sum_night_shifts = sum_night_shifts + 0.5;
          } else {
            sum_night_shifts = sum_night_shifts + 1;
          }

        }
        if (item['working_time'].toString().toLowerCase() == 'half') {
          daily_rate = parseInt(item['daily_earnings'].toString()) / 2;
        } else {

          daily_rate = parseInt(item['daily_earnings'].toString());
        }

        // total earnings, results from earings and deductions
        total_earnings = (total_earnings + daily_rate);
        const date = moment(item['date']).format("YYYY-MM-DD");
        const history_body = {
          date: date,
          project: {
            id: item['project_id'],
            name: item['project_name'],
          },
          supervisor: {
            id: item['supervisor_id'],
            name: item['supervisor_first_name'] + ' ' + item['supervisor_last_name'],
          },
          shift: {
            id: item['shift_id'],
            name: item['shift_name'],
            working_time: item['working_time']
          },
          service: {
            id: item['service_id'],
            name: item['service_name']
          },
          daily_earnings: daily_rate
        };
        histories.push(history_body);
      }

      const deduction = await strapi.query("deductions").find({ date_gte: ctx.query.working_date_gte, date_lte: ctx.query.working_date_lte, project_id: worker_projects_ids, assigned_worker_id: assigned_workers_ids });
      if (deduction.length > 0) {
        const total_deduction = deduction.reduce((sum, itm) => {
          return sum + parseInt(itm.deduction_amount.toString());
        }, 0);
        total_deductions = total_deduction;

      }

      const statistics = {
        shift: [
          {
            day: sum_day_shifts,
            night: sum_night_shifts
          }
        ],
        project: 1,
        total_projects: total_number_projects,
        total_deduction: total_deductions,
        total_earnings: parseInt(total_earnings.toString()) - (parseInt(total_deductions.toString()))
      };
      
      response.status = 'Success';
      response.status_code = 200;
      response.data = {
        statistics: statistics,
        history: histories,
        all_projects: all_projects,
        all_services: all_services,
      }

    } else {
      response.status = 'Success';
      response.status_code = 200;
      response.data = {
        statistics: {
          shift: [
            {
              day: 0,
              night: 0
            }
          ],
          project: 1,
          total_deduction: 0,
          total_earnings: 0,
          total_projects: 0
        },
        history: [],
        all_projects: all_projects,
        all_services: all_services,
      };
    }
    return response;
  },

  async getWorkerOldWorkingHistory(ctx) {
    let entities;
    let response = {
      status: "Failed",
      message: "",
      status_code: 400,
      data: null,
      error: "",
      meta: "",
    };
    const { id } = ctx.params;
    if (ctx.query.project_id == "null") {
      response.message = 'No Project Id found';
      return response;
    }
    if (ctx.query._q) {
      entities = await strapi.services["worker-profile"].search(ctx.query);

    } else {
      const filter = { ...ctx.query, worker_id: id, _sort: 'working_date:DESC' };
      entities = await strapi.services["worker-profile"].find(filter);
      entities.map((item) => {
        return item;
      })
    }
    let worker_day_shift = entities.reduce((sum, num) => {
      return num.shift_id === 1 ? sum + 1 : 0;
    }, 0);
    let worker_night_shift = entities.reduce((sum, num) => {
      return num.shift_id === 2 ? sum + 1 : 0;
    }, 0);
    let worker_history = await strapi.services["worker-profile"].find({
      worker_id: id,
      _limit: -1,
    });
    let all_worker_deduction = [];
    let worker_deduction = 0;

    let worker_earnings = 0;

    let worker_project = _.uniq(_.pluck(worker_history, "project_name")).length;

    let history_data = [];
    if (entities.length >= 1) {
      // console.log("starting sorting----------------------------");
      for (let index = 0; index < entities.length; index++) {
        const entity = entities[index];
        let daily_rate = 0;
        let project = await strapi.query("projects").findOne({ id: entity.project_id });
        if (project) {
          let assigned_worker = await strapi.query("new-assigned-workers").findOne({ worker_id: id, project_id: project.id });
          if (assigned_worker) {
            let attendance_detail = await strapi.query("attendance-details").findOne({ attendance_id: entity.attendance_id, assigned_worker_id: assigned_worker.id });
            if (attendance_detail) {
              let worker_rate = await strapi.query("worker-rates").findOne({ "id": attendance_detail.worker_rate_id });
              if (worker_rate) {
                let daily_earnings = worker_rate.value;

                let deduction = await strapi.query("deductions").findOne({ date: entity.working_date, project_id: project.id, assigned_worker_id: assigned_worker.id });
                if (deduction) {
                  all_worker_deduction.push(deduction['deduction_amount']);
                }
                if (attendance_detail['working_time'] == 'half') {
                  daily_rate = parseInt(daily_earnings.toString()) / 2;
                } else {

                  daily_rate = parseInt(daily_earnings.toString());
                }
              }
            }
          }
        }

        var new_obj = {
          date: entity.working_date,
          project: {
            id: entity.project_id,
            name: entity.project_name,
          },
          supervisor: {
            id: entity.supervisor_id,
            name: entity.supervisor_name,
          },
          shift: {
            id: entity.shift_id,
            name: entity.shift,
          },
          service: {
            id: entity.trade_id,
            name: entity.trade,
          },
          daily_earnings: daily_rate,
        };
        history_data.push(new_obj)
      }
      worker_earnings = history_data.reduce((sum, num) => {
        return sum + num.daily_earnings;
      }, 0);

      worker_deduction = all_worker_deduction.reduce((sum, num) => {
        return sum + num;
      }, 0);
    }

    let statistics = {
      shift: [{ day: worker_day_shift, night: worker_night_shift }],
      project: worker_project,
      total_deduction: worker_deduction,
      total_earnings: worker_earnings,
    };

    response = {
      status: "success",
      message: "",
      status_code: 200,
      data: {
        statistics: statistics,
        history: history_data,
      },
      error: "",
      meta: "",
    };

    return response;
  },
};

const getWorkerProjects = async (project_ids, user_id) => {
  let all_projects = [];
  let level_project_ids = [];
  const user_level = await getUserLevel(user_id);
  if (user_level.status) {
    if (user_level.data.user_level === "level_2" && user_level.data.client_info) {
      const level_projects = await strapi.query("projects").find({ client_id: user_level.data.client_info.id });
      level_project_ids = level_projects.map((item) => {
        return item.id
      });
    } else if (user_level.data.user_level === "level_1") {
      level_project_ids = [];
    } else {
      level_project_ids = [];
    }

    let passed_query_knex = "";
    let query_knex = "";
    if (level_project_ids.length >= 1) {
      for (let i = 0; i < level_project_ids.length; i++) {
        if (level_project_ids.length - 1 === i) {
          query_knex += `id= ${level_project_ids[i]} `;
        } else {
          query_knex += `id= ${level_project_ids[i]} OR `;
        }
      }
      if (query_knex === "") {
        passed_query_knex = "";
      } else {
        passed_query_knex = ` WHERE ${query_knex}`;
      }
    } else {
      passed_query_knex = "";
    }

    const knex = strapi.connections.default;
    const sql_raw = ` SELECT id, name FROM projects ${passed_query_knex}`;
    const raw_projects = await knex.raw(sql_raw);
    const projects = raw_projects[0];
    if (typeof project_ids === 'string') {
      project_ids = [parseInt(project_ids)];
    }
    if (project_ids.length > 0) {
      all_projects = project_ids.filter(project_id => project_id != 0).map(project_id => projects.find(project => project.id == project_id)).filter(project => project !== undefined);
    }
    return all_projects;
  }
};

/**
  * Filters data by service IDs.
  *
  * @param {Array} data - The data to filter.
  * @param {Array} serviceIds - The service IDs to filter by.
  * @returns {Array} - The filtered data.
  */
const filterDataByServiceId = (data, serviceIds) => {
  if (typeof serviceIds === 'string') {
    serviceIds = [parseInt(serviceIds)];
  }
  const serviceIdSet = new Set(serviceIds.map(Number));
  return data.filter(item => serviceIdSet.has(item.service_id));
};

/**
  * Returns the number of projects in the given data.
  *
  * @param {Array} data - The data to count projects in.
  * @returns {number} - The number of projects.
  */
const countNumberOfProjects = (data) => {
  const projectIds = new Set(data.map(item => item.project_id));
  return projectIds.size;
};