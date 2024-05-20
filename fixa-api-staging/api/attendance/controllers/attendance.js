const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const _ = require('underscore');
let Validator = require('validatorjs');
let moment = require('moment');
const { createUpdateAttendance } = require("../../new-attendance/services/new-attendance");


const sendSMS = async (position, subject, shift) => {
  const apiInfo = {
    apiKey: process.env.AFRICA_S_TALKING_API_KEY,
    username: process.env.AFRICA_S_TALKING_USERNAME,
  };

  const senderID = "Fixa";

  var today = new Date();
  var time = formatAMPM(today);
  var todayDate = `${today.getDate()}/${today.getMonth() + 1
    }/${today.getFullYear()}`;

  function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var time = hours + ":" + minutes + " " + ampm;
    return time;
  }
  var message;

  if (subject === "new-attendance") {
    message = {
      title: "New Attendance report submitted",
      date: todayDate,
      shift: shift,
      workers: "500",
      submitted_by: "Damascene",
      time: time,
      extra: "Please approve on the Platform",
    };
  } else if (subject === "approved") {
    message = {
      title: "Attendance report approved",
      date: "03/10/2022",
      shift: shift,
      workers: "500",
      submitted_by: "Damascene",
      time: time,
      extra: "",
    };
  } else if (subject === "declined") {
    message = {
      title: "Attendance report declined",
      date: todayDate,
      shift: "Day",
      workers: "500",
      submitted_by: "Damascene",
      time: time,
      extra: "",
    };
  } else {
    console.log("Message subject is needed");
  }

  let phonesList = await strapi
    .query("sms-recipients")
    .find({ Position: position, _limit: -1 });

  let recipients = phonesList.map(function (e) {
    if (e.Position == position) {
      return e.Phone;
    } else {
      return "";
    }
  });

  const sender = [
    {
      phone_numbers: recipients,
      message: `${message.title}\n\nDate: ${message.date} \nShift: ${message.shift} \nWorkers: ${message.workers} \nBy: ${message.submitted_by}  At:  ${message.time}\n\n${message.extra}`,
    },
    {
      phone_numbers: ["+250727380161"],
      message: "Hello florien",
    },
  ];

  let sm = await strapi.services.sms.sendSMS(sender, apiInfo, senderID);

};

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */
  async trial(ctx) {
    const { id } = ctx.params;
    let data = {
      id: id,
      day_interval: "Mon - Sat",
      opening_hour: "7:30 PM",
      closing_hour: "10:00 PM",
    };
    const response = data;

    return response;
  },

  async appattendance(ctx) {
    let entity;
    let response;
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.attendance.create(data, { files });
    } else {
      // let rules = {
      //   'project_id': 'required|integer',
      //   'date': 'required|date',
      //   'supervisor_id': 'required|integer',
      //   'shift_id': 'required|integer',
      //   'workers_assigned': 'required'
      // };

      let rules = {
        project: "required|integer",
        company: "required|integer",
        job: "required|integer",
        date: "required|date",
        supervisor: "required|integer",
        workers: "required",
      };

      let validation = new Validator(ctx.request.body, rules);
      if (validation.passes()) {
        response = {
          status: "success",
          data: validation.data,
          error: "",
          meta: ""
        }
        makeAttendance(ctx.request.body); // old attendance
        // createUpdateAttendance(ctx.request.body); // new attendance
      } else {
        response = {
          status: "failed",
          data: validation.data,
          error: validation.failedRules,
          meta: validation.rules,
        };
      }
    }
    return response;
  },
  async filter(ctx) {
    let response;
    let results = [];
    if (!ctx.params) {
      response = {
        status: "failed",
        statusCode: 400,
        data: [],
        error: "Missing date in your request",
        meta: "Bad Request",
      };
    } else {
      const { shift, service } = ctx.query;
      const { date } = ctx.params;
      let entity = await strapi.query("attendance").findOne({ date: date });
      if (entity) {
        if (typeof shift === "string" && typeof service === "string") {
          _.each(entity.services, (s) => {
            if (s.shift === shift && s.service.id === parseInt(service)) {
              let workers_service = _.map(s.workers, (w) => {
                w.service_id = s.service.id;
                return w;
              });
              results = workers_service;
            }
          });
        } else if (typeof shift === "string" && typeof service != "string") {
          _.each(entity.services, (s) => {
            if (s.shift === shift) {
              let workers_service = _.map(s.workers, (w) => {
                w.service_id = s.service.id;
                return w;
              });
              results = [...new Set([...results, ...workers_service])];
            }
          });
        } else if (typeof shift != "string" && typeof service === "string") {
          _.each(entity.services, (s) => {
            let workers_service = _.map(s.workers, (w) => {
              w.service_id = s.service.id;
              return w;
            });
            if (s.service.id === parseInt(service)) {
              results = [...new Set([...results, ...workers_service])];
            }
          });
        } else if (typeof shift != "string" && typeof service != "string") {
          _.each(entity.services, (s) => {
            let workers_service = _.map(s.workers, (w) => {
              w.service_id = s.service.id;
              return w;
            });
            results = [...new Set([...results, ...workers_service])];
          });
        } else {
          results = [];
        }
        if (results.length >= 1) {
          results = _.uniq(results, (x) => x.id);
        }
      }



      response = {
        status: "success",
        statusCode: 200,
        data: results,
        error: "",
        meta: "",
      };
    }
    return response;
  },
  async filterClient(ctx) {
    let response = {
      status: "success",
      statusCode: 200,
      data: {},
      error: "",
      meta: "",
    };
    let data = { summary: null, done_by: null, workers_by_service: [] };
    const { project_id } = ctx.query;

    if (!ctx.params && project_id) {
      response = {
        status: "failed",
        statusCode: 400,
        data: {},
        error: "Missing date in your request",
        meta: "Bad Request",
      };
    } else {
      let rules = {
        date: "required|date",
      };
      let validation = new Validator({ date: ctx.params.date }, rules);
      let isvalidDate = moment(ctx.params.date, "YYYY-MM-DD", true).isValid();
      if (!validation.passes() || !isvalidDate) {
        response = {
          status: "failed",
          statusCode: 400,
          data: validation.data,
          error: "the format must be YYYY-MM-DD",
          meta: "",
        };
        return response;
      }
      const { date } = ctx.params;
      let entity = await strapi
        .query("attendance")
        .findOne({ date: date, project_id: project_id });
      let attendanceId;
      let day_shift_worker;
      let night_shift_worker;
      let results_day = [];
      let results_night = [];
      let provided_worker = await strapi
        .query("assigned-workers")
        .count({ job_id: 3 });
      let myservices = {};
      if (entity) {
        attendanceId = entity.id;
        _.each(entity.services, (s) => {
          if (s.shift === "day") {
            day_shift_worker = _.map(s.workers, (w) => {
              w.service_id = s.service.id;
              return w;
            });
            day_shift_worker.length;
            results_day = [...new Set([...results_day, ...day_shift_worker])];
          }
          if (s.shift === "night") {
            night_shift_worker = _.map(s.workers, (w) => {
              w.service_id = s.service.id;
              return w;
            });
            results_night = [
              ...new Set([...results_night, ...night_shift_worker]),
            ];
          }
          let index = s.service.name + "___" + s.shift;
          myservices[index] = 0;
        });

        data.id = attendanceId;
        data.summary = {
          provided_worker: provided_worker,
          daily_worker: results_day.length + results_night.length,
          day_shift_worker: results_day.length,
          night_shift_worker: results_night.length,
        };
        data.done_by = _.pick(entity.supervisor, [
          "id",
          "username",
          "email",
          "first_name",
          "last_name",
          "role",
        ]);
        data.done_by.submitted_time = entity.created_at;
        data.json_status = entity.json_status;
        for (const property in myservices) {
          for (let x = 0; x < entity.services.length; x++) {
            if (
              property.split("___")[0] === entity.services[x].service.name &&
              property.split("___")[1] === entity.services[x].shift
            ) {
              myservices[property] += entity.services[x].workers.length;
            }
          }
        }

        let restructured_services = [];
        for (const property in myservices) {
          let workers_number = myservices[property];
          if (property.split("___")[1] === "day") {
            restructured_services.push({
              service: property.split("___")[0],
              day_shift: workers_number,
              night_shift: 0,
              total: workers_number,
            });
          } else {
            let isAlradyIn = _.find(restructured_services, function (r) {
              return r.service === property.split("___")[0];
            });
            if (isAlradyIn) {
              isAlradyIn.night_shift = workers_number;
            } else {
              restructured_services.push({
                service: property.split("___")[0],
                day_shift: 0,
                night_shift: workers_number,
                total: workers_number,
              });
            }
          }
        }

        data.workers_by_service = restructured_services;

        response = {
          status: "success",
          statusCode: 200,
          data: data,
          error: "",
          meta: "",
        };
      }
    }
    return response;
  },
  async changeStatus(ctx) {
    let entity;
    let response;
    const { id } = ctx.params;
    const { status, approved_by, shift } = ctx.request.body;
    let attendance_to_edit = await strapi.query("attendance").findOne({ id });
    if (attendance_to_edit) {
      if (shift === "day") {
        attendance_to_edit.json_status.shift[0].approved_by = approved_by;
        attendance_to_edit.json_status.shift[0].approved_time = new Date();
        attendance_to_edit.json_status.shift[0].status = status;
      } else {
        attendance_to_edit.json_status.shift[1].approved_by = approved_by;
        attendance_to_edit.json_status.shift[1].approved_time = new Date();
        attendance_to_edit.json_status.shift[1].status = status;
      }
    }
    if (status === "approved") {
      sendSMS(["client"], "approved", shift);
    } else {
      sendSMS(["client"], "declined", shift);
    }
    entity = await strapi
      .query("attendance")
      .update({ id }, { json_status: attendance_to_edit.json_status });
    if (entity) {
      let sanitazed_entity = _.pick(entity, ["id", "json_status"]);
      response = {
        status: "success",
        statusCode: 200,
        data: sanitazed_entity,
        error: "",
        meta: "",
      };
      return response;
    } else {
      response = {
        status: "failed",
        statusCode: 404,
        data: {},
        error: "",
        meta: "",
      };
      return response;
    }
  },
};

const makeAttendance = async (data) => {
  try {
    for (let i = 0; i < data.workers.length; i++) {
      if (data.workers[i].worker_id === 0) {
        let isworkerIn = await strapi.query("service-providers").findOne({
          phone_number: data.workers[i].worker_body.phone_number,
          nid_number: data.workers[i].worker_body.nid_number,
        });
        if (!isworkerIn) {
          let workerbody = {
            first_name: data.workers[i].worker_body.first_name,
            last_name: data.workers[i].worker_body.last_name,
            phone_number: data.workers[i].worker_body.phone_number,
            carrier: "MTN",
            services: [data.workers[i].service_id],
            users: data.workers[i].worker_body.users,
            nid_number: data.workers[i].worker_body.nid_number,
            job: data.job,
            current_job: data.job,
          };
          let createWorker = await strapi
            .query("service-providers")
            .create(workerbody,"makeAttendance");
          data.workers[i].worker_id = createWorker.id;
          let assignworkerbody = {
            job_id: data.job,
            project_id: data.project,
            worker_id: createWorker.id,
            worker_first_name: createWorker.first_name,
            worker_last_name: createWorker.last_name,
            worker_phone_number: createWorker.phone_number,
          };
          await strapi.query("assigned-workers").create(assignworkerbody);
        } else {
          data.workers[i].worker_id = isworkerIn.id;
        }
      } else {
        let isassigned = await strapi
          .query("assigned-workers")
          .findOne({ worker_id: data.workers[i].worker_id });
        if (!isassigned || data.job !== isassigned.job_id) {
          let worker = await strapi
            .query("service-providers")
            .findOne({ id: data.workers[i].worker_id });
          let assignworkerbody = {
            job_id: data.job,
            project_id: data.project,
            worker_id: data.workers[i].worker_id,
            worker_first_name: worker.first_name,
            worker_last_name: worker.last_name,
            worker_phone_number: worker.phone_number,
          };
          await strapi.query("assigned-workers").create(assignworkerbody);
        }
      }
    }

    let attendanceprepared = prepareAttendanceBody(data);
    let attendancebody = {
      project_id: data.project,
      company: data.company,
      job: data.job,
      date: data.date,
      services: attendanceprepared,
      supervisor: data.supervisor,
    };

    let isDateAlreadyAttendanded = await strapi.query("attendance").findOne({ project_id: data.project, date: data.date });
    if (!isDateAlreadyAttendanded) {
      await strapi.query("attendance").create(attendancebody);
    } else {
      let id = isDateAlreadyAttendanded.id;
      await strapi.services.attendance.update({ id }, attendancebody);
    }
  } catch (error) {
    console.log("Error caught makeAttendance()", error.message);
  }
};

const prepareAttendanceBody = (data) => {
  let services = {};
  for (let i = 0; i < data.workers.length; i++) {
    let index = data.workers[i].service_id + "_" + data.workers[i].shift;
    services[index] = [];
  }

  Object.keys(services).forEach((key) => {
    for (let i = 0; i < data.workers.length; i++) {
      let spritedKey = key.split("_");
      if (
        parseInt(spritedKey[0]) === parseInt(data.workers[i].service_id) &&
        spritedKey[1] === data.workers[i].shift
      ) {
        data.workers[i].services = [key];
        services[key].push(data.workers[i]);
      }
    }
  });

  services = Object.values(services);
  let final_services = [];

  for (let i = 0; i < services.length; i++) {
    let workersarray = [];
    for (let x = 0; x < services[i].length; x++) {
      workersarray.push(services[i][x]["worker_id"]);
    }
    final_services.push({
      workers: workersarray,
      timestamp: data.date,
      service: services[i][0].service_id,
      shift: services[i][0].shift,
    });
  }
  return final_services;
};
