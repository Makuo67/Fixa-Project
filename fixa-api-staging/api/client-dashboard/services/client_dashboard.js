"use strict";
const moment = require("moment");
const _ = require("underscore");
const { getClientProjectsId } = require("../../projects/services/projects");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async newCreateAttendancePlotData(start_date, end_date, period, project_id) {
    let workers = [];
    let workers_to_return = [];
    // get attendances in range of start_date and end_date
    let attendances_range = await strapi.query("new-attendance").find({
      date_gte: start_date,
      date_lte: end_date,
      _limit: -1,
      project_id: project_id,
    });
    for (let index = 0; index < attendances_range.length; index++) {
      // get workers from attendance_details
      let new_workers = await getWorkersService(
        attendances_range[index]["id"],
        attendances_range[index]["shift_id"],
        attendances_range[index]["date"]
      );
      workers = [...new_workers, ...workers];
    }

    // get project services active no duplicates
    workers_to_return = constructWorkers(workers);
    // construct final object according to period
    return workers_to_return;
  },

  async countActiveWorkers(project_id, start_date, end_date, user) {
    const query = { _limit: -1 };
    if (project_id && project_id == -1) {
      query.project_id_in = await getClientProjectsId(user.id);
    }

    if (project_id && project_id != -1) query.project_id = project_id;
    query.last_attendance_gte = start_date.format();
    query.last_attendance_lte = end_date.format();
    // get all attendances within a time range and specific project
    const attendances = await strapi.query("workforce").find(query);
    let active_workers = _.size(_.filter(attendances, (d) => d.is_active === true));
    return active_workers;
  },

  async countShifts(project_id, start_date, end_date, shift, user) {
    const query = { _limit: -1 };

    // Passing user to get his projects when projectID = -1
    // gives total of projects he is assigned to.
    if (project_id && project_id == -1) {
      query.project_id_in = await getClientProjectsId(user.id);
    }

    if (project_id && project_id != -1) query.project_id = project_id;
    if (shift) {
      const shift_entity = await strapi
        .query("shifts")
        .findOne({ name: shift });
      query.shift_id = shift_entity.id;
    }
    // const start_date = count_from.clone().startOf(period).format();
    // const end_date = count_from.clone().endOf(period).format();

    query.attendance_date_gte = start_date.format();
    query.attendance_date_lte = end_date.format();
    // get all attendances within a time range and specific project
    const shifts = await strapi.query("attendancelist").find(query);

    return shifts.length;
  },
  async calculateAggregatesChange(current, previous) {
    if (previous == 0) return 100.0;
    return ((current - previous) / previous) * 100;
  },
  /**
   * Count number of workers on one service for a given date and shift
   * @param {*} project_id
   * @param {*} date
   * @param {*} shift
   * @param {*} service_id
   * @returns
   */
  async countByServiceOnDate(project_id, date, shift, service_id) {
    const days_of_week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const query = {};

    if (project_id && project_id != -1) query.project_id = project_id;
    if (shift) {
      const shift_entity = await strapi
        .query("shifts")
        .findOne({ name: shift });
      query.shift_id = shift_entity.id;
    }
    if (date) {
      query.date_gte = moment(date, "YYYY/MM/DD").startOf("day").format();
      query.date_lte = moment(date, "YYYY/MM/DD").endOf("day").format();
    }

    const attendance = await strapi.query("new-attendance").findOne(query);
    const service = await strapi.query("services").findOne({ id: service_id });

    const data = {
      service_name: service.name,
      date: moment(date, "YYYY/MM/DD").format("MM/DD"),
      week_day: days_of_week[moment(date, "YYYY/MM/DD").day()],
      shift: shift,
      total: 0,
    };

    var result = 0;
    if (attendance) {
      // get attendance details from attendance
      const attendance_workers = await strapi
        .query("attendance-details")
        .find({ attendance_id: attendance.id, _limit: -1 });

      for (let j = 0; j < attendance_workers.length; j++) {
        // get worker rates from attendance details
        const worker_rate = await strapi.query("worker-rates").findOne({
          id: attendance_workers[j].worker_rate_id,
          service_id: service_id,
        });
        if (worker_rate) {
          result += 1;
        }
      }
      data.total = result;
    }

    return data;
  },
  async getActiveServicesInRange(project_id, count_from, range) {
    const query = { _limit: -1 };
    if (project_id && project_id != -1) query.project_id = project_id;
    if (range) {
      const start_date = count_from.clone().startOf(range).format();
      var end_date;

      if (range == "month") {
        end_date = count_from.clone().endOf(range).format();
        query.date_gte = start_date.slice(0, -15).replaceAll("-", "-");
        query.date_lte = end_date.slice(0, -15).replaceAll("-", "-");
      }
      if (range == "isoWeek") {
        end_date = count_from.clone().subtract(7, "days").clone().format();
        query.date_lte = start_date.slice(0, -15).replaceAll("-", "-");
        query.date_gte = end_date.slice(0, -15).replaceAll("-", "-");
      }
    }

    // get all attendances within a time range and specific project
    const attendances = await strapi.query("new-attendance").find(query);

    if (range == "month") {
      const n = await strapi.query("new-attendance").find(query);
    }

    let active_services = new Set();

    for (let i = 0; i < attendances.length; i++) {
      const attendance_workers = await strapi
        .query("attendance-details")
        .find({ attendance_id: attendances[i].id, _limit: -1 });

      for (let j = 0; j < attendance_workers.length; j++) {
        const worker_rate = await strapi.query("worker-rates").findOne({
          id: attendance_workers[j].worker_rate_id,
        });
        active_services.add(worker_rate.service_id);
      }
    }
    return Array.from(active_services);
  },
  async createAttendancePlotData(project_id, current_date, period) {
    const active_services = await this.getActiveServicesInRange(
      project_id,
      current_date.clone(),
      period
    );

    const result = [];

    var start_date = current_date.clone().startOf(period).add(1, "days");
    //  var end_date = current_date.clone().endOf(period);
    var end_date = moment(start_date).subtract(7, "days");

    do {
      for (let i = 0; i < active_services.length; i++) {
        const data_day = await this.countByServiceOnDate(
          project_id,
          start_date.clone().toDate(),
          "day",
          active_services[i]
        );
        const data_night = await this.countByServiceOnDate(
          project_id,
          start_date.clone().toDate(),
          "night",
          active_services[i]
        );
        if (data_day.total > 0) result.push(data_day);
        if (data_night.total > 0) result.push(data_night);
      }
    } while (start_date.subtract(1, "days").diff(end_date) > 0);

    // sum up similar entries
    var entity = {};
    const reduced_result = result.reduce(function (prev, curr) {
      var key = curr.week_day + "/" + curr.service_name + "/" + curr.shift;
      if (!entity[key]) {
        entity[key] = curr;
        prev.push(entity[key]);
      } else {
        entity[key].total = entity[key].total + curr.total;
      }
      return prev;
    }, []);

    return reduced_result;
  },
  async countAllServices(project_id, count_from, period, user) {
    const start_date =
      period == "isoWeek"
        ? moment(count_from).subtract(7, "days").format("YYYY-MM-DD")
        : count_from.clone().startOf(period).format();
    const end_date =
      period == "isoWeek"
        ? moment(count_from).format("YYYY-MM-DD")
        : count_from.clone().endOf(period).format();

    const all_services = await strapi
      .query("services")
      .find({ _limit: -1, service_status: "on" });

    const result = [];

    for (let i = 0; i < all_services.length; i++) {
      const service = all_services[i];
      let total_assigned = null;
      if (project_id == -1) {
        //All projects assigned to a client user.
        let custom_project_id = await getClientProjectsId(user.id);
        total_assigned = await strapi.query("workforce").count({
          last_attendance_gte: start_date,
          last_attendance_lte: end_date,
          trade_id: service.id,
          assigned: true,
          project_id: custom_project_id,
        });
      } else {
        total_assigned = await strapi.query("workforce").count({
          last_attendance_gte: start_date,
          last_attendance_lte: end_date,
          project_id: project_id,
          trade_id: service.id,
          assigned: true,
        });
      }
      const total_unassigned = await strapi.query("workforce").count({
        trade_id: service.id,
        assigned: false,
      });
      result.push({
        title: service.name,
        total_assigned: total_assigned,
        total_unassigned: total_unassigned,
      });
    }
    return result;
  },
  async getAttendanceStatus(project_id) {
    let attendanceStatus = "";
    // today's date
    let today = moment().format("YYYY-MM-DD");
    // Fetch the list of attendance
    //let attendancelistData = await strapi.query('attendancelist').find({ attendance_date: today, project_id });
    // find the status of the attendance.
    //let statusTable = await strapi.query('attendance-status').find({ attendance_id: attendancelistData[0].attendance_id });

    /*  if (statusTable[0].status) {
       attendanceStatus = statusTable[0].status;
     } else {
       attendanceStatus = null;
     } */

    return attendanceStatus;
  },
  async countTotalShiftsByService(project_id, date, period, user) {
    const query = {};
    const d = moment(date, "YYYY/MM/DD").startOf(period).format();

    // gives total of projects he is assigned to.
    if (project_id && project_id == -1) {
      query.project_id = await getClientProjectsId(user.id);
    }

    if (project_id && project_id != -1) query.project_id = project_id;
    if (period == "isoWeek") {
      query.attendance_date_gte = moment(date)
        .subtract(7, "days")
        .format("YYYY-MM-DD");
      query.attendance_date_lte = moment(date).format("YYYY-MM-DD");
    } else {
      query.attendance_date_gte = moment(date, "YYYY/MM/DD")
        .startOf(period)
        .format();
      query.attendance_date_lte = moment(date, "YYYY/MM/DD")
        .endOf(period)
        .format();

      /** if it is last month  */
      //   query.attendance_date_gte = moment(d).subtract(2, 'days').startOf(period).format('YYYY-MM-DD');
      //   query.attendance_date_lte = moment(d).subtract(2, 'days').endOf(period).format('YYYY-MM-DD');
    }

    const attendance = await strapi.query("attendancelist").find(query);

    const response = {
      status_code: 200,
      status: "success",
      data: [],
      errors: [],
      meta: [],
    };

    let good_data = [];
    let total_shifts = 0;

    attendance.forEach((x) => {
      if (
        good_data.some((val) => {
          return val["title"] == x["service"];
        })
      ) {
        // If yes! then increase the occurrence by 1
        good_data.forEach((k) => {
          if (k["title"] == x["service"]) {
            k["total"]++;
          }
        });
      } else {
        let a = {};
        a["title"] = x["service"];
        a["total"] = 1;
        good_data.push(a);
      }
      const initialValue = 0;
      total_shifts = good_data.reduce(
        (accumulator, currentValue) => accumulator + Number(currentValue.total),
        initialValue
      );

      response.data = good_data;
      response.meta = total_shifts;
    });

    return response;
  },
};

const getWorkersService = async (attendance_id, shift_id, date) => {
  const knex = strapi.connections.default;
  // get attendance_details
  let attendance_details = [];
  let attendance_details_sql_raw = `SELECT
                                  t3.name AS service_name,
                                  t5.date AS date,
                                  t4.name AS shift
                                  FROM attendance_details AS t1
                                  LEFT JOIN worker_rates AS t2 ON t1.worker_rate_id = t2.id
                                  LEFT JOIN new_attendances AS t5 ON t1.attendance_id = t5.id
                                  LEFT JOIN services AS t3 ON t2.service_id = t3.id
                                  LEFT JOIN shifts AS t4 ON t4.id = ${shift_id}
                                  WHERE t1.attendance_id =${attendance_id}`;
  let data = await knex.raw(attendance_details_sql_raw);

  return data[0];
};
const getWeekDay = (date) => {
  let new_date = "Mon";
  new_date = new Date(date).toLocaleString("en", {
    weekday: "long",
    timeZone: "UTC",
  });

  return new_date.slice(0, 3);
};

const constructWorkers = (workers) => {
  let new_workers = [];

  for (let index = 0; index < workers.length; index++) {
    if (checkWorker(workers[index], new_workers)) {
      new_workers = addNewWorker(workers[index], new_workers);
    } else {
      new_workers.push({
        service_name: workers[index].service_name,
        date: workers[index].date.toISOString().slice(5, 10).replace("-", "/"),
        week_day: getWeekDay(workers[index].date),
        shift: workers[index].shift,
        total: 1,
      });
    }
  }
  return new_workers;
};

const addNewWorker = (worker, workers) => {
  let new_workers = [];
  let { service_name, date, shift } = worker;
  for (let index = 0; index < workers.length; index++) {
    if (
      shift == workers[index].shift &&
      service_name == workers[index].service_name &&
      date.toISOString().slice(5, 10).replace("-", "/") ==
      workers[index].date.toString()
    ) {
      new_workers.push({
        service_name: workers[index].service_name,
        date: workers[index].date,
        week_day: getWeekDay(date),
        shift: workers[index].shift,
        total: workers[index].total + 1,
      });
    } else {
      new_workers.push(workers[index]);
    }
  }

  return new_workers;
};

const checkWorker = (worker, workers) => {
  let { service_name, date, shift } = worker;
  let status = false;
  for (let index = 0; index < workers.length; index++) {
    if (
      shift == workers[index].shift &&
      service_name == workers[index].service_name &&
      date.toISOString().slice(5, 10).replace("-", "/") ==
      workers[index].date.toString()
    ) {
      status = true;
    }
  }
  return status;
};
