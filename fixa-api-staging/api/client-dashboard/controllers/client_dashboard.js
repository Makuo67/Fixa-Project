"use strict";
const moment = require("moment");
const _ = require('underscore');
const { getClientProjectsId } = require("../../projects/services/projects");
const redisService = require("../../../config/redis");
const redisClient = redisService.getClient();
const { sanitizeEntity } = require("strapi-utils");
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
      const { project_id, period, start_date } = ctx.request.body;
      // get logged user
      let user = ctx.state.user;

      if (typeof project_id === "undefined" || !project_id) {
        response.errors.push("project_id is required");
      }
      if (typeof period === "undefined" || !period) {
        response.errors.push("period is required");
      } else if (
        period != "day" &&
        period != "isoWeek" &&
        period != "month" &&
        period != "quarter" &&
        period != "year"
      ) {
        response.errors.push(
          `period expected a value from: day, isoWeek, month, quarter, year. Received ${period} instead`
        );
      }

      if (response.errors.length !== 0) {
        ctx.response.status = 400;
        response.status_code = 400;
        response.status = "failure";
        return response;
      }

      const current_date = start_date ? moment(start_date, "YYYY/MM/DD") : moment();
      const end_date = current_date.clone().endOf(period);

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
          end_date.clone(),
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
          end_date.clone(),
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
          period,
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
      console.log("Error in /client-dashboard/getAggregates()", error.message);
      response.errors.push("something went wrong...");
      ctx.response.status = 500;
      response.status_code = 500;
      response.status = "failure";
    }
    return response;
  },
  /**
   *
   * @param {int} project_id
   * @param {string} period
   * @param {string} shift
   * @param {int} service_id
   *
   */
  async getAttendance(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const { project_id, period, start_date } = ctx.request.body;
      // get logged user
      let user = ctx.state.user;

      // validate request
      if (typeof project_id === "undefined" || !project_id) {
        response.errors.push("project_id is required");
      }
      if (typeof period === "undefined" || !period) {
        response.errors.push("period is required");
      }

      if (response.errors.length !== 0) {
        ctx.response.status = 400;
        response.status_code = 400;
        response.status = "failure";
        return response;
      }
      let custom_project_id = await getClientProjectsId(user.id);

      const data = await strapi.query("client-dashboard").findOne({ project_id: custom_project_id, period, data_type: "attendance_plot" });

      response.data = await cleanData(data.data);
      // response.data = data.data;
    } catch (error) {
      console.log("Error in /client-dashboard/getAttendance()", error.message);
      response.errors.push("something went wrong...");
      ctx.response.status = 500;
      response.status_code = 500;
      response.status = "failure";
    }
    return response;
  },
  /**
   *
   * @param {int} project_id
   *
   */
  async getTotalWorkers(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const { project_id, period, start_date } = ctx.request.query;
      // get logged user
      let user = ctx.state.user;

      if (typeof project_id === "undefined" || !project_id) {
        return ctx.badRequest(null, "project_id is missing");
      }
      if (typeof period === "undefined" || !period) {
        return ctx.badRequest(null, "period is missing");
      }
      const count_from = start_date
        ? moment(start_date, "YYYY/MM/DD")
        : moment();

      const data = await strapi.services.client_dashboard.countAllServices(
        project_id,
        count_from,
        period,
        user
      );

      const last_attendance_gte =
        period == "isoWeek"
          ? moment(start_date).subtract(7, "days").format("YYYY-MM-DD")
          : count_from.clone().startOf(period).format();
      const last_attendance_lte =
        period == "isoWeek"
          ? moment(start_date).format("YYYY-MM-DD")
          : count_from.clone().endOf(period).format();

      const total_workers = await strapi
        .query("workforce")
        .count({ last_attendance_gte, last_attendance_lte });
      response.data = data;
      response.meta = { total_workers };
    } catch (error) {
      console.log("ERROR in getTotalWorkers:", error.message);
      return ctx.badRequest(null, "something went wrong");
    }
    return response;
  },
  async totalShiftsByService(ctx) {
    const { project_id, period, date } = ctx.request.body;
    // get logged user
    let user = ctx.state.user;
    const total_shifts_by_service = await strapi.services.client_dashboard.countTotalShiftsByService(project_id, date, period, user);
    return total_shifts_by_service;
  },
  async getAttendanceByProject(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const { period, start_date, end_date, project_id } = ctx.request.body;
      let user = ctx.state.user;
      if (typeof period === "undefined" || !period) {
        return ctx.badRequest(null, "period is missing");
      } else if (period != "isoWeek" && period != "month") {
        return ctx.badRequest(
          null,
          `period expected a value from: isoWeek, month. Received ${period} instead`
        );
      }
      const current_date = start_date ? moment(start_date, "YYYY/MM/DD") : moment();
      let query = {};

      // All project assigned to user
      if (project_id && project_id === -1) {
        query.id = await getClientProjectsId(user.id);
      }
      else {
        query.id = project_id;
      }

      query._publicationState = "live";

      const projects = await strapi.query("projects").find(query);
      const data = [];
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];

        const total_workers =
          period == "isoWeek"
            ? await strapi.services.client_dashboard.countActiveWorkersRange(
              project.id,
              moment(start_date).subtract(7, "days").format("YYYY-MM-DD"),
              start_date
            )
            : period == "month"
              ? await strapi.services.client_dashboard.countActiveWorkersRange(
                project.id,
                moment(start_date).startOf(period).format("YYYY-MM-DD"),
                moment(start_date).endOf(period).format("YYYY-MM-DD"),
                user
              )
              : await strapi.services.client_dashboard.countActiveWorkers(
                project.id,
                current_date,
                period,
                user
              );

        data.push({
          project_name: project.name,
          total_workers: total_workers,
        });
      }
      response.data = data;
    } catch (error) {
      console.log("ERROR in getAttendanceByProject:", error.message);
      return ctx.badRequest(null, "something went wrong");
    }
    return response;
  },
  async getAttendanceOnDate(ctx) {
    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };
    try {
      const { date, project_id } = ctx.request.body;
      // get logged user
      let user = ctx.state.user;
      let query = {};
      // All project assigned to user
      if (project_id && project_id === -1) {
        query.id = await getClientProjectsId(user.id);
      }
      else {
        query.id = project_id;
      }
      query._publicationState = "live";
      const current_date = new Date();
      const projects = await strapi.query("projects").find(query);

      for (let i = 0; i < projects.length; i++) {
        let project_id = projects[i].id;
        var attendances = await strapi.query("new-attendance").find({ project_id: project_id, date: current_date, _limit: -1 });
        var attendance_project_info = await dataAttendaces(attendances, projects[i]);
        response.data.push(attendance_project_info);
      }
    } catch (error) {
      console.log("ERROR in getAttendanceOnDate:", error.message);
      return ctx.badRequest(null, "something went wrong");
    }
    return response;
  },
  async updateAttendancePlotData(ctx) {
    try {
      // *** week ***
      let today_date = moment().format("YYYY-MM-DD");
      let start_date_week = moment(today_date)
        .subtract(6, "days")
        .format("YYYY-MM-DD");
      let end_date_week = moment().format("YYYY-MM-DD");
      // *** month ****
      var first_day_month = moment(today_date)
        .startOf("month")
        .format("YYYY-MM-DD");
      var last_day_month = moment(today_date)
        .endOf("month")
        .format("YYYY-MM-DD");

      let workers = [];
      // *********** get data ***************
      const data_type = "attendance_plot";
      const periods = ["isoWeek", "month"];

      for (let index = 0; index < periods.length; index++) {
        if (periods[index] === "isoWeek") {
          saveDataToClientDashboard(
            periods[index],
            data_type,
            start_date_week,
            end_date_week
          );
        } else {
          saveDataToClientDashboard(
            periods[index],
            data_type,
            first_day_month,
            last_day_month
          );
        }
      }
      return workers;
    } catch (err) {
      console.log("error in updateAttendancePlotData ", err.message);
      return "something went wrong";
    }
  },
  async ClientMetrics(ctx) {
    try {
      const response = {
        status_code: 200,
        status: "failed",
        data: {
          //old data
          total_active_workers: {},
          total_shifts: {},
          total_day_shifts: {},
          total_night_shifts: {},
          //New datata
          total_workers: 0,
          active_male_workers: 0,
          active_female_workers: 0,
          total_project: 0,
          total_active_project: 0,
          total_inactive_project: 0,
          graph_shift: {},
          graph_attendance_by_shift: {},
          graph_attendance_by_project: {},
          graph_total_workers_by_services: {},
          graph_total_workers_by_projects: {},
        },
        errors: [],
        meta: [],
      };

      const ttlInSeconds = process.env.REDIS_KEY_EXPIRATION;

      const { project_id, period, start_date } = ctx.request.body;

      if (!project_id) {
        response.errors.push("project_id is required");
      }
      if (!period) {
        response.errors.push("period is required");
      } else if (period != "day" && period != "isoWeek" && period != "month" && period != "quarter" && period != "year") {
        response.errors.push(`period expected a value from: day, isoWeek, month, quarter, year. Received ${period} instead`);
      }

      if (response.errors.length !== 0) {
        ctx.response.status = 400;
        response.status_code = 400;
        response.status = "failure";
        return response;
      }
      // get logged user
      let user = ctx.state.user;
      let client_aggregates = await aggregates(project_id, period, start_date, user);

      const getcachedresults = await redisClient.get(`client-dashboard-aggregates-${user.email}-${project_id}-${period}-${moment().format("YYYY-MM-DD")}`);
      if (getcachedresults) {
        return JSON.parse(getcachedresults);
      }

      let client_aggregates_advanced = await calculateClientDashboardAgreegate(project_id, period, user);
      if (client_aggregates && client_aggregates_advanced) {
        response.status = "success";
        response.data.total_shifts = client_aggregates.total_shifts;
        response.data.total_day_shifts = client_aggregates.total_day_shifts;
        response.data.total_night_shifts = client_aggregates.total_night_shifts;
        response.data.total_workers = client_aggregates_advanced.total_workers;
        response.data.active_male_workers = client_aggregates_advanced.active_male_workers;
        response.data.active_female_workers = client_aggregates_advanced.active_female_workers;
        response.data.total_active_workers = client_aggregates_advanced.active_workers;
        response.data.total_project = client_aggregates_advanced.total_project;
        response.data.total_active_project = client_aggregates_advanced.total_active_project;
        response.data.total_inactive_project = client_aggregates_advanced.total_inactive_project;
        response.data.graph_total_workers_by_services = client_aggregates_advanced.graph_total_workers_by_services;
        response.data.graph_total_workers_by_projects = client_aggregates_advanced.graph_total_workers_by_projects;
        response.data.graph_total_shift_service = client_aggregates_advanced.graph_shift_service;
        response.data.graph_shift = client_aggregates_advanced.graph_shift;
        response.data.graph_attendance_by_shift = client_aggregates_advanced.graph_attendance_by_shift;
        response.data.graph_attendance_by_project = client_aggregates_advanced.graph_attendance_by_project;
        await redisClient.set(`client-dashboard-aggregates-${user.email}-${project_id}-${period}-${moment().format("YYYY-MM-DD")}`, JSON.stringify(response));
        await redisClient.expire(`client-dashboard-aggregates-${user.email}-${project_id}-${period}-${moment().format("YYYY-MM-DD")}`, ttlInSeconds);
      }
      return response;
    } catch (error) {
      console.log("Error happend in ClientMetrics() ", error);
      let response_error = {
        status_code: 200,
        status: "failed",
        data: {},
        errors: [],
        meta: [],
      };
      response_error.errors.push(error.message);
      return response_error;
    }
  }

};

const dataAttendaces = async (attendances, project) => {
  var attendance_body = {};
  var day_attendance = {};
  var night_attendance = {};
  if (attendances) {
    for (let index = 0; index < attendances.length; index++) {
      var attendances_details = await strapi
        .query("attendance-details")
        .count({ attendance_id: attendances[index].id });
      var shift = await strapi
        .query("shifts")
        .findOne({ id: attendances[index].shift_id });
      let { id } = await strapi
        .query("attendance-status")
        .findOne({ attendance_id: attendances[index].id });

      if (shift.name === "day") {
        day_attendance = {
          total: attendances_details,
          shift: shift.name,
          id: attendances[index].id,
          attendance_status_id: id
        };
      } else {
        night_attendance = {
          total: attendances_details,
          shift: shift.name,
          id: attendances[index].id,
          attendance_status_id: id
        };
      }
    }
    // construct body
    attendance_body = {
      title: project.name,
      project_id: project.id,
      day_attendance: day_attendance,
      night_attendance: night_attendance,
    };
  }
  return attendance_body;
};

const cleanData = async (data) => {
  const arr1 = data;
  const getDates = () => {
    let dates = [];
    for (let i = 0; i < arr1.length; i++) {
      if (!dates.includes(arr1[i]["date"])) {
        dates.push({ date: arr1[i]["date"], week_day: arr1[i]["week_day"] });
      }
    }
    return dates;
  };
  const arrangeData = (date) => {
    let sum_day = 0;
    let sum_night = 0;
    let services_shift_day = [];
    let services_shift_night = [];
    for (let i = 0; i < arr1.length; i++) {
      // day
      if (arr1[i]["date"] === date["date"] && arr1[i]["shift"] == "day") {
        sum_day = sum_day + arr1[i]["total"];
        if (!services_shift_day.includes(arr1[i]["service_name"])) {
          services_shift_day.push(arr1[i]["service_name"]);
        }
      }
      // night
      else if (
        arr1[i]["date"] === date["date"] &&
        arr1[i]["shift"] == "night"
      ) {
        sum_night = sum_night + arr1[i]["total"];
        if (!services_shift_night.includes(arr1[i]["service_name"])) {
          services_shift_night.push(arr1[i]["service_name"]);
        }
      }
    }
    return [
      {
        service_name: services_shift_day,
        date: date["date"],
        week_day: date["week_day"],
        shift: "day",
        total: sum_day,
      },
      {
        service_name: services_shift_night,
        date: date["date"],
        week_day: date["week_day"],
        shift: "night",
        total: sum_night,
      },
    ];
  };
  const getData = () => {
    let dates = getDates();
    let response = [];
    let final_response = [];
    for (let i = 0; i < dates.length; i++) {
      response = [...arrangeData(dates[i]), ...response];
    }
    for (let i = 0; i < response.length; i++) {
      if (response[i]["total"] != 0) {
        final_response.push(response[i]);
      }
    }
    const shifts = final_response,
      keys = ["date", "shift", "total"],
      filtered = shifts.filter(
        (
          (s) => (o) =>
            ((k) => !s.has(k) && s.add(k))(keys.map((k) => o[k]).join("|"))
        )(new Set())
      );
    return filtered;
  };
  //filter data before returning it
  let sortedData = getData(data);
  let temp = [];
  for (let i = 0; i < sortedData.length; i++) {
    for (let j = i + 1; j < sortedData.length; j++) {
      if (sortedData[i].date > sortedData[j].date) {
        temp = sortedData[i];
        sortedData[i] = sortedData[j];
        sortedData[j] = temp;
      }
    }
  }

  return sortedData;
};

const saveSingleProject = async (data, period, data_type, project_id) => {
  strapi
    .query("client-dashboard")
    .update({ project_id, period, data_type }, { data })
    .catch(() => {
      strapi
        .query("client-dashboard")
        .create({ period, project_id, data_type, data });
    });
};

const saveDataToClientDashboard = async (
  period,
  data_type,
  start_date_week,
  end_date_week
) => {
  let data_projects = [];

  // // get projects
  const projects = await strapi
    .query("projects")
    .find({ _limit: -1, _publicationState: "live" });
  projects.push({ id: -1 });
  for (let index = 0; index < projects.length; index++) {
    if (projects[index]["id"] !== -1) {
      let new_workers =
        await strapi.services.client_dashboard.newCreateAttendancePlotData(
          start_date_week,
          end_date_week,
          "",
          projects[index]["id"]
        );
      // client_dashboard for a single project
      saveSingleProject(new_workers, period, data_type, projects[index]["id"]);
      data_projects = [...new_workers, ...data_projects];
    }
  }
  saveSingleProject(data_projects, period, data_type, -1);
};
const aggregates = async (project_id, period, start_date, user) => {
  const data = {
    total_active_workers: 0,
    total_shifts: 0,
    total_day_shifts: 0,
    total_night_shifts: 0,
  };
  try {
    const current_date = start_date ? moment(start_date, "YYYY/MM/DD") : moment();

    let period_start_date = current_date.clone().startOf(period);
    let end_date = current_date.clone().endOf(period);

    if (period == "isoWeek") {
      period_start_date = current_date.clone().subtract(6, "days")
      end_date = current_date.clone()
    }

    const total_workers = await strapi.services.client_dashboard.countActiveWorkers(project_id, period_start_date.clone(), end_date.clone(), user);
    // const total_workers_last_period = await strapi.services.client_dashboard.countActiveWorkers(project_id, current_date.clone().subtract(1, period + "s"), period, user);
    // const total_workers_change = await strapi.services.client_dashboard.calculateAggregatesChange(total_workers, total_workers_last_period);
    const total_night_shifts = await strapi.services.client_dashboard.countShifts(project_id, period_start_date.clone(), end_date.clone(), "night", user);
    // const total_night_shifts_last_period = await strapi.services.client_dashboard.countShifts(project_id, current_date.clone().subtract(1, period + "s"), period, "night", user);
    // const total_night_shifts_change = await strapi.services.client_dashboard.calculateAggregatesChange(total_night_shifts, total_night_shifts_last_period);
    const total_day_shifts = await strapi.services.client_dashboard.countShifts(project_id, period_start_date.clone(), end_date.clone(), "day", user);
    // const total_day_shifts_last_period = await strapi.services.client_dashboard.countShifts(project_id, current_date.clone().subtract(1, period + "s"), period, "day", user);
    // const total_day_shifts_change = await strapi.services.client_dashboard.calculateAggregatesChange(total_day_shifts, total_day_shifts_last_period);
    // const total_shifts_change = await strapi.services.client_dashboard.calculateAggregatesChange(total_day_shifts + total_night_shifts, total_day_shifts_last_period + total_night_shifts_last_period);

    data.total_active_workers = total_workers;
    // data.total_active_workers.change = total_workers_change;

    data.total_shifts = total_day_shifts + total_night_shifts;
    // data.total_shifts.change = total_shifts_change;

    data.total_night_shifts = total_night_shifts;
    // data.total_night_shifts.change = total_night_shifts_change;

    data.total_day_shifts = total_day_shifts;
    // data.total_day_shifts.change = total_day_shifts_change;

    return data;
  } catch (error) {
    console.log("Error in /client-dashboard/getAggregates()", error);
  }
}


const calculateClientDashboardAgreegate = async (project_id, period, user) => {
  const answer = {
    total_workers: 0,
    active_workers: 0,
    active_male_workers: 0,
    active_female_workers: 0,
    total_project: 0,
    total_active_project: 0,
    total_inactive_project: 0
  };
  let graphLine;
  let graphShift = [];
  let created_updated_start = null;
  let created_updated_end = null;
  // const current_date = moment();
  // const year = current_date.format('YYYY');
  // const month = current_date.format('MM');
  // const today_month_day = moment(new Date()).format("DD/MM");
  const all_user_projects = project_id == -1 ? await getClientProjectsId(user.id) : [project_id];
  if (project_id) {
    created_updated_start = moment().startOf(period).format()
    created_updated_end = moment().endOf(period).format();

    if (period == "isoWeek") {
      created_updated_start = moment().subtract(6, "days").format()
      created_updated_end = moment().format();
    }

    let workforce = project_id == -1 ? await strapi.query("workforce").find({ project_id_in: all_user_projects, last_attendance_gte: created_updated_start, last_attendance_lte: created_updated_end, _limit: -1 }) : await strapi.query("workforce").find({ project_id, last_attendance_gte: created_updated_start, last_attendance_lte: created_updated_end, _limit: -1 });
    let workforce_sanitized = workforce?.map((entity) => sanitizeEntity(entity, { model: strapi.models.workforce }));
    let projects = project_id == -1 ? await strapi.query("projects").find({ id_in: all_user_projects }) : await strapi.query("projects").find({ id: project_id, _limit: -1 });
    let shift_types = await strapi.query("shifts").find();
    let shifts = project_id == -1 ? await strapi.query("attendancelist").find({ project_id_in: all_user_projects, attendance_date_gte: created_updated_start, attendance_date_lte: created_updated_end, _limit: -1 }) : await strapi.query("attendancelist").find({ project_id: project_id, attendance_date_gte: created_updated_start, attendance_date_lte: created_updated_end, _limit: -1 });
    // let attendances = project_id >= 1 ? await strapi.query("new-attendance").find({ project_id, date_gte: created_updated_start, date_lte: created_updated_end, _limit: -1 }) : await strapi.query("new-attendance").find({ date_gte: created_updated_start, date_lte: created_updated_end, _limit: -1 });
    let activeworkers = _.filter(workforce_sanitized, (d) => d.is_active === true);
    let totalactiveMaleWorker = _.size(_.filter(activeworkers, (worker) => worker.gender?.toLowerCase() === "male"));
    let totalactiveFemaleWorker = _.size(_.filter(activeworkers, (worker) => worker.gender?.toLowerCase() === "female"));
    // const shifts_small = _.map(shifts, (item) => ({
    //   names: item.names, 
    //   service: item.service, 
    //   project_id: item.project_id,
    //   attendance_date: item.attendance_date,
    //   shift_id: item.shift_id,
    //   worker_id:item.worker_id
    // }));

    //pie
    const workers_by_service = _.chain(shifts)
      .groupBy("service")
      .map((group, key) => {
        const workers = _.uniq(_.pluck(group, 'worker_id'));
        return {
          type: key,
          value: workers.length,
        };
      })
      .value();

    const total_workers = _.chain(shifts).groupBy("worker_id").size()

    const graphTotalWorkersByServices = {
      total: total_workers,
      data: workers_by_service,
    };

    const workers_by_project = _.chain(shifts)
      .groupBy("project_id")
      .map((group, key) => {
        const workers = _.uniq(_.pluck(group, 'worker_id'));
        return {
          type: _.find(projects, (p) => { return p.id == key; })?.name,
          value: workers.length,
        };
      })
      .value();

    let graphTotalWorkersByProjects = {
      total: _.reduce(workers_by_project, (sum, item) => sum + parseInt(item.value), 0),
      data: workers_by_project,
    };

    let graphTotalShiftByServices = {
      total: _.size(shifts),
      data: _.map(_.groupBy(shifts, 'service'), (val, key) => ({
        type: key,
        value: val.length,
      }))
    };

    let graphAttendanceByShift = { data: [], total: 0 }
    let graphAttendanceByProject = { data: [], total: 0 }

    const getGraphTotalWorkers = () => {
      const totalWorkersByService = _.chain(shifts)
        .groupBy(({ attendance_date, shift_id, service }) => `${attendance_date}_${shift_id}_${service}`)
        .map((group, key) => {
          const [attendance_date, shift_id, service] = key.split('_');
          const workers = _.uniq(_.pluck(group, 'worker_id'));
          return {
            worker_ids: workers,
            groupField: _.find(shift_types, (p) => { return p.id == shift_id; })?.name,
            seriesField: service,
            xField: moment(attendance_date).format("DD/MM"),
            yField: group.length,
          };
        })
        .sortBy('xField')
        .value();

      const totalWorkersByProjects = _.chain(shifts)
        .groupBy(({ attendance_date, project_id }) => `${attendance_date}_${project_id}`)
        .map((group, key) => {
          const [attendance_date, project_id] = key.split('_');
          const workers = _.uniq(_.pluck(group, 'worker_id'));
          return {
            worker_ids: workers,
            seriesField: _.find(projects, (p) => { return p.id == project_id; })?.name,
            xField: moment(attendance_date).format("DD/MM"),
            yField: workers.length,
          };
        })
        .sortBy('xField')
        .value();

      graphAttendanceByShift = { data: totalWorkersByService, total: total_workers }
      graphAttendanceByProject = { data: totalWorkersByProjects, total: graphTotalWorkersByProjects.total }
    }
    getGraphTotalWorkers()

    let projectInWorkForce = _.uniq(_.pluck(workforce, "project_id"));
    let realProject = [];
    for (let x = 0; x < projects.length; x++) {
      for (let y = 0; y < projectInWorkForce.length; y++) {
        if (projects[x].id === projectInWorkForce[y]) {
          realProject.push({
            id: projects[x].id,
            name: projects[x].name,
            progress_status: projects[x].progress_status,
          });
        }
      }
    }

    const total_shifts = _.chain(shifts)
      .groupBy(({ attendance_date, service }) => `${attendance_date}_${service}`)
      .map((group, key) => {
        const [attendance_date, service] = key.split('_');
        const shifts = group.length;

        return {
          name: service,
          day: moment(attendance_date).format("DD/MM"),
          shifts: shifts,
        };
      })
      .sortBy('xField')
      .value();

    // compute total and average for each day
    const totalAverageShifts = _.map(_.groupBy(total_shifts, 'day'), (item, day) => {
      const total = _.reduce(item, (sum, shift) => sum + shift.shifts, 0);
      const average = Math.round(total / item.length);

      const totalObject = {
        name: 'Total',
        day: day,
        shifts: total,
      };

      const averageObject = {
        name: 'Average',
        day: day,
        shifts: average,
      };

      return [totalObject, averageObject];
    });

    const flattenedShifts = _.flatten([...total_shifts, ...totalAverageShifts]);
    const sortedShifts = _.sortBy(flattenedShifts, 'day');
    graphLine = {
      total: _.size(shifts),
      data: sortedShifts,
    };

    answer.total_workers = _.size(workforce);
    answer.active_male_workers = totalactiveMaleWorker;
    answer.active_female_workers = totalactiveFemaleWorker;
    answer.active_workers = _.size(activeworkers);
    answer.total_project = _.size(realProject);
    answer.total_active_project = _.size(_.filter(realProject, (project) => project.progress_status === "ongoing"));
    answer.total_inactive_project = _.size(_.filter(realProject, (project) => project.progress_status != "ongoing"));
    answer.graph_total_workers_by_services = graphTotalWorkersByServices;
    answer.graph_total_workers_by_projects = graphTotalWorkersByProjects;
    answer.graph_shift = graphLine;
    answer.graph_shift_service = graphTotalShiftByServices;
    answer.graph_attendance_by_shift = graphAttendanceByShift;
    answer.graph_attendance_by_project = graphAttendanceByProject;
  }
  return answer;
}
